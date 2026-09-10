import { describe, expect, it } from "vitest";
import { emptyProgress, progressStorageKey, readProgress, writeProgress } from "./progress";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    }
  };
}

describe("progress storage", () => {
  it("round trips progress through browser storage", () => {
    const storage = createStorage();
    const progress = {
      completedQuestionIds: ["q001-data-quality-dimensions"],
      favoriteTermIds: ["transformer"]
    };
    writeProgress(progress, storage);
    expect(readProgress(storage)).toEqual(progress);
  });

  it("recovers from malformed storage", () => {
    const storage = createStorage();
    storage.setItem(progressStorageKey, "{bad json");
    expect(readProgress(storage)).toEqual(emptyProgress);
  });
});
