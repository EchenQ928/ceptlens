// Real HTTP imports + real candidate builds, confined to temporary local data.
import assert from 'node:assert/strict';
import { zipSync } from 'fflate';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { removeInside } from '../server/content-storage.mjs';
import { openCommunityStore } from '../server/community-store.mjs';
import { createAccountService } from '../server/account-service.mjs';

const root = resolve(import.meta.dirname, '..');
const parent = resolve(root, '.ceptlens-runtime/workflow-tests'); await mkdir(parent, { recursive: true });
const testRoot = await mkdtemp(resolve(parent, 'case-'));
const data = resolve(testRoot, 'data'); const store = resolve(data, 'content-store');
const socket = createServer(); await new Promise(done => socket.listen(0, '127.0.0.1', done)); const port = socket.address().port; await new Promise(done => socket.close(done));
const base = `http://127.0.0.1:${port}`; const token = 'local-workflow-test-token';
let child, output = '', cookie = '';
async function start(directory) {
  output = '';
  child = spawn(process.execPath, ['server/content-host.mjs', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: directory, windowsHide: true,
    env: { ...process.env, CEPTLENS_DATA_DIR: data, CEPTLENS_CONTENT_DIR: store, CEPTLENS_CONTENT_TOKEN: token, CEPTLENS_AI_DISABLED: '1', CEPTLENS_PUBLIC_ORIGIN: base }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { output = (output + chunk).slice(-18000); }); child.stderr.on('data', chunk => { output = (output + chunk).slice(-18000); });
  for (let n = 0; n < 1200; n++) {
    try { if ((await fetch(`${base}/api/content/status`)).ok) return; } catch { /* booting */ }
    if (child.exitCode !== null) throw new Error(`Host exited: ${output}`);
    await new Promise(done => setTimeout(done, 100));
  }
  throw new Error(`Startup timeout: ${output}`);
}
async function stop() { if (child && child.exitCode === null) { const exited = new Promise(done => child.once('exit', done)); child.kill('SIGTERM'); await exited; } }
async function api(path, body, extra = {}) {
  const response = await fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Content-Admin-Token': token, Cookie: cookie, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(value)}`);
  return { value, response };
}
try {
  await start(root);
  const before = (await api('/api/content/status')).value;
  const registration = await api('/api/auth/register', { email: 'workflow@example.test', password: 'temporary-test-password', name: 'Workflow test' });
  cookie = registration.response.headers.get('set-cookie').split(';')[0];
  const userId = registration.value.user.id;
  const denied = await fetch(`${base}/api/content/questions/import`, {method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:'{}'});
  assert.equal(denied.status,401); await denied.arrayBuffer();
  const roleStore = openCommunityStore(resolve(data,'ceptlens.sqlite'));
  createAccountService(roleStore.db).setRole(userId,'developer'); roleStore.close();
  assert.equal((await api('/api/session')).value.user.role,'developer');
  const progress = { completedQuestionIds: ['workflow-kept'], wrongQuestionIds: [], notes: {} };
  await api('/api/progress', progress);
  const files = (await readdir(resolve(root, 'content-libraries/questions'))).filter(name => name.endsWith('.json'));
  const question = JSON.parse(await readFile(resolve(root, 'content-libraries/questions', files[0]), 'utf8'));
  question.id = 'WORKFLOW-SERVER-ONLY'; question.ordering = { order: 9999, prerequisites: [] };
  question.featured = true;
  question.ceptCheck = { stem: { 'en-US': 'Explain why the two computations differ.', 'zh-CN': '解释两种计算为什么不同。' }, featured: true };
  question.highlightedTerms = ['kv-cache'];
  await api('/api/content/questions/import', question, {'X-Content-Admin-Token':''});
  const entries = {};
  for (const name of ['manifest.json', 'view.tsx', 'styles.module.css']) {
    let value = await readFile(resolve(root, 'content-libraries/terms/kv-cache', name), 'utf8');
    if (name === 'manifest.json') { const manifest = JSON.parse(value); manifest.id = 'workflow-term'; value = JSON.stringify(manifest); }
    if (name === 'view.tsx') value = value.replace('termId: "kv-cache"', 'termId: "workflow-term"');
    entries['workflow-term/' + name] = new TextEncoder().encode(value);
  }
  const termUpload = await fetch(base + '/api/content/terms/import', { method: 'POST', headers: { 'Content-Type': 'application/zip', 'X-Content-Admin-Token': token }, body: zipSync(entries) });
  assert.equal(termUpload.status, 200, await termUpload.text());
  const uploaded = (await api('/api/content/status')).value;
  assert.equal(uploaded.termCount, before.termCount + 1);
  assert.equal(uploaded.questionCount, before.questionCount + 1);
  assert.notEqual(uploaded.contentRevision, before.contentRevision);
  assert.ok((await api('/api/content/questions/export')).value.questions.some(q => q.id === question.id));
  const exportedQuestion = (await api('/api/content/questions/export')).value.questions.find(q => q.id === question.id);
  assert.equal(exportedQuestion.featured, true);
  assert.deepEqual(exportedQuestion.ceptCheck, question.ceptCheck);
  assert.deepEqual(exportedQuestion.highlightedTerms, ['kv-cache']);
  console.log('PASS: ordinary account cannot publish; owner-granted developer publishes with its session cookie');
  const persisted = JSON.parse(await readFile(resolve(store, 'current.json'), 'utf8'));
  const html = await readFile(resolve(store, 'snapshots', persisted.revision, 'dist/index.html'), 'utf8');
  const script = html.match(/<script[^>]+src="([^"]+)"/)[1];
  assert.match(await readFile(resolve(store, 'snapshots', persisted.revision, 'dist', script), 'utf8'), /WORKFLOW-SERVER-ONLY/);
  console.log('PASS: HTTP upload is present in server storage and the compiled learner application');
  await stop();

  // A fresh platform checkout intentionally contains only the original Git library.
  const next = resolve(testRoot, 'next-platform'); await mkdir(next);
  for (const folder of ['src', 'server', 'scripts', 'public', 'content-libraries', 'agent-runtime']) await cp(resolve(root, folder), resolve(next, folder), { recursive: true });
  for (const name of await readdir(root)) if (/^(package(?:-lock)?\.json|tsconfig.*\.json|(?:vite|vitest)\.config\.[cm]?ts|index\.html)$/.test(name)) await cp(resolve(root, name), resolve(next, name));
  await symlink(resolve(root, 'node_modules'), resolve(next, 'node_modules'), 'junction');
  const manifest = JSON.parse(await readFile(resolve(next, 'package.json'), 'utf8')); manifest.version = '0.1.0-workflow-test'; await writeFile(resolve(next, 'package.json'), JSON.stringify(manifest));
  await start(next);
  const upgraded = (await api('/api/content/status')).value;
  assert.equal(upgraded.version, '0.1.0-workflow-test'); assert.equal(upgraded.contentHash, uploaded.contentHash);
  assert.equal(upgraded.questionCount, uploaded.questionCount);
  const upgradedQuestion = (await api('/api/content/questions/export')).value.questions.find(q => q.id === question.id);
  assert.equal(upgradedQuestion.featured, true);
  assert.deepEqual(upgradedQuestion.ceptCheck, question.ceptCheck);
  assert.equal((await api('/api/auth/me')).value.user.id, userId);
  assert.equal((await api('/api/auth/me')).value.user.role, 'developer');
  assert.deepEqual((await api('/api/progress')).value.progress, progress);
  console.log('PASS: fresh platform release preserves server-only content and the account/session');
  const priorRevision = upgraded.contentRevision;
  const bad = { ...question, ordering: { order: 9998, prerequisites: ['DOES-NOT-EXIST'] } };
  const failed = await fetch(`${base}/api/content/questions/import`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Content-Admin-Token': token }, body: JSON.stringify(bad) });
  assert.equal(failed.status, 400); await failed.arrayBuffer();
  assert.equal((await api('/api/content/status')).value.contentRevision, priorRevision);
  await api('/api/content/restore', { revision: before.contentRevision });
  assert.equal((await api('/api/content/status')).value.questionCount, before.questionCount);
  assert.equal((await api('/api/auth/me')).value.user.id, userId);
  console.log('PASS: rejected import preserves the active snapshot; content restore preserves accounts');
  const revokeStore=openCommunityStore(resolve(data,'ceptlens.sqlite'));createAccountService(revokeStore.db).setRole(userId,'learner');revokeStore.close();
  const revoked=await fetch(`${base}/api/content/questions/import`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:'{}'});assert.equal(revoked.status,401);await revoked.arrayBuffer();
  console.log('PASS: revocation removes publishing authority immediately, without a service restart');
} finally { await stop(); await removeInside(parent, testRoot); }
