import { expect, it } from 'vitest';
import { resolve } from 'node:path';
import { resolveServiceStorage } from '../scripts/inspect-storage.mjs';

it('resolves storage from systemd environment rather than an assumed filename', () => {
  const data = resolve('persistent-data');
  expect(resolveServiceStorage({ cwd: resolve('release'), initialEnv: { CEPTLENS_DATA_DIR: data }, argv: ['node', 'server/content-host.mjs'] })).toEqual({ data, content: resolve(data, 'content-store'), absoluteConfiguration: true });
});
it('loads Node env files and lets the process environment override file values', () => {
  const first = resolve('first'), second = resolve('second'), override = resolve('override');
  const read = filename => `CEPTLENS_DATA_DIR=${JSON.stringify(filename.endsWith('first.env') ? first : second)}\nUNRELATED_SECRET=never-output`;
  const input = { cwd: resolve('release'), initialEnv: {}, argv: ['node', '--env-file=first.env', '--env-file', 'second.env'], read };
  expect(resolveServiceStorage(input).data).toBe(second);
  expect(resolveServiceStorage({ ...input, initialEnv: { CEPTLENS_DATA_DIR: override } }).data).toBe(override);
  expect(JSON.stringify(resolveServiceStorage(input))).not.toContain('never-output');
});
it('identifies release-relative defaults as requiring migration/configuration', () => {
  const cwd = resolve('release');
  expect(resolveServiceStorage({ cwd, initialEnv: {}, argv: ['node'] })).toEqual({ data: resolve(cwd, 'service-data'), content: resolve(cwd, 'service-data/content-store'), absoluteConfiguration: false });
});
