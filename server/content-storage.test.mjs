import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createContentStorage, removeInside, withContentLock } from './content-storage.mjs';

const temporaryRoot = resolve(import.meta.dirname, '../.ceptlens-runtime/storage-tests');
const cases = [];
afterEach(async () => { for (const path of cases.splice(0)) await removeInside(temporaryRoot, path); });

async function fixture() {
  await mkdir(temporaryRoot, { recursive: true });
  const root = await mkdtemp(resolve(temporaryRoot, 'case-')); cases.push(root);
  const seed = resolve(root, 'content-libraries');
  await mkdir(resolve(seed, 'questions'), { recursive: true }); await mkdir(resolve(seed, 'terms'));
  await writeFile(resolve(seed, 'questions/seed.json'), '{"id":"seed"}');
  const directory = resolve(root, 'persistent');
  const build = async (_, workspace) => {
    const names = await readdir(resolve(workspace, 'content-libraries/questions'));
    if (names.includes('invalid.json')) throw new Error('Rejected content');
    await mkdir(resolve(workspace, 'dist/assets'), { recursive: true });
    await writeFile(resolve(workspace, 'dist/index.html'), names.join(','));
    await writeFile(resolve(workspace, 'dist/assets/content.js'), names.join(','));
  };
  const store = await createContentStorage({ root, directory, build, fingerprint: 'platform-one' });
  await store.initialize();
  return { root, directory, build, store };
}

describe('persistent content snapshots', () => {
  it('preserves a server-only upload across a new platform release without reseeding Git content', async () => {
    const { root, directory, build, store } = await fixture();
    const database = resolve(root, 'accounts.sqlite'); await writeFile(database, 'existing-user-records');
    await store.publish('question-upload', library => writeFile(resolve(library, 'questions/uploaded.json'), '{"id":"uploaded"}'));
    const uploaded = store.active;
    // This simulates a changed Git archive. It must never overwrite the server library.
    await writeFile(resolve(root, 'content-libraries/questions/seed.json'), '{"id":"replacement-from-git"}');
    const upgraded = await createContentStorage({ root, directory, build, fingerprint: 'platform-two' });
    await upgraded.initialize();
    expect(upgraded.active.platformHash).toBe('platform-two');
    expect(upgraded.active.contentHash).toBe(uploaded.contentHash);
    expect(await readFile(resolve(upgraded.active.dist, 'index.html'), 'utf8')).toContain('uploaded.json');
    expect(await readFile(resolve(upgraded.active.library, 'questions/seed.json'), 'utf8')).toBe('{"id":"seed"}');
    expect(await readFile(database, 'utf8')).toBe('existing-user-records');
    const restarted = await createContentStorage({ root, directory, build, fingerprint: 'platform-two' });
    await restarted.initialize(); expect(restarted.active.revision).toBe(upgraded.active.revision);
  });

  it('keeps active content and frontend intact when validation or building fails', async () => {
    const { store, directory } = await fixture(); const before = store.active;
    await expect(store.publish('bad-upload', library => writeFile(resolve(library, 'questions/invalid.json'), '{}'))).rejects.toThrow('Rejected content');
    expect(store.active.revision).toBe(before.revision);
    expect(JSON.parse(await readFile(resolve(directory, 'current.json'), 'utf8')).revision).toBe(before.revision);
    expect(await readdir(resolve(before.library, 'questions'))).toEqual(['seed.json']);
    expect(await readdir(resolve(directory, 'work'))).toEqual([]);
  });

  it('serializes platform preparation and uploads, and rejects writes from a stale host', async () => {
    const { root, directory, build, store } = await fixture();
    await withContentLock(directory, async () => {
      await expect(store.publish('busy', async () => {})).rejects.toMatchObject({ status: 409 });
    });
    const nextHost = await createContentStorage({ root, directory, build, fingerprint: 'platform-two' });
    await nextHost.initialize();
    await expect(store.publish('stale', async () => {})).rejects.toMatchObject({ status: 409 });
  });

  it('restores content as a new revision and retains both old content and prior assets', async () => {
    const { store } = await fixture(); const original = store.active;
    await store.publish('upload', library => writeFile(resolve(library, 'questions/new.json'), '{}'));
    const uploaded = store.active;
    expect(await store.previousDist()).toBe(original.dist);
    await store.restore(original.revision);
    expect(store.active.revision).not.toBe(original.revision);
    expect(store.active.contentHash).toBe(original.contentHash);
    expect(await readFile(resolve(uploaded.library, 'questions/new.json'), 'utf8')).toBe('{}');
    expect(await store.history()).toHaveLength(3);
    await expect(store.restore('../outside')).rejects.toThrow('Invalid content revision');
  });

  it('seeds from the actual old server library during first migration', async () => {
    const { root, build } = await fixture(); const legacy = resolve(root, 'old-server-library');
    await mkdir(resolve(legacy, 'questions'), { recursive: true }); await mkdir(resolve(legacy, 'terms'));
    await writeFile(resolve(legacy, 'questions/server-only.json'), '{}');
    const migrated = await createContentStorage({ root, directory: resolve(root, 'migrated'), build, fingerprint: 'new-platform' });
    await migrated.initialize(legacy);
    expect(await readdir(resolve(migrated.active.library, 'questions'))).toEqual(['server-only.json']);
  });
});
