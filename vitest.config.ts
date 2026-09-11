import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@term-sdk": fileURLToPath(new URL("./src/content-sdk/index.tsx", import.meta.url)) } },
  test: {
    setupFiles: ["./scripts/test-environment.ts"],
    exclude: ["**/node_modules/**", ".ceptlens-runtime/**", "service-data/**", ".deploy/**", "**/dist/**", ".modelpath-lab/**", ".modelpath-runtime/**", ".dist-next/**", ".dist-previous/**"]
  }
});
