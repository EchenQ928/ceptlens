import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const ignored = new Set(['node_modules', 'dist', '.modelpath-runtime', '.ceptlens-runtime', '.git']);
async function list(directory, prefix = '') {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(item.name) || item.name.endsWith('.log') || item.name.endsWith('.tsbuildinfo') || item.name.startsWith('.env')) continue;
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) result.push(...await list(resolve(directory, item.name), name));
    else if (item.isFile()) result.push(name);
  }
  return result;
}
function ownedFile(directory, name) {
  if (typeof name !== 'string' || isAbsolute(name) || name.replaceAll('\\', '/').split('/').some(part => part === '..') || name.startsWith('content-libraries/')) throw new Error('Invalid managed Lab file');
  const path = resolve(directory, name);
  if (relative(directory, path).startsWith('..')) throw new Error('Lab file escapes workspace');
  return path;
}
export async function createLabWorkspace(source, destination, update = false) {
  source = resolve(source); destination = resolve(destination);
  const contains = (parent, child) => { const path = relative(parent, child); return !path || (!isAbsolute(path) && !path.startsWith('..')); };
  if (contains(source, destination) || contains(destination, source)) throw new Error('Choose a Lab workspace outside the source installation');
  const marker = resolve(destination, '.ceptlens-lab-workspace.json');
  let previous;
  try { previous = JSON.parse(await readFile(marker, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous && !update) throw new Error('Workspace already exists. Use --update to preserve drafts and update Lab code.');
  if (update && previous?.format !== 1) throw new Error('Update requires an existing managed Lab workspace');
  if (!previous) {
    try { if ((await readdir(destination)).length) throw new Error('Destination is not empty; choose a new directory'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const files = await list(source);
  const runtimeFiles = files.filter(name => !name.startsWith('content-libraries/'));
  await mkdir(destination, { recursive: true });
  // Validate every managed path before any removal. Author content is never managed here.
  const removed = (previous?.runtimeFiles ?? []).filter(name => !runtimeFiles.includes(name)).map(name => ownedFile(destination, name));
  for (const file of removed) await rm(file, { force: true });
  for (const name of files) {
    if (previous && name.startsWith('content-libraries/')) continue;
    const target = resolve(destination, name); await mkdir(resolve(target, '..'), { recursive: true });
    await cp(resolve(source, name), target);
  }
  const { version } = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
  await writeFile(marker, `${JSON.stringify({ format: 1, version, updatedAt: new Date().toISOString(), runtimeFiles }, null, 2)}\n`);
  return { destination, version, updated: !!previous, contentDirectory: resolve(destination, 'content-libraries') };
}
