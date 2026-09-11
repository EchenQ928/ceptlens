import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, normalizePath, type Plugin } from "vite";
import base from "../vite.config.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const store = resolve(process.env.CEPTLENS_CONTENT_DIR || resolve(process.env.CEPTLENS_DATA_DIR || resolve(root, "service-data"), "content-store"));
let library = resolve(root, "content-libraries");
try {
  const pointer = JSON.parse(readFileSync(resolve(store, "current.json"), "utf8"));
  if (!/^[a-zA-Z0-9-]+$/.test(pointer.revision)) throw new Error("Invalid content snapshot revision");
  library = resolve(store, "snapshots", pointer.revision, "content-libraries");
  readFileSync(resolve(library, ".generated/dependencies.json"));
  console.info(`[UI preview] Reading published snapshot ${pointer.revision} (${pointer.questionCount} questions).`);
} catch (error) {
  if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT") || library !== resolve(root, "content-libraries")) throw error;
  console.info("[UI preview] No local publication yet; reading the Git seed library.");
}
const libraryImport = normalizePath(relative(resolve(root, "src/infrastructure"), library));
const previewContent: Plugin = {
  name: "ceptlens-preview-content",
  enforce: "pre",
  transform(code, id) {
    if (normalizePath(id).split("?")[0] !== normalizePath(resolve(root, "src/infrastructure/staticContent.ts"))) return;
    return code.replaceAll("../../content-libraries/", `${libraryImport}/`);
  }
};

// Preview platform edits against a read-only snapshot of local published content.
// Restart after uploading content to select the new snapshot. API calls use the local host.
export default mergeConfig(base, defineConfig({
  plugins: [previewContent],
  server: {
    host: "127.0.0.1", port: 8770, strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8765" },
    fs: { allow: [root, library] },
    // Avoid holding Windows handles on snapshots or fixtures during atomic renames.
    watch: { ignored: ["**/.ceptlens-runtime/**", "**/service-data/**", "**/dist/**", "**/.dist-next/**"] }
  }
}));
