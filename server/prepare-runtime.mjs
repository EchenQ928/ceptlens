import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { resolveNpmInvocation } from "./npm-invocation.mjs";
import { ensureDependencies } from "./dependency-readiness.mjs";

// The company deployment baseline; dependencies are locked and tested on this version.
export function supportsNode(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return false;
  const [, major, minor] = match.map(Number);
  return major > 22 || (major === 22 && minor >= 18);
}

export function dependenciesMatch(manifest, installed) {
  return Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })
    .every(([name, version]) => installed?.packages?.[`node_modules/${name}`]?.version === version);
}

async function prepare() {
  if (!supportsNode(process.versions.node)) {
    throw new Error(`Node.js ${process.versions.node} 不满足依赖要求。请使用 Node.js 22.18.0 或更高版本。`);
  }
  const root = resolve(import.meta.dirname, "..");
  const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const runtime = resolve(root, ".modelpath-runtime");
  await mkdir(runtime, { recursive: true });
  const logfile = resolve(runtime, "startup-last.log");
  let log = "";
  const report = text => { log += text; process.stdout.write(text); };
  const redact = text => text.replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[redacted]@").replace(/((?:_authToken|authorization|password|token)\s*[=:]\s*)[^\s]+/gi, "$1[redacted]");
  async function installed() {
    try {
      const recorded = JSON.parse(await readFile(resolve(root, "node_modules/.package-lock.json"), "utf8"));
      if (!dependenciesMatch(manifest, recorded)) return false;
      for (const [name, version] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
        const actual = JSON.parse(await readFile(resolve(root, "node_modules", name, "package.json"), "utf8"));
        if (actual.version !== version) return false;
      }
      return true;
    } catch { return false; }
  }
  const run = (executable, args) => new Promise(resolvePromise => {
    let output = "";
    const child = spawn(executable, args, { cwd: root, stdio: ["inherit", "pipe", "pipe"], windowsHide: true });
    const collect = chunk => { const text = chunk.toString(); output += text; report(text); };
    child.stdout.on("data", collect); child.stderr.on("data", collect);
    child.once("error", error => { collect(Buffer.from(`${error.message}\n`)); resolvePromise({ code: null, output }); });
    // Wait for all npm output, not just process exit, before deciding readiness.
    child.once("close", code => resolvePromise({ code, output }));
  });
  report(`${new Date().toISOString()} · ${manifest.name} · Node ${process.versions.node} · ${process.platform}/${process.arch}\n`);
  try {
    const state = await ensureDependencies({
      installed,
      install: () => { const command = resolveNpmInvocation(["ci", "--engine-strict", "--include=dev", "--include=optional", "--no-audit", "--no-fund"]); return run(command.executable, command.args); },
      probe: async () => {
        report("检查依赖与本机编译工具是否可运行…\n");
        const result = await run(process.execPath, ["server/probe-runtime.mjs"]);
        if (result.code !== 0) throw new Error("运行探测失败，详情见上方输出");
      },
      wait: () => new Promise(resolvePromise => setTimeout(resolvePromise, 1500)),
      report
    });
    if (state === "usable-with-warning") await writeFile(resolve(runtime, "startup-warning.log"), redact(log));
    report("依赖准备完成，继续启动网站。\n");
  } catch (error) {
    report(`${error.message}\n`);
    await writeFile(resolve(runtime, "startup-failed.log"), redact(log));
    throw error;
  } finally {
    await writeFile(logfile, redact(log));
    console.log("启动检查日志：.modelpath-runtime/startup-last.log；最近失败日志：.modelpath-runtime/startup-failed.log");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  prepare().catch(error => { console.error(error.message); process.exitCode = 1; });
}
