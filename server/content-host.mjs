import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const libraryPath = path.join(projectRoot, "content-libraries", "library.json");
const packagePath = path.join(projectRoot, "package.json");
const cliArgs = process.argv.slice(2);
const cliValue = (flag) => {
  const index = cliArgs.indexOf(flag);
  return index >= 0 ? cliArgs[index + 1] : undefined;
};
const port = Number(process.env.CEPTLENS_PORT ?? cliValue("--port") ?? cliArgs[0] ?? 4173);
const host = process.env.CEPTLENS_HOST ?? cliValue("--host") ?? "127.0.0.1";
const publicUrl = process.env.CEPTLENS_PUBLIC_ORIGIN ?? `http://${host}:${port}`;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

async function readStatus() {
  const [packageText, libraryText] = await Promise.all([
    readFile(packagePath, "utf8"),
    readFile(libraryPath, "utf8")
  ]);
  const packageJson = JSON.parse(packageText);
  const library = JSON.parse(libraryText);
  return {
    ok: true,
    version: packageJson.version,
    publicUrl,
    questionCount: library.questions.length,
    termCount: library.terms.length,
    publishing: false,
    environment: process.env.NODE_ENV ?? "production",
    persistentRoot: "content-libraries/",
    packageFormat: "bilingual-library-v1"
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function safeDistPath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(distRoot, relativePath);
  return candidate.startsWith(`${distRoot}${path.sep}`) ? candidate : null;
}

async function resolveAsset(urlPath) {
  const candidate = safeDistPath(urlPath);
  if (!candidate) {
    return null;
  }
  try {
    const fileInfo = await stat(candidate);
    if (fileInfo.isFile()) {
      return candidate;
    }
  } catch {
    return null;
  }
  return null;
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { ok: false, error: "Missing request URL" });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const pathname = request.url.split("?")[0];
  if (pathname === "/api/content/status") {
    try {
      const status = await readStatus();
      sendJson(response, 200, status);
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to read content status"
      });
    }
    return;
  }

  let assetPath = await resolveAsset(pathname);
  if (!assetPath && !path.extname(pathname)) {
    assetPath = await resolveAsset("/");
  }
  if (!assetPath) {
    sendJson(response, 404, { ok: false, error: "Not found" });
    return;
  }

  try {
    const body = await readFile(assetPath);
    response.writeHead(200, {
      "Cache-Control": path.basename(assetPath) === "index.html" ? "no-cache" : "public, max-age=31536000, immutable",
      "Content-Type": contentTypes[path.extname(assetPath).toLowerCase()] ?? "application/octet-stream"
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      response.end(body);
    }
  } catch {
    sendJson(response, 500, { ok: false, error: "Unable to read asset" });
  }
});

server.listen(port, host, () => {
  console.log(`CeptLens host listening at http://${host}:${port}`);
});

function shutdown(signal) {
  server.close(() => {
    console.log(`CeptLens host stopped after ${signal}`);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
