import { it, expect } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createLabWorkspace } from './lab-workspace.mjs';
import { removeInside } from './content-storage.mjs';

it('updates a standalone Lab without replacing authored packages or runtime data', async () => {
  const parent = resolve(import.meta.dirname, '../.ceptlens-runtime/lab-workspace-tests'); await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(resolve(parent, 'case-'));
  try {
    const source = resolve(directory, 'source'), destination = resolve(directory, 'author');
    await mkdir(resolve(source, 'content-libraries/questions'), { recursive: true });
    await writeFile(resolve(source, 'package.json'), '{"version":"1"}');
    await writeFile(resolve(source, 'app.js'), 'old-runtime');
    await writeFile(resolve(source, 'content-libraries/questions/example.json'), 'example');
    await createLabWorkspace(source, destination);
    await writeFile(resolve(destination, 'content-libraries/questions/example.json'), 'my-draft');
    await mkdir(resolve(destination, '.modelpath-runtime')); await writeFile(resolve(destination, '.modelpath-runtime/token'), 'keep');
    await writeFile(resolve(source, 'app.js'), 'new-runtime');
    await createLabWorkspace(source, destination, true);
    expect(await readFile(resolve(destination, 'app.js'), 'utf8')).toBe('new-runtime');
    expect(await readFile(resolve(destination, 'content-libraries/questions/example.json'), 'utf8')).toBe('my-draft');
    expect(await readFile(resolve(destination, '.modelpath-runtime/token'), 'utf8')).toBe('keep');
    await expect(createLabWorkspace(source, destination)).rejects.toThrow('already exists');
  } finally { await removeInside(parent, directory); }
});
