// End-to-end host contract test. Uses temporary service data; never modifies content libraries.
import { spawn } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const data = await mkdtemp(resolve(tmpdir(), 'ceptlens-service-smoke-'));
const tokenA = 'a'.repeat(48), tokenB = 'b'.repeat(48);
const socket = createNetServer(); await new Promise(r => socket.listen(0, '127.0.0.1', r)); const port = socket.address().port; await new Promise(r => socket.close(r));
let child;
async function start(publicOrigin = '') {
  child = spawn(process.execPath, ['server/content-host.mjs', '--host', '127.0.0.1', '--port', String(port), '--public-host', '127.0.0.1'], { cwd: root, env: { ...process.env, CEPTLENS_DATA_DIR: data, CEPTLENS_AI_DISABLED: '1', CEPTLENS_PUBLIC_ORIGIN: publicOrigin }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { if ((await call('/api/content/status', undefined, tokenA, publicOrigin || `http://127.0.0.1:${port}`)).status === 200) return; } catch { /* startup */ } if (child.exitCode !== null) throw new Error('Host failed to start'); await new Promise(r => setTimeout(r, 100)); }
  throw new Error('Host readiness timeout');
}
async function stop() { if (!child || child.exitCode !== null) return; const stopped = new Promise(r => child.once('exit', r)); child.kill('SIGTERM'); await stopped; }
function call(path, body, token = tokenA, origin = `http://127.0.0.1:${port}`) {
  return new Promise((resolvePromise, reject) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, path, method: body === undefined ? 'GET' : 'POST', headers: { Host: `127.0.0.1:${port}`, Origin: origin, 'Content-Type': 'application/json', 'X-CeptLens-Identity': token } }, res => {
      let raw = ''; res.setEncoding('utf8'); res.on('data', c => raw += c); res.on('end', () => { let value; try { value = JSON.parse(raw); } catch { value = raw; } resolvePromise({ status: res.statusCode, value }); });
    }); req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end();
  });
}
try {
  await start(); const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const status = (await call('/api/content/status')).value; assert.equal(status.version, manifest.version); assert.equal(status.publicUrl, `http://127.0.0.1:${port}/`);
  assert.equal((await call('/')).status, 200);
  const files = (await readdir(resolve(root, 'content-libraries/questions'))).filter(n => n.endsWith('.json'));
  const q = JSON.parse(await readFile(resolve(root, 'content-libraries/questions', files[0]), 'utf8'));
  const reference = { resource: `question:${q.id}`, title: '服务验收', quote: q.stem.slice(0, 200), prefix: '', suffix: '', start: 0 };
  const created = await call('/api/discussions', { id: 'smoke-thread-0001', reference, body: '共享问题' }); assert.equal(created.status, 200);
  await call('/api/discussions/smoke-thread-0001', { action: 'reply', id: 'smoke-reply-0001', body: '另一位同事的回复' }, tokenB);
  assert.equal((await call(`/api/discussions?resource=${reference.resource}`, undefined, tokenB)).value.discussions[0].messages.length, 2);
  assert.equal((await call('/api/discussions', { id: 'csrf-thread-001', reference, body: '禁止' }, tokenA, 'https://other.invalid')).status, 403);
  assert.equal((await call('/service-data/ceptlens.sqlite')).status, 404);
  const chat = await call('/api/assistant/ask', { id: 'smoke-chat-0001', content: '解释这个概念', reference }); assert.equal(chat.value.messages.at(-1).status, 'unavailable');
  assert.deepEqual((await call('/api/assistant/history', undefined, tokenB)).value.messages, []);
  const exam = (await call('/api/exams/start', { name: '服务测试' })).value.attempt; assert.equal(exam.status, 'active');
  assert.equal((await call('/api/assistant/history')).status, 403);
  assert.equal((await call(`/api/exams/${exam.id}`, undefined, tokenB)).status, 404);
  const result = (await call(`/api/exams/${exam.id}/submit`, { revision: 0, answers: {} })).value.attempt; assert.equal(result.status, 'submitted');
  await stop(); await start();
  assert.equal((await call(`/api/discussions?resource=${reference.resource}`)).value.discussions[0].messages.length, 2);
  assert.equal((await call(`/api/exams/${exam.id}`)).value.attempt.status, 'submitted');
  await stop(); await start('https://ceptlens.example');
  const httpsStatus = await call('/api/content/status', undefined, tokenA, 'https://ceptlens.example');
  assert.equal(httpsStatus.status, 200);
  assert.equal(httpsStatus.value.publicUrl, 'https://ceptlens.example/');
  assert.equal((await call('/api/session', { name: 'HTTPS test' }, tokenA, 'https://ceptlens.example')).status, 200);
  assert.equal((await call('/api/session', { name: 'Cross-site' }, tokenA, 'https://other.invalid')).status, 403);
  assert.equal((await call('/api/content/questions/import', {}, tokenA, 'https://ceptlens.example')).status, 401);
  console.log(JSON.stringify({ node: process.version, version: status.version, companyHostOrigin: 'PASS', httpsProxyOrigin: 'PASS', contentAuthorization: 'PASS', sharedReplies: 'PASS', privateChat: 'PASS', disabledApi: 'PASS', examAndIsolation: 'PASS', restartPersistence: 'PASS', privateDatabaseNotServed: 'PASS' }, null, 2));
} finally { await stop(); await rm(data, { recursive: true, force: true }); }
