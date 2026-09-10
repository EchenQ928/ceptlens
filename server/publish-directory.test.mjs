import { describe, expect, it, vi } from "vitest";
import { publishDirectory } from "./publish-directory.mjs";

describe("production build swap", () => {
  it("restores the old build if installing the next build fails", async () => {
    const rename = vi.fn(async (from) => { if (from === "next") throw new Error("disk busy"); });
    const io = { access: vi.fn(async () => {}), rename, rm: vi.fn(async () => {}) };
    await expect(publishDirectory("current", "next", "previous", io)).rejects.toThrow("disk busy");
    expect(rename.mock.calls).toEqual([["current", "previous"], ["next", "current"], ["previous", "current"]]);
  });
  it("keeps old hashed assets after a successful publication", async () => {
    const io = { access: vi.fn(async () => {}), rename: vi.fn(async () => {}), rm: vi.fn(async () => {}) };
    await publishDirectory("current", "next", "previous", io);
    expect(io.rm).toHaveBeenCalledTimes(1);
    expect(io.rename.mock.calls).toEqual([["current", "previous"], ["next", "current"]]);
  });
  it("does not touch the current build if the staged build is absent", async () => {
    const io = { access: vi.fn(async () => { throw new Error("missing next"); }), rename: vi.fn(), rm: vi.fn() };
    await expect(publishDirectory("current", "next", "previous", io)).rejects.toThrow();
    expect(io.rename).not.toHaveBeenCalled(); expect(io.rm).not.toHaveBeenCalled();
  });
});
