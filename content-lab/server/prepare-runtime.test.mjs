import { expect, it } from "vitest";
import { supportsNode, dependenciesMatch } from "./prepare-runtime.mjs";

it("checks the Node version boundaries required by publication tools", () => {
  for (const version of ["20.19.0", "22.12.0", "22.17.9", "", "invalid", "22.18"]) expect(supportsNode(version)).toBe(false);
  for (const version of ["22.18.0", "v22.18.0", "22.22.2", "23.0.0", "24.13.0", "26.0.0"]) expect(supportsNode(version)).toBe(true);
});

it("detects new dependencies and missing publication tools on an upgraded PC", () => {
  const manifest = { dependencies: { fflate: "0.8.3", "highlight.js": "11.12.0" }, devDependencies: { vitest: "4.1.11" } };
  const installed = { packages: { "node_modules/fflate": { version: "0.8.3" } } };
  expect(dependenciesMatch(manifest, installed)).toBe(false);
  expect(dependenciesMatch(manifest, undefined)).toBe(false);
  installed.packages["node_modules/highlight.js"] = { version: "11.12.0" };
  installed.packages["node_modules/vitest"] = { version: "4.1.11" };
  expect(dependenciesMatch(manifest, installed)).toBe(true);
  installed.packages["node_modules/vitest"].version = "4.0.0";
  expect(dependenciesMatch(manifest, installed)).toBe(false);
});
