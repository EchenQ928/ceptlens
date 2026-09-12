// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QuestionPanel } from "./QuestionPanel";
import { hydrateQuestionPackage } from "../domain/schemas";
import { readProgress, updateProgress } from "../infrastructure/progressRepository";
import choice from "../../content-libraries/templates/question-choice.template.json";
import subjective from "../../content-libraries/templates/question-subjective.template.json";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); });
async function render(source: unknown, preview = false) { await act(() => root.render(<MemoryRouter><QuestionPanel question={hydrateQuestionPackage(source)} terms={[]} mode="practice" preview={preview} /></MemoryRouter>)); }
async function click(text: string) { const button = [...container.querySelectorAll("button")].find(b => b.textContent?.includes(text)); if (!button) throw new Error(text); await act(() => button.click()); }
it("restores an existing favorite and can remove it", async () => {
  updateProgress(p => p.favorites.push(choice.id)); await render(choice);
  expect(container.querySelector('button[aria-pressed="true"]')?.textContent).toContain("已收藏");
  await click("已收藏"); expect(readProgress().favorites).toEqual([]);
});
it("does not convert an ungraded subjective answer into a correct answer", async () => {
  updateProgress(p => p.wrong.push(subjective.id)); await render(subjective); await click("查看答案");
  expect(readProgress().wrong).toContain(subjective.id);
  expect(container.querySelector(".reference-answer")).not.toBeNull();
  expect(container.textContent).not.toContain("评分要点");
  expect(container.querySelector(".scoring-guidance")).toBeNull();
});
it("selects an option by its text and records an incorrect attempt", async () => {
  await render(choice);
  await act(() => (container.querySelectorAll(".option-content")[1] as HTMLElement).click());
  await click("查看答案"); expect(readProgress().wrong).toContain(choice.id);
});
it("shows a preview answer without writing progress or showing learning controls", async () => {
  const before = readProgress(); await render(choice, true); await click("查看答案");
  expect(container.querySelector(".answer-panel")).not.toBeNull();
  expect(container.querySelector(".question-footer")).toBeNull();
  expect(container.textContent).not.toContain("收藏");
  expect(readProgress()).toEqual(before);
});

it("marks only the selected CeptCheck and leaves the question unfeatured", async () => {
  await render({ ...choice, ceptCheck: { stem: "A thought experiment", featured: true } });
  expect(container.querySelector('.question-toolbar .featured-badge')).toBeNull();
  expect(container.querySelector('.cept-check .featured-badge')?.textContent).toContain('精选 CeptCheck');
  expect(container.querySelector('.cept-check')?.textContent).toContain('A thought experiment');
});
