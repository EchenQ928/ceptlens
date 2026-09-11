import { resolve } from 'node:path';
import { createContentStorage } from '../server/content-storage.mjs';

const args = process.argv.slice(2);
const value = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const root = resolve(import.meta.dirname, '..');
const storage = await createContentStorage({ root });
const seed = value('--seed') || process.env.CEPTLENS_CONTENT_SEED;
// Only the deployment coordinator uses --lock-held while retaining publication.lock
// through activation. Ordinary CLI calls acquire the same lock as HTTP uploads.
const active = args.includes('--lock-held') ? await storage.initializeUnlocked(seed) : await storage.initialize(seed);
console.log(JSON.stringify({ contentRevision: active.revision, contentHash: active.contentHash, platformHash: active.platformHash, persistentRoot: storage.directory }));
