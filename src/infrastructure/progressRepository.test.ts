// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { readProgress, updateProgress } from "./progressRepository";

beforeEach(() => localStorage.clear());
it("recovers corrupted progress fields without breaking the learning pages", () => {
  localStorage.setItem("ceptlens.progress.v1", JSON.stringify({ completed: null, wrong: "bad", favorites: ["q1"], confidence: { q1: "bad" } }));
  expect(readProgress()).toMatchObject({ completed: [], wrong: [], favorites: ["q1"], confidence: {} });
});
it("persists favorites and learning confidence", () => {
  updateProgress(p => { p.favorites.push("q1"); p.confidence.q1 = "clear"; });
  expect(readProgress()).toMatchObject({ favorites: ["q1"], confidence: { q1: "clear" } });
});
