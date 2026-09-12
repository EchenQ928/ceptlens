import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { unzipSync, zipSync } from "fflate";
import { validateSourceImports, normalizeArchivePath, includeInRuntimeTermArchive } from "./term-package-policy.mjs";
import { createContentStorage, contentStoreDirectory } from "./content-storage.mjs";
import { createLearningApi } from "./learning-api.mjs";
import { readUploadFiles } from "./content-upload.mjs";

const root = resolve(import.meta.dirname, "..");
const { version } = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const storage = await createContentStorage({ root });
await storage.initialize(process.env.CEPTLENS_CONTENT_SEED);
const questionDirectory = () => resolve(storage.active.library, "questions");
const termDirectory = () => resolve(storage.active.library, "terms");
const templateDirectory = resolve(root, "content-libraries/templates");
const runtimeDirectory = resolve(contentStoreDirectory(root), "runtime");
const stageDirectory = resolve(runtimeDirectory, "stage");
const tokenFile = resolve(runtimeDirectory, "content-admin-token.txt");
const requiredTermFiles = ["manifest.json", "view.tsx"];
const maximumUploadBytes = 25 * 1024 * 1024;
let publishing = false;

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const host = valueAfter("--host", "127.0.0.1");
const port = Number(valueAfter("--port", "8765"));
const publicHost = valueAfter("--public-host", host === "0.0.0.0" ? "127.0.0.1" : host);
const configuredOrigin = process.env.CEPTLENS_PUBLIC_ORIGIN?.trim() || undefined;
if (configuredOrigin && (!/^https?:\/\//.test(configuredOrigin) || new URL(configuredOrigin).origin !== configuredOrigin)) {
  throw new Error("CEPTLENS_PUBLIC_ORIGIN 必须是完整的 HTTP(S) origin，不含路径或末尾斜杠。");
}
const publicUrl = configuredOrigin ? `${configuredOrigin}/` : `http://${publicHost}:${port}/`;
if (args.includes("--lab")) throw new Error("实验室已拆分为独立项目，请启动独立实验室包中的 start-lab 脚本。");
delete process.env.VITE_CEPTLENS_MODE;

await mkdir(runtimeDirectory, { recursive: true });
await mkdir(stageDirectory, { recursive: true });
let adminToken = process.env.CEPTLENS_CONTENT_TOKEN?.trim();
if (!adminToken) {
  try { adminToken = (await readFile(tokenFile, "utf8")).trim(); }
  catch {
    try { adminToken = (await readFile(resolve(root, ".ceptlens-runtime/content-admin-token.txt"), "utf8")).trim(); } catch { adminToken = randomBytes(18).toString("base64url"); }
    await writeFile(tokenFile, `${adminToken}\n`, { mode: 0o600 });
  }
}

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
  return request.headers["x-content-admin-token"] === adminToken || learningApi.canManageContent(request.headers.cookie);
}

async function transaction(changes) {
  const previousLibrary = storage.active.library;
  await storage.publish("content-upload", async library => {
    for (const change of changes) {
      const path = relative(previousLibrary, change.target);
      if (!path || path.startsWith("..")) throw new Error("Content change is outside the active library");
      const target = resolve(library, path);
      await rm(target, { recursive: true, force: true });
      if (change.source) {
        await mkdir(resolve(target, ".."), { recursive: true });
        await cp(change.source, target, { recursive: true });
      }
    }
  });
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

async function stageTermZip(buffer, transactionRoot, budget = { bytes: 0, files: 0 }) {
  let entries;
  try {
    entries = unzipSync(new Uint8Array(buffer), { filter(file) {
      budget.bytes += file.originalSize;
      if (++budget.files > 5000 || budget.bytes > 100 * 1024 * 1024) throw new Error("解压后超过 100 MB 或 5000 个文件");
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
    const existing = (await readdir(questionDirectory())).find((file) => file.endsWith(`-${question.id}.json`));
    if (existing && existing !== questionFilename(question)) changes.push({ target: resolve(questionDirectory(), existing), source: null });
    changes.push({ target: resolve(questionDirectory(), questionFilename(question)), source: stage });
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
  const active = storage.active;
  const questionCount = (await readdir(resolve(active.library, "questions"))).filter((file) => file.endsWith(".json")).length;
  const termCount = (await readdir(resolve(active.library, "terms"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).length;
  let missingTermCount = 0;
  try { missingTermCount = (await readFile(resolve(active.library, "CONTENT_GAPS.md"), "utf8")).split("\n").filter((line) => /^\| [a-zA-Z0-9]/.test(line)).length; } catch { /* not yet generated */ }
  return { version, publicUrl, questionCount, termCount, missingTermCount, publishing, environment: "production", persistentRoot: storage.directory, contentRevision: active.revision, contentHash: active.contentHash, packageFormat: "term-teaching-package-v3" };
}

const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".map": "application/json; charset=utf-8" };

async function serveStatic(request, response, url) {
  const distDirectory = storage.active.dist;
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const target = resolve(distDirectory, `.${requested}`);
  if (relative(distDirectory, target).startsWith("..")) return json(response, 403, { ok: false, error: "Forbidden" });
  try {
    const fileStat = await stat(target);
    if (!fileStat.isFile()) throw new Error("not file");
    const data = await readFile(target);
    response.writeHead(200, { "Content-Type": mime[extname(target)] ?? "application/octet-stream", "Cache-Control": target.endsWith("index.html") ? "no-store" : "public, max-age=3600" });
    response.end(data);
  } catch {
    // Requests already using the previous HTML may still request its hashed assets.
    if (requested.startsWith("/assets/") || (publishing && requested === "/index.html")) {
      try {
        const previousDistDirectory = await storage.previousDist();
        if (!previousDistDirectory) throw new Error("No previous build");
        const data = await readFile(resolve(previousDistDirectory, `.${requested}`));
        response.writeHead(200, { "Content-Type": mime[extname(target)] ?? "application/octet-stream" });
        return response.end(data);
      } catch { /* no matching prior asset */ }
    }
    json(response, 404, { ok: false, error: "Not found" });
  }
}

const learningApi = await createLearningApi({ root, contentRoot: () => storage.active.library, databasePath: process.env.CEPTLENS_DATA_DIR ? resolve(process.env.CEPTLENS_DATA_DIR, "ceptlens.sqlite") : undefined });
const server = createServer(async (request, response) => {
  let ownsPublish = false;
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (request.headers.origin && request.headers.origin !== (configuredOrigin ?? url.origin)) return json(response, 403, { ok: false, error: "不允许跨站内容请求" });
    if (await learningApi.handle(request, response, url, json)) return;
    if (url.pathname === "/api/content/status" && request.method === "GET") return json(response, 200, { ok: true, ...(await libraryStatus()) });
    if (url.pathname.startsWith("/api/content/") && request.method !== "GET" && !authorized(request)) return json(response, 401, { ok: false, error: "内容管理口令无效" });
    if (url.pathname.startsWith("/api/content/") && request.method !== "GET") {
      if (publishing) return json(response, 409, { ok: false, error: "另一项内容发布正在进行，请稍后重试" });
      publishing = true; ownsPublish = true;
    }
    if (url.pathname === "/api/content/history" && request.method === "GET") return json(response, 200, { ok: true, currentRevision: storage.active.revision, revisions: await storage.history() });
    if (url.pathname === "/api/content/restore" && request.method === "POST") {
      const { revision } = JSON.parse((await readBody(request)).toString("utf8"));
      await storage.restore(revision);
      return json(response, 200, { ok: true, revision: storage.active.revision, message: "Content restored as a new revision. User records were preserved." });
    }
    if (url.pathname === "/api/content/questions/import-files" && request.method === "POST") {
      const files = await readUploadFiles(await readBody(request), request.headers["content-type"], ".json");
      const questions = [];
      for (const file of files) {
        try {
          const raw = JSON.parse(file.buffer.toString("utf8"));
          if (!raw || typeof raw !== "object") throw new Error("Expected a question object.");
          // Keep existing bundle imports compatible without requiring authors to combine files.
          const items = raw.kind === "question-bundle" ? raw.questions : [raw];
          if (!Array.isArray(items) || !items.length) throw new Error("No questions found.");
          for (const question of items) {
            if (!question || question.schemaVersion !== "3.0" || !safeId(question.id) || !Number.isInteger(question.ordering?.order)) throw new Error("Invalid question package.");
            questions.push(question);
          }
        } catch (error) { throw new Error(`${file.name}: ${error.message}`); }
      }
      const transactionRoot = resolve(stageDirectory, `question-files-${Date.now()}`);
      await mkdir(transactionRoot, { recursive: true });
      let staged;
      try {
        staged = await stageQuestions(Buffer.from(JSON.stringify({ kind: "question-bundle", questions })), transactionRoot);
        await transaction(staged.changes);
      } finally { await rm(transactionRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(error => console.warn(`Upload staging cleanup deferred: ${error.message}`)); }
      return json(response, 200, { ok: true, imported: staged.count, ids: staged.ids, message: `已发布 ${staged.count} 道题，所有访问者刷新后生效。` });
    }
    if (url.pathname === "/api/content/terms/import-files" && request.method === "POST") {
      const files = await readUploadFiles(await readBody(request), request.headers["content-type"], ".zip");
      const transactionRoot = resolve(stageDirectory, `term-files-${Date.now()}`);
      await mkdir(transactionRoot, { recursive: true });
      const changes = [], ids = new Set();
      const budget = { bytes: 0, files: 0 };
      try {
        for (const [index, file] of files.entries()) {
          try {
            const staged = await stageTermZip(file.buffer, resolve(transactionRoot, String(index)), budget);
            if (ids.has(staged.id)) throw new Error(`Duplicate term ID: ${staged.id}`);
            ids.add(staged.id);
            changes.push({ target: resolve(termDirectory(), staged.id), source: staged.stage });
          } catch (error) { throw new Error(`${file.name}: ${error.message}`); }
        }
        await transaction(changes);
      } finally { await rm(transactionRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(error => console.warn(`Upload staging cleanup deferred: ${error.message}`)); }
      return json(response, 200, { ok: true, imported: ids.size, ids: [...ids], message: `已发布 ${ids.size} 个词条教学包，所有访问者刷新后生效。` });
    }
    if (url.pathname === "/api/content/questions/import" && request.method === "POST") {
      const buffer = await readBody(request);
      const transactionRoot = resolve(stageDirectory, `question-upload-${Date.now()}`);
      await mkdir(transactionRoot, { recursive: true });
      let staged;
      try {
        staged = await stageQuestions(buffer, transactionRoot);
        await transaction(staged.changes);
      } finally { await rm(transactionRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(error => console.warn(`Upload staging cleanup deferred: ${error.message}`)); }
      return json(response, 200, { ok: true, imported: staged.count, ids: staged.ids, message: `已发布 ${staged.count} 道题，所有访问者刷新后生效。` });
    }
    if (url.pathname === "/api/content/terms/import" && request.method === "POST") {
      const buffer = await readBody(request);
      const transactionRoot = resolve(stageDirectory, `term-upload-${Date.now()}`);
      await mkdir(transactionRoot, { recursive: true });
      let staged;
      try {
        staged = await stageTermZip(buffer, transactionRoot);
        await transaction([{ target: resolve(termDirectory(), staged.id), source: staged.stage }]);
      } finally { await rm(transactionRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(error => console.warn(`Upload staging cleanup deferred: ${error.message}`)); }
      return json(response, 200, { ok: true, imported: 1, id: staged.id, message: `词条教学包“${staged.title}”已保存到广播主机并发布。` });
    }
    const deleteMatch = url.pathname.match(/^\/api\/content\/(questions|terms)\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/);
    if (deleteMatch && request.method === "DELETE") {
      if (!authorized(request)) return json(response, 401, { ok: false, error: "内容管理口令无效" });
      const [, kind, id] = deleteMatch;
      let target;
      if (kind === "terms") target = resolve(termDirectory(), id);
      else {
        const file = (await readdir(questionDirectory())).find((item) => item.endsWith(`-${id}.json`));
        if (!file) return json(response, 404, { ok: false, error: "题目不存在" });
        const dependents = [];
        for (const candidate of (await readdir(questionDirectory())).filter((item) => item.endsWith(".json"))) {
          const question = JSON.parse(await readFile(resolve(questionDirectory(), candidate), "utf8"));
          if (question.ordering?.prerequisites?.includes(id)) dependents.push(`${question.ordering.order} · ${question.id}`);
        }
        if (dependents.length) return json(response, 409, { ok: false, error: `不能删除：以下题目仍把它设为学习前置：${dependents.join("；")}。请先修改这些题目的 ordering.prerequisites。` });
        target = resolve(questionDirectory(), file);
      }
      try { await access(target); } catch { return json(response, 404, { ok: false, error: "内容不存在" }); }
      await transaction([{ target, source: null }]);
      return json(response, 200, { ok: true, message: `${kind === "terms" ? "词条教学包" : "题目包"} ${id} 已从广播主机删除。` });
    }
    if (url.pathname === "/api/content/questions/export" && request.method === "GET") {
      const directory = questionDirectory();
      const questions = await Promise.all((await readdir(directory)).filter((file) => file.endsWith(".json")).map(async (file) => JSON.parse(await readFile(resolve(directory, file), "utf8"))));
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=ceptlens-question-library.json" });
      return response.end(JSON.stringify({ schemaVersion: "3.0", kind: "question-bundle", exportedAt: new Date().toISOString(), questions }, null, 2));
    }
    if (url.pathname === "/api/content/terms/export" && request.method === "GET") {
      const archive = await zipDirectory(termDirectory(), "terms/", includeInRuntimeTermArchive);
      response.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=ceptlens-term-library.zip" });
      return response.end(archive);
    }
    const termExportMatch = url.pathname.match(/^\/api\/content\/terms\/([a-zA-Z0-9][a-zA-Z0-9._-]*)\/export$/);
    if (termExportMatch && request.method === "GET") {
      const id = termExportMatch[1];
      const folder = resolve(termDirectory(), id);
      try { await access(folder); } catch { return json(response, 404, { ok: false, error: "词条不存在" }); }
      const archive = await zipDirectory(folder, `${id}/`, includeInRuntimeTermArchive);
      response.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename=${id}.term.zip` });
      return response.end(archive);
    }
    if (url.pathname === "/api/content/templates/term" && request.method === "GET") {
      const archive = await zipDirectory(resolve(templateDirectory, "term-teaching-package"), "term-unique-id/");
      response.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=term-teaching-package-template.zip" });
      return response.end(archive);
    }
    return await serveStatic(request, response, url);
  } catch (error) {
    const status = error?.status ?? 400;
    return json(response, status, { ok: false, error: error instanceof Error ? error.message.slice(-5000) : String(error) });
  } finally {
    if (ownsPublish) publishing = false;
  }
});
server.on("close", () => learningApi.close());
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => server.close(() => process.exit(0)));

server.listen(port, host, () => {
  console.log(`CeptLens ${version}: ${publicUrl}`);
  console.log(process.env.CEPTLENS_CONTENT_TOKEN ? "内容管理口令已从环境配置加载。" : `内容管理口令保存在：${tokenFile}`);
  if (host === "0.0.0.0") console.log(`内网访问：${publicUrl}（监听 0.0.0.0:${port}）；导入内容保存到 ${storage.directory}。`);
});
