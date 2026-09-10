import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, relative } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { once } from "node:events";
import { unzipSync, zipSync, strToU8 } from "fflate";

const source = resolve(import.meta.dirname, "..");
const temp = await mkdtemp(resolve(tmpdir(), "modelpath-lab-import-"));
const root = resolve(temp, "lab");
const excluded = new Set(["node_modules", ".modelpath-runtime", "dist", ".dist-next", ".dist-previous"]);
await cp(source, root, { recursive: true, filter: path => !relative(source, path).split(/[\\/]/).some(part => excluded.has(part)) });
await symlink(resolve(source, "node_modules"), resolve(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
const socket = createServer(); socket.listen(0, "127.0.0.1"); await once(socket, "listening"); const port = socket.address().port; await new Promise(r => socket.close(r));
const base = `http://127.0.0.1:${port}`;
let child; let output = ""; const checks = [];
async function start() {
  child = spawn(process.execPath, ["server/lab-host.mjs", "--port", String(port)], { cwd: root, env: { ...process.env, MODELPATH_CONTENT_TOKEN: "must-not-inherit", MODELPATH_DATA_DIR: resolve(temp, "forbidden-database") }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", c => { output += c; }); child.stderr.on("data", c => { output += c; });
  for (let i = 0; i < 160; i++) { try { if ((await fetch(`${base}/api/content/status`)).ok) return; } catch {} if (child.exitCode !== null) throw new Error(output); await new Promise(r => setTimeout(r, 100)); }
  throw new Error(`Server did not start\n${output}`);
}
async function stop() { if (!child || child.exitCode !== null) return; const done = once(child, "exit"); child.kill("SIGTERM"); await done; }
async function post(path, body, token) { return fetch(base + path, { method: "POST", headers: { "Content-Type": "application/zip", "X-Content-Admin-Token": token }, body }); }
async function requireOK(response) { if (!response.ok) throw new Error(await response.text()); return response; }
function hostile(headers) { return new Promise((resolvePromise, reject) => { const req = httpRequest(`${base}/api/lab/session`, { headers }, res => { res.resume(); resolvePromise(res.statusCode); }); req.on("error", reject); req.end(); }); }
try {
  await start();
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/src/main.tsx`)).status, 200);
  const session = await (await fetch(`${base}/api/lab/session`, { method: "POST" })).json(); assert.notEqual(session.token, "must-not-inherit");
  assert.equal(await hostile({ Host: "attacker.invalid" }), 403);
  assert.equal(await hostile({ Origin: "http://attacker.invalid" }), 403);
  assert.equal(await hostile({ "Sec-Fetch-Site": "cross-site" }), 403);
  assert.equal((await fetch(`${base}/api/learning/session`)).status, 404);
  assert.equal((await fetch(`${base}/server/lab-host.mjs`)).status, 403);
  await assert.rejects(access(resolve(temp, "forbidden-database")));
  checks.push("independent server, preview compilation, loopback/origin protection, no production API/database/token");
  const template = new Uint8Array(await (await requireOK(await fetch(`${base}/api/content/templates/term`))).arrayBuffer());
  assert.equal((await post("/api/content/terms/import", template, "wrong-token")).status, 401);
  const entries = unzipSync(template); const manifestKey = Object.keys(entries).find(p => p.endsWith("manifest.json")); const viewKey = Object.keys(entries).find(p => p.endsWith("view.tsx"));
  const manifest = JSON.parse(new TextDecoder().decode(entries[manifestKey]));
  manifest.title = "独立导入检查"; entries[manifestKey] = strToU8(JSON.stringify(manifest));
  const importing = post("/api/content/terms/import", zipSync(entries), session.token);
  for (let i = 0; i < 100; i++) { if ((await (await fetch(`${base}/api/content/status`)).json()).publishing) break; await new Promise(r => setTimeout(r, 30)); }
  assert.equal((await post("/api/lab/check", "", session.token)).status, 409);
  await requireOK(await importing);
  const installed = resolve(root, "content-libraries/terms", manifest.id, "manifest.json");
  assert.equal(JSON.parse(await readFile(installed, "utf8")).title, "独立导入检查");
  assert.equal((await fetch(`${base}/content-libraries/terms/${manifest.id}/view.tsx`)).status, 200);
  checks.push("template import, current preview module, concurrent operation protection");
  manifest.title = "同 ID 更新检查"; entries[manifestKey] = strToU8(JSON.stringify(manifest));
  entries[`${manifest.id}/local.test.ts`] = strToU8('import { expect, it } from "vitest"; it("local teaching test", () => expect(2+2).toBe(4));');
  await requireOK(await post("/api/content/terms/import", zipSync(entries), session.token));
  assert.equal(JSON.parse(await readFile(installed, "utf8")).title, "同 ID 更新检查");
  const before = await readFile(installed, "utf8"); const savedView = entries[viewKey];
  entries[viewKey] = strToU8(new TextDecoder().decode(savedView) + '\nconst bad: number = "type-error";\n');
  const bad = await post("/api/content/terms/import", zipSync(entries), session.token); assert.equal(bad.status, 400); assert.match(await bad.text(), /not assignable|不能将类型/);
  assert.equal(await readFile(installed, "utf8"), before); entries[viewKey] = savedView;
  checks.push("same-ID replacement, package-local tests, build error leaves current draft unchanged");
  const exported = new Uint8Array(await (await requireOK(await fetch(`${base}/api/content/terms/${manifest.id}/export`))).arrayBuffer());
  const exportedEntries = unzipSync(exported); assert.ok(Object.keys(exportedEntries).every(p => !p.includes(".test."))); assert.ok(exportedEntries[manifestKey]);
  await writeFile(resolve(temp, "verified.term.zip"), exported);
  checks.push("checked export contains manifest/view/assets, excludes tests, uses formal 3.0 teaching package format");
  await stop(); await start();
  assert.equal(JSON.parse(await readFile(installed, "utf8")).title, "同 ID 更新检查");
  assert.equal((await (await fetch(`${base}/api/lab/catalog`)).json()).terms.some(t => t.id === manifest.id), true);
  checks.push("restart persistence without a platform source directory");
  console.log(JSON.stringify({ ok: true, node: process.versions.node, checks, exportedPackage: resolve(temp, "verified.term.zip") }, null, 2));
} catch (error) { console.error(output.slice(-12000)); throw error; }
finally { await stop(); /* Keep the isolated fixture and ZIP as reproducible evidence; never touch the author's real drafts. */ }
