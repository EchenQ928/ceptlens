import { access, rename, rm } from "node:fs/promises";

// Keep the old build until the new build is in place, and restore it on swap failure.
export async function publishDirectory(current, next, previous, io = { access, rename, rm }) {
  await io.access(next);
  await io.rm(previous, { recursive: true, force: true, maxRetries: 12, retryDelay: 100 });
  let moved = false;
  try {
    try { await io.access(current); } catch (error) { if (error.code !== "ENOENT") throw error; }
    try { await io.rename(current, previous); moved = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
    await io.rename(next, current);
  } catch (error) {
    if (moved) await io.rename(previous, current);
    throw error;
  }
  // Keep one prior build for tabs that still reference its hashed assets.
}
