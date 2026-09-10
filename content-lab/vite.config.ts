import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@term-sdk": fileURLToPath(new URL("./src/content-sdk/index.tsx", import.meta.url)) } },
  base: "./",
  server: {
    host: "127.0.0.1",
    allowedHosts: true,
    fs: { deny: [".env", ".env.*", "**/.git/**", "**/.modelpath-runtime/**", "**/server/**", "**/scripts/**", "**/*.pem", "**/*.key"] },
    // Content imports are transactions, not individual HMR file edits. The host
    // invalidates the complete graph after commit; the UI reloads after success.
    // For direct file edits use the existing “校验与刷新” action.
    watch: { ignored: ["**/.modelpath-runtime/**", "**/dist/**", "**/content-libraries/**"] }
  },
  build: { target: "es2022", chunkSizeWarningLimit: 800 }
});
