import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openCommunityStore, problem, text } from './community-store.mjs';
import { createAgentService } from './agent-service.mjs';
import { createAttempt, examPlan, finishAttempt, publicAttempt, readiness, updateTotal, validateAnswers } from './exam-engine.mjs';

const resourcePattern = /^(question|term):([a-zA-Z0-9][a-zA-Z0-9._-]{0,150})$/;
function requestId(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(value)) throw problem('请求标识无效。'); return value; }
async function body(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw problem('请使用 JSON 请求。', 415);
  let size = 0; const chunks = [];
  for await (const chunk of request) { size += chunk.length; if (size > 160000) throw problem('请求内容过长。', 413); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw problem('JSON 格式无效。'); }
}
function validateReference(input, requireQuote = false) {
  if (!input && !requireQuote) return null;
  if (!input || !resourcePattern.test(input.resource)) throw problem('批注必须关联一道题或一个词条。');
  return { resource: input.resource, title: text(input.title, 240), quote: requireQuote ? text(input.quote, 2400) : String(input.quote ?? '').slice(0, 2400), prefix: String(input.prefix ?? '').slice(-80), suffix: String(input.suffix ?? '').slice(0, 80), start: Number.isSafeInteger(input.start) && input.start >= 0 ? input.start : 0, ...(!requireQuote && typeof input.pageText === 'string' ? { pageText: input.pageText.slice(0, 24000) } : {}) };
}

export async function createLearningApi({ root, databasePath = resolve(root, 'service-data/ceptlens.sqlite'), clock = Date.now, agent: suppliedAgent }) {
  const store = openCommunityStore(databasePath);
  const pending = new Set();
  const limits = new Map();
  const listQuestions = async () => Promise.all((await readdir(resolve(root, 'content-libraries/questions'))).filter(n => n.endsWith('.json')).map(async n => JSON.parse(await readFile(resolve(root, 'content-libraries/questions', n), 'utf8'))));
  async function readContent(resource) {
    const match = resourcePattern.exec(resource ?? ''); if (!match) return null;
    if (match[1] === 'question') return (await listQuestions()).find(q => q.id === match[2]) ?? null;
    try { return JSON.parse(await readFile(resolve(root, 'content-libraries/terms', match[2], 'manifest.json'), 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  }
  const platformTools = { readContent, async search(query) {
    const needle = text(query, 120).toLowerCase();
    const qs = await listQuestions();
    return qs.filter(q => `${q.stem} ${q.taxonomy.primaryConcept}`.toLowerCase().includes(needle)).slice(0, 12).map(q => ({ resource: `question:${q.id}`, title: q.taxonomy.primaryConcept, stem: q.stem }));
  } };
  const agent = suppliedAgent ?? await createAgentService(root, platformTools);
  function expire(a) {
    if (a.status === 'active' && clock() >= a.deadline) {
      finishAttempt(a, clock()); store.saveAttempt(a);
      if (agent.status().enabled && a.results.some(r => r.state === 'pending')) {
        const lock = `grade:${a.id}`; pending.add(lock);
        void gradeAttempt(a).catch(() => { /* Failed grades remain retryable. */ }).finally(() => pending.delete(lock));
      }
    }
    return a;
  }
  function active(owner) { return store.listAttempts(owner).map(expire).find(a => a.status === 'active') ?? null; }
  function learningAllowed(owner) { if (active(owner)) throw problem('考核进行中，共享讨论与学习助手已禁用。请先交卷。', 403); }
  async function gradeAttempt(a) {
    if (!agent.status().enabled || !a.results?.some(r => r.state === 'pending')) return a;
    for (const result of a.results.filter(r => r.state === 'pending')) result.reason = '评分进行中；若服务失败将保留待评分状态。';
    store.saveAttempt(a);
    for (const result of a.results.filter(r => r.state === 'pending')) {
      const question = a.questions.find(q => q.id === result.id);
      try {
        const answer = a.answers[result.id] ?? '';
        const grade = answer.trim() ? await agent.grade(question, answer) : { score: 0, items: [], model: null, gradedAt: clock() };
        Object.assign(result, grade, { state: 'graded', reason: answer.trim() ? '已按评分要点自动评分' : '未作答' });
      } catch (error) { result.reason = error.status ? error.message : '评分服务异常，答卷保持待评分。'; }
    }
    updateTotal(a); store.saveAttempt(a); return a;
  }
  // Finalize expired papers even when every exam tab is closed. Pending grading is retryable.
  const expiryTimer = setInterval(() => {
    for (const row of store.db.prepare("SELECT data FROM attempts WHERE status='active'").all()) expire(JSON.parse(row.data));
  }, 1000);
  expiryTimer.unref();

  return {
    close() { clearInterval(expiryTimer); store.close(); },
    async handle(request, response, url, json) {
      if (!/^\/api\/(session|discussions|assistant|exams)(\/|$)/.test(url.pathname)) return false;
      try {
        const ip = request.socket.remoteAddress ?? 'local'; const now = clock();
        if (limits.size > 5000) for (const [key, value] of limits) if (now - value.at > 60000) limits.delete(key);
        const rate = limits.get(ip); const next = rate && now - rate.at < 60000 ? { at: rate.at, count: rate.count + 1 } : { at: now, count: 1 };
        limits.set(ip, next); if (next.count > 600) throw problem('请求过于频繁，请稍后重试。', 429);
        const user = store.identity(request.headers['x-ceptlens-identity']);
        const data = request.method === 'GET' ? null : await body(request);
        const send = result => { json(response, 200, { ok: true, ...result }); return true; };
        if (url.pathname === '/api/session') {
          if (request.method === 'POST' && data.name !== undefined) Object.assign(user, store.identity(request.headers['x-ceptlens-identity'], data.name));
          return send({ user, activeExam: active(user.id)?.id ?? null, agent: agent.status() });
        }
        if (url.pathname.startsWith('/api/discussions')) {
          learningAllowed(user.id);
          if (url.pathname === '/api/discussions' && request.method === 'GET') {
            const resource = url.searchParams.get('resource'); if (!resourcePattern.test(resource)) throw problem('内容标识无效。');
            return send({ discussions: store.listDiscussions(resource) });
          }
          if (url.pathname === '/api/discussions' && request.method === 'POST') {
            const reference = validateReference(data.reference, true); const id = requestId(data.id);
            if (!await readContent(reference.resource)) throw problem('原题目或词条不存在。', 404);
            const existing = store.getDiscussion(id);
            if (existing) { if (existing.owner !== user.id) throw problem('请求标识已使用。', 409); return send({ discussion: existing }); }
            const d = { id, resource: reference.resource, owner: user.id, reference, status: 'open', createdAt: now, updatedAt: now, messages: [{ id: randomUUID(), author: user, body: text(data.body), createdAt: now }] };
            store.saveDiscussion(d); return send({ discussion: d });
          }
          const match = url.pathname.match(/^\/api\/discussions\/([a-zA-Z0-9-]+)$/);
          if (match && request.method === 'POST') {
            const d = store.getDiscussion(match[1]); if (!d) throw problem('讨论不存在。', 404);
            if (data.action === 'reply') {
              const id = requestId(data.id);
              if (d.messages.some(m => m.id === id)) return send({ discussion: d });
              if (d.messages.length >= 300) throw problem('本讨论已达到 300 条回复，请新建讨论。');
              d.messages.push({ id, author: user, body: text(data.body), createdAt: now });
            } else if (data.action === 'resolve' || data.action === 'reopen') {
              if (d.owner !== user.id) throw problem('只有发起人可以更改讨论状态。', 403);
              d.status = data.action === 'resolve' ? 'resolved' : 'open';
            } else if (data.action === 'edit' || data.action === 'withdraw') {
              const m = d.messages.find(m => m.id === data.messageId);
              if (!m || m.author.id !== user.id) throw problem('只能修改自己发表的内容。', 403);
              m.body = data.action === 'withdraw' ? '（作者已撤回）' : text(data.body); m.editedAt = now;
            } else throw problem('未知的讨论操作。');
            d.updatedAt = now; store.saveDiscussion(d); return send({ discussion: d });
          }
        }
        if (url.pathname === '/api/assistant/history' && request.method === 'GET') {
          learningAllowed(user.id); return send({ messages: store.chat(user.id), agent: agent.status() });
        }
        if (url.pathname === '/api/assistant/ask' && request.method === 'POST') {
          learningAllowed(user.id);
          const lock = `chat:${user.id}`; if (pending.has(lock)) throw problem('上一条问题仍在处理。', 409);
          pending.add(lock);
          try {
            const id = requestId(data.id); const messages = store.chat(user.id);
            const already = messages.find(m => m.replyTo === id); if (already) return send({ messages, agent: agent.status() });
            const reference = validateReference(data.reference);
            const content = text(data.content);
            if (!messages.some(m => m.id === id)) messages.push({ id, role: 'user', content, reference, createdAt: now });
            store.saveChat(user.id, messages);
            let reply;
            try { const answer = await agent.learn(messages, reference); reply = { content: answer.content, model: answer.model, status: 'ready' }; }
            catch (error) { reply = { content: error.status ? error.message : '助手暂时不可用，请稍后重试。', status: agent.status().enabled ? 'error' : 'unavailable' }; }
            messages.push({ ...reply, id: randomUUID(), replyTo: id, role: 'assistant', createdAt: clock() }); store.saveChat(user.id, messages);
            return send({ messages: store.chat(user.id), agent: agent.status() });
          } finally { pending.delete(lock); }
        }
        if (url.pathname === '/api/exams' && request.method === 'GET') {
          const exams = store.listAttempts(user.id).map(expire);
          return send({ plan: examPlan, readiness: readiness(await listQuestions()), exams: exams.map(a => ({ id: a.id, status: a.status, startedAt: a.startedAt, submittedAt: a.submittedAt, total: a.total, objectiveScore: a.objectiveScore })), agent: agent.status() });
        }
        if (url.pathname === '/api/exams/start' && request.method === 'POST') {
          if (pending.has(`chat:${user.id}`)) throw problem('请等待助手响应结束后再开始考核。', 409);
          const existing = active(user.id); if (existing) return send({ attempt: publicAttempt(existing, now) });
          const questions = await listQuestions();
          // No await between the second active check and INSERT: double-clicks cannot create two exams.
          const again = active(user.id); if (again) return send({ attempt: publicAttempt(again, now) });
          const a = createAttempt(questions, user.id, text(data.name ?? user.name, 40), clock());
          store.saveAttempt(a); return send({ attempt: publicAttempt(a, clock()) });
        }
        const examMatch = url.pathname.match(/^\/api\/exams\/([a-zA-Z0-9-]+)(?:\/(answers|submit|grade))?$/);
        if (examMatch) {
          const a = expire(store.getAttempt(examMatch[1], user.id)); const action = examMatch[2];
          if (request.method === 'GET' && !action) return send({ attempt: publicAttempt(a, clock()) });
          if (request.method === 'POST' && (action === 'answers' || action === 'submit')) {
            if (a.status !== 'active') return send({ attempt: publicAttempt(a, clock()) });
            if (data.revision !== a.revision) throw problem('答卷已在另一个页面更新，请重新载入后作答。', 409);
            a.answers = validateAnswers(a, data.answers); a.revision++;
            if (action === 'submit') finishAttempt(a, clock());
            store.saveAttempt(a);
            if (a.status !== 'active') {
              const lock = `grade:${a.id}`; pending.add(lock);
              try { await gradeAttempt(a); } finally { pending.delete(lock); }
            }
            return send({ attempt: publicAttempt(a, clock()) });
          }
          if (request.method === 'POST' && action === 'grade') {
            if (a.status === 'active') throw problem('交卷后才能评分。');
            const lock = `grade:${a.id}`; if (pending.has(lock)) throw problem('本卷正在评分。', 409);
            pending.add(lock); try { return send({ attempt: publicAttempt(await gradeAttempt(a), clock()), agent: agent.status() }); } finally { pending.delete(lock); }
          }
        }
        throw problem('接口不存在。', 404);
      } catch (error) {
        json(response, error.status ?? 500, { ok: false, error: error.status ? error.message : '服务暂时不可用，请稍后重试。' }); return true;
      }
    }
  };
}
