import { describe, expect, it } from "vitest";
import { resolveNpmInvocation } from "./npm-invocation.mjs";

describe("resolveNpmInvocation", () => {
  it("runs npm directly on Unix-like systems", () => {
    expect(resolveNpmInvocation(["run", "validate"], "darwin", {})).toEqual({
      executable: "npm",
      args: ["run", "validate"],
    });
  });

  it("runs npm.cmd through the Windows command interpreter", () => {
    expect(resolveNpmInvocation(["run", "build:staged"], "win32", { ComSpec: "C:\\Windows\\System32\\cmd.exe" })).toEqual({
      executable: "C:\\Windows\\System32\\cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd", "run", "build:staged"],
    });
  });

  it("falls back to cmd.exe when ComSpec is unavailable", () => {
    expect(resolveNpmInvocation(["run", "validate"], "win32", {})).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd", "run", "validate"],
    });
  });
});
