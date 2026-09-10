import { spawnSync } from "node:child_process";
import { constants, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveNpmInvocation } from "../server/npm-invocation.mjs";

const root = resolve(import.meta.dirname, "..");
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error("Node.js 22.18.0 or newer is required. CI uses the version in .nvmrc.");
  process.exit(1);
}

for (const directory of [root, resolve(root, "content-lab")]) {
  console.log(`Installing locked dependencies in ${directory}`);
  const invocation = resolveNpmInvocation(["ci", "--include=dev", "--include=optional"]);
  const result = spawnSync(invocation.executable, invocation.args, {
    cwd: directory,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message ?? `Dependency installation failed in ${directory}.`);
    process.exit(result.status || 1);
  }
}

try {
  copyFileSync(resolve(root, ".env.example"), resolve(root, ".env"), constants.COPYFILE_EXCL);
  console.log("Created local .env with development defaults.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Kept existing .env.");
}

console.log("Setup complete. Run npm run check:all, then npm start.");
console.log("Start the independent Content Lab in another terminal: npm --prefix content-lab start");
