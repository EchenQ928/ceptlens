import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLearningApi } from './learning-api.mjs';
import { createAttempt, finishAttempt, publicAttempt, validateAnswers } from './exam-engine.mjs';

let root, api, server, url, now;
const a = 'a'.repeat(48), b = 'b'.repeat(48);
const agent = { status: () => ({ enabled: false }), learn: vi.fn(async () => { throw Object.assign(new Error('暂未接入大模型 API'), { status: 503 }); }), grade: vi.fn() };
const choice = (id, type = 'single_choice') => ({ id, type, stem: '原题', options: [{ key: 'A', text: '选项一' }, { key: 'B', text: '选项二' }], correctAnswer: type === 'single_choice' ? ['A'] : ['A', 'B'], explanation: '参考解释', taxonomy: { primaryConcept: '概念' } });
const reference = { resource: 'question:single-0', title: '概念', quote: '原题', prefix: '', suffix: '', start: 0 };
async function call(path, data, token = a) {
  const response = await fetch(url + '/api/' + path, { method: data === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', 'x-modelpath-identity': token }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  return { status: response.status, ...await response.json() };
}
beforeEach(async () => {
  now = 1000000; root = await mkdtemp(join(tmpdir(), 'modelpath-community-test-'));
  await mkdir(join(root, 'content-libraries/questions'), { recursive: true });
  for (let i = 0; i < 5; i++) for (const type of ['single', 'multi']) await writeFile(join(root, `content-libraries/questions/${type}-${i}.json`), JSON.stringify(choice(`${type}-${i}`, type === 'single' ? 'single_choice' : 'multiple_choice')));
  api = await createLearningApi({ root, clock: () => now, agent });
  server = createServer((req, res) => api.handle(req, res, new URL(req.url, 'http://localhost'), (r, status, v) => { r.writeHead(status, { 'content-type': 'application/json' }); r.end(JSON.stringify(v)); }));
  await new Promise(r => server.listen(0, '127.0.0.1', r)); url = `http://127.0.0.1:${server.address().port}`;
  agent.learn.mockClear(); agent.grade.mockClear();
});
afterEach(async () => { await new Promise(r => server.close(r)); api.close(); await rm(root, { recursive: true, force: true }); });
it('persists a shared quote, exposes it to a second user, and isolates edit authority', async () => {
  await call('session', { name: '同事 A' }); await call('session', { name: '同事 B' }, b);
  const created = await call('discussions', { id: 'thread-001', reference, body: '这里是什么意思？' });
  expect(created.status).toBe(200);
  expect((await call('discussions?resource=question:single-0', undefined, b)).discussions[0].messages[0].author.name).toBe('同事 A');
  const reply = await call('discussions/thread-001', { action: 'reply', id: 'reply-0001', body: '可以这样理解。' }, b);
  expect(reply.discussion.messages).toHaveLength(2);
  expect((await call('discussions/thread-001', { action: 'edit', messageId: created.discussion.messages[0].id, body: '篡改' }, b)).status).toBe(403);
  expect((await call('discussions/thread-001', { action: 'resolve' }, b)).status).toBe(403);
  expect((await call('discussions/thread-001', { action: 'resolve' })).discussion.status).toBe('resolved');
});
it('deduplicates retried writes and retains both concurrent replies', async () => {
  const data = { id: 'thread-002', reference, body: '重复提交' };
  await Promise.all([call('discussions', data), call('discussions', data)]);
  await Promise.all([call('discussions/thread-002', { action: 'reply', id: 'reply-0002', body: 'A' }), call('discussions/thread-002', { action: 'reply', id: 'reply-0003', body: 'B' }, b)]);
  await call('discussions/thread-002', { action: 'reply', id: 'reply-0003', body: 'B' }, b);
  expect((await call('discussions?resource=question:single-0')).discussions).toHaveLength(1);
  expect((await call('discussions?resource=question:single-0')).discussions[0].messages).toHaveLength(3);
});
it('retains original quotes on content updates and persists across server recreation', async () => {
  await call('discussions', { id: 'thread-003', reference, body: '保留' });
  await writeFile(join(root, 'content-libraries/questions/single-0.json'), JSON.stringify({ ...choice('single-0'), stem: '新题干' }));
  api.close(); api = await createLearningApi({ root, clock: () => now, agent });
  expect((await call('discussions?resource=question:single-0')).discussions[0].reference.quote).toBe('原题');
});
it('rejects unknown references, malformed identity and oversized content', async () => {
  expect((await call('discussions', { id: 'bad-note-1', reference: { ...reference, resource: 'term:../bad' }, body: 'x' })).status).toBe(400);
  expect((await call('session', undefined, 'invalid')).status).toBe(401);
  expect((await call('discussions', { id: 'bad-note-2', reference, body: 'x'.repeat(4001) })).status).toBe(400);
});
it('saves private questions but returns explicit unavailability rather than a fake answer', async () => {
  const reply = await call('assistant/ask', { id: 'ask-000001', content: '什么是网络？', reference });
  expect(reply.messages[1].status).toBe('unavailable');
  expect((await call('assistant/history', undefined, b)).messages).toEqual([]);
  await call('assistant/ask', { id: 'ask-000001', content: '什么是网络？', reference });
  expect(agent.learn).toHaveBeenCalledTimes(1);
});
it('opens an incomplete paper without inventing subjective questions or leaking answer keys', async () => {
  const r = await call('exams/start', { name: '同事 A' }); const paper = r.attempt;
  expect(paper.questions).toHaveLength(10); expect(new Set(paper.questions.map(q => q.id)).size).toBe(10);
  expect(paper.deadline - paper.startedAt).toBe(30 * 60000);
  expect(paper.completePaper).toBe(false); expect(paper.questions[0].correctAnswer).toBeUndefined(); expect(paper.questions[0].explanation).toBeUndefined();
  expect((await call('exams/start', {})).attempt.id).toBe(paper.id);
  expect((await call(`exams/${paper.id}`, undefined, b)).status).toBe(404);
});
it('saves answers, detects stale tabs, gives multi-select zero unless exactly correct', async () => {
  const { attempt: p } = await call('exams/start', {});
  const answers = { 'single-0': ['A'], 'multi-0': ['A'], 'multi-1': ['A', 'B'] };
  const saved = await call(`exams/${p.id}/answers`, { revision: p.revision, answers });
  expect(saved.attempt.answers).toEqual(answers);
  expect((await call(`exams/${p.id}/answers`, { revision: p.revision, answers: {} })).status).toBe(409);
  const result = await call(`exams/${p.id}/submit`, { revision: saved.attempt.revision, answers });
  expect(result.attempt.objectiveScore).toBe(10); expect(result.attempt.total).toBeNull();
  expect(result.attempt.results.find(r => r.id === 'multi-0').score).toBe(0);
  expect((await call(`exams/${p.id}/submit`, { revision: -1, answers: {} })).attempt.objectiveScore).toBe(10);
});
it('disables discussion and assistant endpoints during an active exam and unblocks after submit', async () => {
  const { attempt: p } = await call('exams/start', {});
  expect((await call('assistant/history')).status).toBe(403);
  expect((await call('discussions?resource=question:single-0')).status).toBe(403);
  expect((await call('assistant/ask', { id: 'ask-000004', content: 'help' })).status).toBe(403);
  await call(`exams/${p.id}/submit`, { revision: 0, answers: {} });
  expect((await call('assistant/history')).status).toBe(200);
});
it('uses the server deadline and never counts late offline answers', async () => {
  const { attempt: p } = await call('exams/start', {}); now = p.deadline + 1000;
  const r = await call(`exams/${p.id}/submit`, { revision: 0, answers: { 'single-0': ['A'] } });
  expect(r.attempt.status).toBe('submitted'); expect(r.attempt.submittedAt).toBe(p.deadline); expect(r.attempt.objectiveScore).toBe(0);
});
it('records subjective answers as pending and does not treat missing grades as zero', async () => {
  for (let i = 0; i < 2; i++) await writeFile(join(root, `content-libraries/questions/subjective-${i}.json`), JSON.stringify({ id: `subjective-${i}`, type: 'subjective', stem: '解释', explanation: '示例', subjectiveAnswer: { referenceAnswer: '参考', rubric: [{ criterion: '概念', points: 5 }] } }));
  const { attempt: p } = await call('exams/start', {});
  expect(p.completePaper).toBe(true);
  const r = await call(`exams/${p.id}/submit`, { revision: 0, answers: { 'subjective-0': '我的回答' } });
  expect(r.attempt.results.filter(r => r.state === 'pending')).toHaveLength(2); expect(r.attempt.total).toBeNull(); expect(agent.grade).not.toHaveBeenCalled();
});
it('snapshots original questions and validates answer format independently of the browser', () => {
  const source = [choice('one')]; const p = createAttempt(source, 'owner', 'A', 100);
  source[0].correctAnswer = ['B']; expect(p.questions[0].correctAnswer).toEqual(['A']);
  expect(() => validateAnswers(p, { one: ['A', 'A'] })).toThrow();
  expect(() => validateAnswers(p, { unknown: ['A'] })).toThrow();
  finishAttempt(p, 200); expect(publicAttempt(p).questions[0].correctAnswer).toEqual(['A']);
});
it('grades an automatically expired complete paper after a provider is configured', async () => {
  for (let i = 0; i < 2; i++) await writeFile(join(root, `content-libraries/questions/subjective-${i}.json`), JSON.stringify({ id: `subjective-${i}`, type: 'subjective', stem: '解释', explanation: '示例', subjectiveAnswer: { referenceAnswer: '参考', rubric: [{ criterion: '概念', points: 5 }] } }));
  const gradingAgent = { status: () => ({ enabled: true }), grade: vi.fn(async () => ({ score: 25, items: [], model: 'test-only', gradedAt: now })) };
  api.close(); api = await createLearningApi({ root, clock: () => now, agent: gradingAgent });
  const { attempt: p } = await call('exams/start', {});
  const answers = Object.fromEntries(p.questions.map(q => [q.id, q.type === 'subjective' ? '回答' : q.type === 'multiple_choice' ? ['A', 'B'] : ['A']]));
  await call(`exams/${p.id}/answers`, { revision: 0, answers }); now = p.deadline + 1;
  await call(`exams/${p.id}`);
  const graded = await call(`exams/${p.id}`); expect(graded.attempt.total).toBe(100); expect(gradingAgent.grade).toHaveBeenCalledTimes(2);
});
