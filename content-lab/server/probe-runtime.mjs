// A fresh child checks actual modules and host-native tools, not folder presence.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { parseAst } from "rolldown/parseAst";
import { transformSync } from "esbuild";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
for (const name of ["fflate", "zod", "react", "react-dom", "react-router-dom", "katex", "highlight.js", "lucide-react", "vite", "@vitejs/plugin-react"]) await import(name);
parseAst("const value: number = 1", { lang: "ts" });
transformSync("const value: number = 1", { loader: "ts" });
require("lightningcss").transform({ filename: "probe.css", code: Buffer.from(".probe { color: red }") });
for (const script of ["node_modules/typescript/bin/tsc", "node_modules/tsx/dist/cli.mjs", "node_modules/vitest/vitest.mjs"]) {
  const result = spawnSync(process.execPath, [resolve(root, script), "--version"], { cwd: root, encoding: "utf8", windowsHide: true, timeout: 20000 });
  if (result.error || result.status !== 0) throw new Error(`${script}: ${result.error?.message ?? result.stderr ?? result.status}`);
}
console.log("运行检查通过：页面依赖、原生构建模块、TypeScript、tsx、Vitest。");
