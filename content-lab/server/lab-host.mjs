import { createServer } from "node:http";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { unzipSync, zipSync } from "fflate";
import { resolveNpmInvocation } from "./npm-invocation.mjs";
import { validateSourceImports, normalizeArchivePath, includeInRuntimeTermArchive } from "./term-package-policy.mjs";
import { createServer as createViteServer } from "vite";
import { createPreviewBoundary } from "./preview-boundary.mjs";

const root = resolve(import.meta.dirname, "..");
const { version } = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const questionDirectory = resolve(root, "content-libraries/questions");
const termDirectory = resolve(root, "content-libraries/terms");
const templateDirectory = resolve(root, "content-libraries/templates");
const runtimeDirectory = resolve(root, ".modelpath-runtime");
const staticDirectory = resolve(root, "dist");
const stageDirectory = resolve(runtimeDirectory, "stage");
const requiredTermFiles = ["manifest.json", "view.tsx"];
const maximumUploadBytes = 25 * 1024 * 1024;
let publishing = false;
const previewBoundary = createPreviewBoundary();

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const host = process.env.CEPTLENS_LAB_HOST ?? "127.0.0.1";
const port = Number(valueAfter("--port", "8766"));
const publicUrl = process.env.CEPTLENS_LAB_PUBLIC_URL ?? `http://${host}:${port}/`;
if (args.includes("--host")) throw new Error("请通过 CEPTLENS_LAB_HOST 配置实验室监听地址。");
const developerKey = process.env.CEPTLENS_LAB_DEVELOPER_KEY;
if (host !== "127.0.0.1" && host !== "localhost" && !developerKey) throw new Error("公开部署必须设置 CEPTLENS_LAB_DEVELOPER_KEY。");
// Never inherit production credentials or the production service database directory.
delete process.env.MODELPATH_CONTENT_TOKEN;
delete process.env.MODELPATH_DATA_DIR;
delete process.env.VITE_MODELPATH_MODE;

await mkdir(runtimeDirectory, { recursive: true });
await mkdir(stageDirectory, { recursive: true });
await mkdir(questionDirectory, { recursive: true });
await mkdir(termDirectory, { recursive: true });
const adminToken = randomBytes(24).toString("base64url");
const keyDigest = developerKey ? createHash("sha256").update(developerKey).digest() : null;

const json = (response, status, value) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
};

const safeId = (value) => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value);

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumUploadBytes) throw new Error("上传包超过 25 MB 限制");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function authorized(request) {
  return request.headers["x-content-admin-token"] === adminToken;
}

function validDeveloperKey(request) {
  if (!keyDigest) return true;
  const supplied = request.headers["x-lab-developer-key"];
  if (typeof supplied !== "string") return false;
  const digest = createHash("sha256").update(supplied).digest();
  return digest.length === keyDigest.length && timingSafeEqual(digest, keyDigest);
}

function runNpm(commandArgs, cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const invocation = resolveNpmInvocation(commandArgs);
    const child = spawn(invocation.executable, invocation.args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); process.stderr.write(chunk); });
    child.on("error", (error) => reject(new Error(`无法启动内容发布子进程 ${invocation.executable}：${error.message}`)));
    child.on("close", (code) => code === 0 ? resolvePromise(output) : reject(new Error(output || `${invocation.executable} exited with ${code}`)));
  });
}

async function validateCandidate(cwd) {
  await runNpm(["run", "validate"], cwd);
  await runNpm(["run", "test"], cwd);
  await runNpm(["run", "build"], cwd);
}

async function fingerprint() {
  const hash = createHash("sha256");
  async function walk(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === ".generated" || entry.name === "CONTENT_GAPS.md") continue;
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("实验室内容目录不允许符号链接，请使用包内实际文件。");
      if (entry.isDirectory()) await walk(path);
      else hash.update(relative(root, path)).update(await readFile(path));
    }
  }
  await walk(resolve(root, "content-libraries"));
  return hash.digest("hex");
}

async function transaction(changes, readResult = () => undefined) {
  const transactionRoot = resolve(stageDirectory, `${Date.now()}-${randomBytes(4).toString("hex")}`);
  await mkdir(transactionRoot, { recursive: true });
  const backups = [];
  let finishCommit;
  let preserveRecoveryFiles = false;
  try {
    // Check a complete candidate away from the live Vite workspace. A broken
    // upload must not interrupt the author's current preview or overwrite drafts.
    const originalFingerprint = await fingerprint();
    const candidate = resolve(transactionRoot, "candidate");
    await mkdir(candidate, { recursive: true });
    for (const item of ["src", "server", "scripts", "public", "content-libraries", "index.html", "package.json", "vite.config.ts", "vitest.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"]) {
      await cp(resolve(root, item), resolve(candidate, item), { recursive: true });
    }
    for (const change of changes) {
      const target = resolve(candidate, relative(root, change.target));
      await rm(target, { recursive: true, force: true });
      if (change.source) { await mkdir(resolve(target, ".."), { recursive: true }); await cp(change.source, target, { recursive: true }); }
    }
    await validateCandidate(candidate);
    if (await fingerprint() !== originalFingerprint) throw new Error("校验期间内容文件被修改。本次操作已取消，请保存文件后重试。");
    const result = await readResult(candidate);
    // No browser request or file-watcher update may observe a partial package.
    finishCommit = await previewBoundary.beginWrite();
    const committedChanges = [...changes, ...["content-libraries/.generated", "content-libraries/CONTENT_GAPS.md"].map(path => ({ target: resolve(root, path), source: resolve(candidate, path) }))];
    for (const change of committedChanges) {
      const target = change.target;
      const backup = resolve(transactionRoot, `backup-${backups.length}`);
      let existed = false;
      try { await access(target); existed = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
      if (existed) await cp(target, backup, { recursive: true });
      backups.push({ target, backup, existed });
      await rm(target, { recursive: true, force: true });
      if (change.source) {
        await mkdir(resolve(target, ".."), { recursive: true });
        await cp(resolve(candidate, relative(root, target)), target, { recursive: true });
      }
    }
    return result;
  } catch (error) {
    const rollbackErrors = [];
    for (const backup of backups.reverse()) {
      try {
        await rm(backup.target, { recursive: true, force: true });
        if (backup.existed) await cp(backup.backup, backup.target, { recursive: true });
      } catch (rollbackError) { rollbackErrors.push(`${backup.target}: ${rollbackError.message}`); }
    }
    // Generated indexes are backed up and restored with the content, too.
    if (rollbackErrors.length) {
      preserveRecoveryFiles = true;
      throw new Error(`${error.message}\n部分文件恢复失败，备份已保留在 ${transactionRoot}。请停止实验室后恢复备份。\n${rollbackErrors.join("\n")}`);
    }
    throw error;
  } finally {
    if (finishCommit) {
      try {
        for (const environment of Object.values(vite.environments)) environment.moduleGraph.invalidateAll();
      } finally { finishCommit(); }
    }
    if (!preserveRecoveryFiles) await rm(transactionRoot, { recursive: true, force: true });
  }
}

function flattenZip(entries) {
  const paths = Object.keys(entries).filter((path) => !path.endsWith("/"));
  if (!paths.length) throw new Error("教学包为空");
  const firstParts = paths.map((path) => path.split("/")[0]);
  const commonRoot = firstParts.every((part) => part === firstParts[0]) && paths.every((path) => path.includes("/")) ? `${firstParts[0]}/` : "";
  const flattened = new Map();
  for (const [rawPath, bytes] of Object.entries(entries)) {
    if (rawPath.endsWith("/")) continue;
    const path = commonRoot && rawPath.startsWith(commonRoot) ? rawPath.slice(commonRoot.length) : rawPath;
    const normalized = normalizeArchivePath(path);
    if ([...flattened.keys()].some(key => key.toLowerCase() === normalized.toLowerCase())) throw new Error(`教学包存在重复路径：${path}`);
    flattened.set(normalized, bytes);
  }
  return flattened;
}

async function stageTermZip(buffer, transactionRoot) {
  let entries;
  try {
    let total = 0; let count = 0;
    entries = unzipSync(new Uint8Array(buffer), { filter(file) {
      total += file.originalSize;
      if (++count > 5000 || total > 100 * 1024 * 1024) throw new Error("解压后超过 100 MB 或 5000 个文件");
      return true;
    } });
  } catch (error) { throw new Error(`无法解压词条教学包：${error.message}`); }
  const files = flattenZip(entries);
  for (const required of requiredTermFiles) if (!files.has(required)) throw new Error(`词条教学包缺少 ${required}`);
  const manifest = JSON.parse(Buffer.from(files.get("manifest.json")).toString("utf8"));
  if (manifest.schemaVersion !== "3.0" || manifest.sdkVersion !== "1.x" || !safeId(manifest.id)) throw new Error("manifest.json 不是有效的 3.0 词条教学包清单");
  const stage = resolve(transactionRoot, manifest.id);
  for (const [path, bytes] of files) {
    const extension = extname(path).toLowerCase();
    const allowed = [".json", ".tsx", ".ts", ".css", ".md", ".txt", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
    if (!allowed.includes(extension)) throw new Error(`教学包包含不允许的文件类型：${path}`);
    if ([".tsx", ".ts"].includes(extension)) validateSourceImports(path, Buffer.from(bytes).toString("utf8"));
    const target = resolve(stage, path);
    if (relative(stage, target).startsWith("..")) throw new Error(`教学包路径越界：${path}`);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, bytes);
  }
  return { id: manifest.id, title: manifest.title, stage };
}

function questionFilename(question) {
  return `${String(question.ordering.order).padStart(2, "0")}-${question.id}.json`;
}

async function stageQuestions(buffer, transactionRoot) {
  const raw = JSON.parse(buffer.toString("utf8"));
  const questions = raw.kind === "question-bundle" ? raw.questions : [raw];
  if (!Array.isArray(questions) || !questions.length) throw new Error("题目包为空");
  if (new Set(questions.map(question => question?.id)).size !== questions.length) throw new Error("同一题库包中不能包含重复题目 ID");
  const changes = [];
  for (const question of questions) {
    if (question.schemaVersion !== "3.0" || !safeId(question.id) || !Number.isInteger(question.ordering?.order)) throw new Error(`无效题目包：${question?.id ?? "unknown"}`);
    const stage = resolve(transactionRoot, questionFilename(question));
    await writeFile(stage, `${JSON.stringify(question, null, 2)}\n`);
    const existing = (await readdir(questionDirectory)).find((file) => file.endsWith(`-${question.id}.json`));
    if (existing && existing !== questionFilename(question)) changes.push({ target: resolve(questionDirectory, existing), source: null });
    changes.push({ target: resolve(questionDirectory, questionFilename(question)), source: stage });
  }
  return { changes, count: questions.length, ids: questions.map(question => question.id) };
}

async function zipDirectory(directory, prefix = "", include = () => true) {
  const entries = {};
  async function walk(current, currentPrefix) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      const archivePath = `${currentPrefix}${entry.name}`;
      if (entry.isDirectory()) await walk(path, `${archivePath}/`);
      else if (include(archivePath)) entries[archivePath] = new Uint8Array(await readFile(path));
    }
  }
  await walk(directory, prefix);
  return Buffer.from(zipSync(entries, { level: 6 }));
}

async function libraryStatus() {
  const questionCount = (await readdir(questionDirectory)).filter((file) => file.endsWith(".json")).length;
  const termCount = (await readdir(termDirectory, { withFileTypes: true })).filter((entry) => entry.isDirectory()).length;
  let missingTermCount = 0;
  try { missingTermCount = (await readFile(resolve(root, "content-libraries/CONTENT_GAPS.md"), "utf8")).split("\n").filter((line) => /^\| [a-zA-Z0-9]/.test(line)).length; } catch { /* not yet generated */ }
  return { version, publicUrl, questionCount, termCount, missingTermCount, publishing, environment: "lab", persistentRoot: "content-libraries/", packageFormat: "term-teaching-package-v3" };
}

let vite;
const server = createServer(async (request, response) => {
  let ownsPublish = false;
  try {
    const forwardedProto = request.headers["x-forwarded-proto"] ?? "http";
    const url = new URL(request.url ?? "/", `${forwardedProto}://${request.headers.host ?? "localhost"}`);
    if (host === "127.0.0.1" || host === "localhost") {
      if (!["127.0.0.1", "localhost"].includes(url.hostname) && !request.headers["x-forwarded-for"]) return json(response, 403, { ok: false, error: "实验室仅允许本机地址" });
      if (request.headers["sec-fetch-site"] === "cross-site") return json(response, 403, { ok: false, error: "不允许外站调用本机实验室" });
    }
    if (request.headers.origin && request.headers.origin !== url.origin) return json(response, 403, { ok: false, error: "不允许跨站内容请求" });
    if (!url.pathname.startsWith("/api/") || url.pathname === "/api/lab/catalog") {
      const release = await previewBoundary.enterRead();
      if (response.destroyed) { release(); return; }
      response.once("finish", release);
      response.once("close", release);
    }
    if (url.pathname === "/api/lab/session" && request.method === "POST") {
      if (!validDeveloperKey(request)) return json(response, 401, { ok: false, error: "开发者密钥无效" });
      return json(response, 200, { ok: true, token: adminToken });
    }
    if (url.pathname === "/api/lab/catalog" && request.method === "GET") {
      const terms = await Promise.all((await readdir(termDirectory, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(async entry => JSON.parse(await readFile(resolve(termDirectory, entry.name, "manifest.json"), "utf8"))));
      return json(response, 200, { ok: true, terms });
    }
    if (url.pathname === "/api/content/status" && request.method === "GET") return json(response, 200, { ok: true, ...(await libraryStatus()) });
    if (url.pathname.startsWith("/api/") && request.method !== "GET" && !authorized(request)) return json(response, 401, { ok: false, error: "实验室会话已失效，请刷新页面" });
    const checkedExport = /\/export$/.test(url.pathname) && url.pathname !== "/api/content/terms/export";
    if (url.pathname.startsWith("/api/") && (request.method !== "GET" || checkedExport)) {
      if (publishing) return json(response, 409, { ok: false, error: "另一项内容发布正在进行，请稍后重试" });
      publishing = true; ownsPublish = true;
    }
    if (url.pathname === "/api/lab/check" && request.method === "POST") {
      await transaction([]);
      return json(response, 200, { ok: true, message: "内容校验、测试和构建通过。未发布到正式站。" });
    }
    if (url.pathname === "/api/content/questions/import" && request.method === "POST") {
      const buffer = await readBody(request);
      const transactionRoot = resolve(stageDirectory, `question-upload-${Date.now()}`);
      await mkdir(transactionRoot, { recursive: true });
      try {
        const staged = await stageQuestions(buffer, transactionRoot);
        await transaction(staged.changes);
        return json(response, 200, { ok: true, imported: staged.count, ids: staged.ids, message: `已保存 ${staged.count} 道题到本机实验室。` });
      } finally { await rm(transactionRoot, { recursive: true, force: true }); }
    }
    if (url.pathname === "/api/content/terms/import" && request.method === "POST") {
      const buffer = await readBody(request);
      const transactionRoot = resolve(stageDirectory, `term-upload-${Date.now()}`);
      await mkdir(transactionRoot, { recursive: true });
      try {
        const staged = await stageTermZip(buffer, transactionRoot);
        await transaction([{ target: resolve(termDirectory, staged.id), source: staged.stage }]);
        return json(response, 200, { ok: true, imported: 1, id: staged.id, message: `词条教学包“${staged.title}”已保存到本机实验室。未修改正式站。` });
      } finally { await rm(transactionRoot, { recursive: true, force: true }); }
    }
    const deleteMatch = url.pathname.match(/^\/api\/content\/(questions|terms)\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/);
    if (deleteMatch && request.method === "DELETE") {
      if (!authorized(request)) return json(response, 401, { ok: false, error: "内容管理口令无效" });
      const [, kind, id] = deleteMatch;
      let target;
      if (kind === "terms") target = resolve(termDirectory, id);
      else {
        const file = (await readdir(questionDirectory)).find((item) => item.endsWith(`-${id}.json`));
        if (!file) return json(response, 404, { ok: false, error: "题目不存在" });
        const dependents = [];
        for (const candidate of (await readdir(questionDirectory)).filter((item) => item.endsWith(".json"))) {
          const question = JSON.parse(await readFile(resolve(questionDirectory, candidate), "utf8"));
          if (question.ordering?.prerequisites?.includes(id)) dependents.push(`${question.ordering.order} · ${question.id}`);
        }
        if (dependents.length) return json(response, 409, { ok: false, error: `不能删除：以下题目仍把它设为学习前置：${dependents.join("；")}。请先修改这些题目的 ordering.prerequisites。` });
        target = resolve(questionDirectory, file);
      }
      try { await access(target); } catch { return json(response, 404, { ok: false, error: "内容不存在" }); }
      await transaction([{ target, source: null }]);
      return json(response, 200, { ok: true, message: `${id} 已从本机实验室移除。` });
    }
    if (url.pathname === "/api/content/questions/export" && request.method === "GET") {
      const questions = await transaction([], async candidate => {
        const directory = resolve(candidate, "content-libraries/questions");
        return Promise.all((await readdir(directory)).filter(file => file.endsWith(".json")).map(async file => JSON.parse(await readFile(resolve(directory, file), "utf8"))));
      });
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=modelpath-question-library.json" });
      return response.end(JSON.stringify({ schemaVersion: "3.0", kind: "question-bundle", exportedAt: new Date().toISOString(), questions }, null, 2));
    }
    const termExportMatch = url.pathname.match(/^\/api\/content\/terms\/([a-zA-Z0-9][a-zA-Z0-9._-]*)\/export$/);
    if (termExportMatch && request.method === "GET") {
      const id = termExportMatch[1];
      const folder = resolve(termDirectory, id);
      try { await access(folder); } catch { return json(response, 404, { ok: false, error: "词条不存在" }); }
      const archive = await transaction([], candidate => zipDirectory(resolve(candidate, "content-libraries/terms", id), `${id}/`, includeInRuntimeTermArchive));
      response.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename=${id}.term.zip` });
      return response.end(archive);
    }
    if (url.pathname === "/api/content/templates/term" && request.method === "GET") {
      const archive = await zipDirectory(resolve(templateDirectory, "term-teaching-package"), "term-unique-id/");
      response.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=term-teaching-package-template.zip" });
      return response.end(archive);
    }
    if (url.pathname.startsWith("/api/")) return json(response, 404, { ok: false, error: "实验室没有此接口" });
    // The hosted lab is served through a reverse proxy under /lab/. Serve the
    // production build here so Vite cannot inject root-absolute dev scripts.
    const staticName = url.pathname === "/" || !extname(url.pathname) ? "index.html" : url.pathname.slice(1);
    try {
      const file = await readFile(resolve(staticDirectory, staticName));
      const contentType = staticName.endsWith(".html") ? "text/html; charset=utf-8" : staticName.endsWith(".js") ? "text/javascript; charset=utf-8" : staticName.endsWith(".css") ? "text/css; charset=utf-8" : "application/octet-stream";
      response.writeHead(200, { "Content-Type": contentType, "Cache-Control": staticName === "index.html" ? "no-store" : "public, max-age=31536000, immutable" });
      return response.end(file);
    } catch { /* fall through to Vite for local source preview */ }
    return vite.middlewares(request, response, () => json(response, 404, { ok: false, error: "Not found" }));
  } catch (error) {
    const status = error?.status ?? 400;
    return json(response, status, { ok: false, error: error instanceof Error ? error.message.slice(-5000) : String(error) });
  } finally {
    if (ownsPublish) publishing = false;
  }
});
vite = await createViteServer({ root, server: { middlewareMode: true, hmr: false, ws: false }, appType: "spa" });
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, async () => { await vite.close(); server.close(() => process.exit(0)); server.closeAllConnections(); });
server.on("error", async error => { console.error(error.code === "EADDRINUSE" ? `端口 ${port} 已使用，请先停止旧实验室，或用 --port 指定其他端口。` : error.message); await vite.close(); process.exitCode = 1; });

server.listen(port, host, () => {
  console.log(`ModelPath 独立内容实验室 ${version}: ${publicUrl}`);
  console.log("教学包保存在本目录 content-libraries；本服务不连接正式平台。");
});
