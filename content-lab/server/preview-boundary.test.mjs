import { expect, it } from "vitest";
import { createPreviewBoundary } from "./preview-boundary.mjs";

it("drains existing preview reads and blocks new reads through commit/rollback", async () => {
  const gate = createPreviewBoundary();
  const releaseFirst = await gate.enterRead();
  const order = [];
  const writing = gate.beginWrite().then(release => { order.push("write"); return release; });
  const reading = gate.enterRead().then(release => { order.push("read"); return release; });
  await Promise.resolve();
  expect(order).toEqual([]);
  releaseFirst(); releaseFirst();
  const finish = await writing;
  expect(order).toEqual(["write"]);
  finish(); finish();
  (await reading)();
  expect(order).toEqual(["write", "read"]);
  const next = await gate.beginWrite(); next();
});

it("releases waiting previews after a failed commit is rolled back", async () => {
  const gate = createPreviewBoundary();
  const finish = await gate.beginWrite();
  let entered = false;
  const waiting = gate.enterRead().then(release => { entered = true; release(); });
  try { throw new Error("copy failed"); } catch { expect(entered).toBe(false); } finally { finish(); }
  await waiting;
  expect(entered).toBe(true);
});
