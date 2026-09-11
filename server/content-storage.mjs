import { createHash, randomBytes } from 'node:crypto';
import { cp, mkdir, open, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { resolveNpmInvocation } from './npm-invocation.mjs';

const sourceDirectories = ['src', 'server', 'scripts', 'public'];
const sourceFile = name => /^(package(?:-lock)?\.json|tsconfig.*\.json|(?:vite|vitest)\.config\.[cm]?ts|index\.html)$/.test(name);
const validRevision = value => typeof value === 'string' && /^[a-zA-Z0-9-]+$/.test(value);

async function renameReady(from, to) {
  for (let attempt = 0; ; attempt++) {
    try { return await rename(from, to); }
    catch (error) {
      if (process.platform !== 'win32' || !['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt >= 10) throw error;
      await new Promise(done => setTimeout(done, 100 * (attempt + 1)));
    }
  }
}

export function contentStoreDirectory(root, env = process.env) {
  return resolve(env.CEPTLENS_CONTENT_DIR || resolve(env.CEPTLENS_DATA_DIR || resolve(root, 'service-data'), 'content-store'));
}

async function exists(path) { try { await readFile(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }

export async function removeInside(parent, target) {
  const child = relative(resolve(parent), resolve(target));
  if (!child || isAbsolute(child) || child.startsWith('..') || resolve(parent, child) !== resolve(target)) throw new Error('Refusing cleanup outside the workspace');
  await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

export async function withContentLock(directory, action) {
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, 'publication.lock');
  let handle;
  try { handle = await open(path, 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const busy = new Error('A content publication or platform deployment is running. Retry after it finishes. If it crashed, verify the recorded process has stopped before removing publication.lock.');
    busy.status = 409; throw busy;
  }
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    await handle.sync();
    return await action();
  } finally { await handle.close(); await rm(path, { force: true }); }
}

async function filesBelow(directory, prefix = '') {
  const result = [];
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) result.push(...await filesBelow(resolve(directory, item.name), name));
    else if (item.isFile()) result.push(name);
    else throw new Error(`Unsupported link in content/build input: ${name}`);
  }
  return result;
}

export async function directoryHash(directory) {
  const hash = createHash('sha256');
  for (const name of await filesBelow(directory)) {
    const bytes = await readFile(resolve(directory, name));
    hash.update(`${name}\0${bytes.length}\0`); hash.update(bytes);
  }
  return hash.digest('hex');
}

async function platformFiles(root) {
  const files = (await readdir(root)).filter(sourceFile);
  for (const folder of sourceDirectories) files.push(...(await filesBelow(resolve(root, folder))).map(name => `${folder}/${name}`));
  return files.sort();
}

export async function platformHash(root) {
  const hash = createHash('sha256');
  for (const name of await platformFiles(root)) { const bytes = await readFile(resolve(root, name)); hash.update(`${name}\0${bytes.length}\0`); hash.update(bytes); }
  return hash.digest('hex');
}

export async function buildContent(root, workspace) {
  for (const name of await platformFiles(root)) {
    await mkdir(resolve(workspace, name, '..'), { recursive: true });
    await cp(resolve(root, name), resolve(workspace, name));
  }
  await symlink(resolve(root, 'node_modules'), resolve(workspace, 'node_modules'), 'junction');
  const invocation = resolveNpmInvocation(['run', 'check']);
  // Let Vitest select test mode and Vite select production mode independently.
  // A live host's NODE_ENV=production otherwise disables React's test helpers.
  const buildEnv = { ...process.env };
  delete buildEnv.NODE_ENV;
  await new Promise((done, reject) => {
    const child = spawn(invocation.executable, invocation.args, { cwd: workspace, env: buildEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let tail = '';
    const output = chunk => { tail = (tail + chunk.toString()).slice(-12000); process.stdout.write(chunk); };
    child.stdout.on('data', output); child.stderr.on('data', output);
    child.on('error', reject);
    child.on('exit', code => code === 0 ? done() : reject(new Error(`Content build failed (${code}): ${tail}`)));
  });
}

export async function createContentStorage({ root, directory = contentStoreDirectory(root), build = buildContent, fingerprint }) {
  await mkdir(directory, { recursive: true });
  const currentFile = resolve(directory, 'current.json');
  const snapshots = resolve(directory, 'snapshots');
  const work = resolve(directory, 'work');
  await mkdir(snapshots, { recursive: true }); await mkdir(work, { recursive: true });
  const codeHash = fingerprint ?? await platformHash(root);
  let active;

  function paths(record) {
    if (!validRevision(record?.revision)) throw new Error('Invalid content revision');
    const folder = resolve(snapshots, record.revision);
    return { ...record, folder, library: resolve(folder, 'content-libraries'), dist: resolve(folder, 'dist') };
  }
  async function readCurrent() {
    if (!await exists(currentFile)) return null;
    const record = JSON.parse(await readFile(currentFile, 'utf8'));
    const snapshot = paths(record);
    await readFile(resolve(snapshot.dist, 'index.html'));
    return snapshot;
  }
  async function createRevision(seed, reason, mutate = async () => {}) {
    const prior = await readCurrent();
    const revision = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const workspace = resolve(work, revision);
    const folder = resolve(snapshots, revision);
    await mkdir(workspace, { recursive: true });
    try {
      const library = resolve(workspace, 'content-libraries');
      await cp(seed, library, { recursive: true });
      await mutate(library);
      await build(root, workspace);
      const record = {
        revision, previousRevision: prior?.revision ?? null, reason,
        createdAt: new Date().toISOString(), platformHash: codeHash,
        contentHash: await directoryHash(library),
        questionCount: (await readdir(resolve(library, 'questions'))).filter(name => name.endsWith('.json')).length,
        termCount: (await readdir(resolve(library, 'terms'), { withFileTypes: true })).filter(item => item.isDirectory()).length,
      };
      await mkdir(folder);
      await renameReady(library, resolve(folder, 'content-libraries'));
      await renameReady(resolve(workspace, 'dist'), resolve(folder, 'dist'));
      await writeFile(resolve(folder, 'manifest.json'), `${JSON.stringify(record, null, 2)}\n`);
      const next = resolve(directory, `current-${revision}.tmp`);
      const handle = await open(next, 'wx', 0o600);
      try { await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`); await handle.sync(); } finally { await handle.close(); }
      await renameReady(next, currentFile);
      active = paths(record);
      return active;
    } finally {
      // Cleanup cannot turn a successful activation into an apparent failed upload.
      await removeInside(work, workspace).catch(error => console.warn(`Content workspace cleanup deferred: ${error.message}`));
    }
  }
  async function initializeUnlocked(seed = resolve(root, 'content-libraries')) {
    active = await readCurrent();
    if (!active || active.platformHash !== codeHash) return createRevision(active?.library ?? seed, active ? 'platform-update' : 'initial-import');
    return active;
  }
  return {
    directory,
    get active() { if (!active) throw new Error('Content storage is not initialized'); return active; },
    async initialize(seed) {
      // A prepared release may start while its coordinator still holds the writer lock.
      active = await readCurrent();
      if (active?.platformHash === codeHash) return active;
      return withContentLock(directory, () => initializeUnlocked(seed));
    },
    initializeUnlocked,
    async publish(reason, mutate) {
      return withContentLock(directory, async () => {
        const current = await readCurrent();
        if (!current || current.revision !== active?.revision || current.platformHash !== codeHash) {
          const error = new Error('The active release changed. Refresh or restart this host before publishing.'); error.status = 409; throw error;
        }
        return createRevision(current.library, reason, mutate);
      });
    },
    async history() {
      const records = [];
      for (const entry of await readdir(snapshots, { withFileTypes: true })) {
        if (!entry.isDirectory() || !validRevision(entry.name)) continue;
        try { records.push(JSON.parse(await readFile(resolve(snapshots, entry.name, 'manifest.json'), 'utf8'))); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async restore(revision) {
      if (!validRevision(revision)) throw new Error('Invalid content revision');
      const source = paths({ revision });
      await readFile(resolve(source.folder, 'manifest.json'));
      return this.publish(`restore:${revision}`, async library => {
        await removeInside(resolve(library, '..'), library);
        await cp(source.library, library, { recursive: true });
      });
    },
    async previousDist() {
      if (!active?.previousRevision) return null;
      return paths({ revision: active.previousRevision }).dist;
    },
  };
}
