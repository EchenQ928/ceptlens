import { readFileSync, readlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';

// Node --env-file values may not appear in /proc/PID/environ, which exposes the
// initial exec environment. Apply Node's file precedence before resolving paths.
export function resolveServiceEnvironment({ cwd, initialEnv, argv, read = readFileSync }) {
  const fromFiles = {};
  for (let i = 0; i < argv.length; i++) {
    const match = /^(--env-file(?:-if-exists)?)(?:=(.*))?$/.exec(argv[i]);
    if (!match) continue;
    const filename = match[2] ?? argv[++i];
    if (!filename) throw new Error('Missing service environment filename');
    try { Object.assign(fromFiles, parseEnv(read(resolve(cwd, filename), 'utf8'))); }
    catch (error) { if (match[1] !== '--env-file-if-exists' || error.code !== 'ENOENT') throw error; }
  }
  return { ...fromFiles, ...initialEnv };
}
export function resolveServiceStorage({ cwd, initialEnv, argv, read = readFileSync }) {
  const env = resolveServiceEnvironment({ cwd, initialEnv, argv, read });
  const data = resolve(cwd, env.CEPTLENS_DATA_DIR || 'service-data');
  const content = resolve(cwd, env.CEPTLENS_CONTENT_DIR || resolve(data, 'content-store'));
  return { data, content, absoluteConfiguration: !!env.CEPTLENS_DATA_DIR && isAbsolute(env.CEPTLENS_DATA_DIR) && (!env.CEPTLENS_CONTENT_DIR || isAbsolute(env.CEPTLENS_CONTENT_DIR)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pid = execFileSync('systemctl', ['show', 'ceptlens', '--property=MainPID', '--value'], { encoding: 'utf8' }).trim();
  if (!/^[1-9][0-9]*$/.test(pid)) throw new Error('Start the existing service before inspecting/migrating storage');
  const entries = readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0').filter(Boolean);
  const initialEnv = Object.fromEntries(entries.map(entry => { const i = entry.indexOf('='); return [entry.slice(0, i), entry.slice(i + 1)]; }));
  const argv = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean);
  const paths = resolveServiceStorage({ cwd: readlinkSync(`/proc/${pid}/cwd`), initialEnv, argv });
  if (process.argv.includes('--require-absolute') && !paths.absoluteConfiguration) throw new Error('Configure absolute persistent storage paths for the existing service before deploying');
  if (process.argv.includes('--lines')) { console.log(paths.data); console.log(paths.content); }
  else console.log(JSON.stringify(paths));
}
