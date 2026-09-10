import { describe, expect, it } from "vitest";
import { allowsTermSourceImport, includeInRuntimeTermArchive, isTermTestSource, validateSourceImports, normalizeArchivePath } from "./term-package-policy.mjs";

describe("term package policy", () => {
  it("recognizes TypeScript test and spec files consistently", () => {
    expect(isTermTestSource("explorer.test.ts")).toBe(true);
    expect(isTermTestSource("nested/view.test.tsx")).toBe(true);
    expect(isTermTestSource("explorer.spec.ts")).toBe(true);
    expect(isTermTestSource("explorer.tsx")).toBe(false);
  });

  it("allows vitest only in source test files", () => {
    expect(allowsTermSourceImport("explorer.test.ts", "vitest")).toBe(true);
    expect(allowsTermSourceImport("view.tsx", "vitest")).toBe(false);
    expect(allowsTermSourceImport("view.tsx", "@term-sdk")).toBe(true);
    for (const library of ["react-dom/client", "katex"]) {
      expect(allowsTermSourceImport("teaching.test.tsx", library)).toBe(true);
      expect(allowsTermSourceImport("view.tsx", library)).toBe(false);
    }
  });

  it("excludes source tests from runtime exports", () => {
    expect(includeInRuntimeTermArchive("neural-network/explorer.test.ts")).toBe(false);
    expect(includeInRuntimeTermArchive("neural-network/explorer.tsx")).toBe(true);
  });

  it.each(["../outside.ts", "C:/outside.ts", "assets/../../outside.ts", "assets/NUL.txt", "assets/a.", "assets/a:stream.ts"]) ("rejects unsafe archive paths: %s", path => {
    expect(() => normalizeArchivePath(path)).toThrow();
  });
  it.each(['import "node:fs";', 'export * from "../outside";', 'const x = import("node:fs");', 'const x = import(path);', 'import "./../../outside";']) ("checks all import forms: %s", source => {
    expect(() => validateSourceImports("view.tsx", source)).toThrow();
  });
  it("allows scoped styles and React teaching components", () => {
    expect(() => validateSourceImports("view.tsx", 'import "./styles.module.css"; import { useState } from "react"; const body = <p>Hello</p>;')).not.toThrow();
  });
});
