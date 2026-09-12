/// <reference types="node" />
// @vitest-environment jsdom
import React, { act } from "react";
import { readFileSync } from "node:fs";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import { QuestionPanel } from "./QuestionPanel";
import { ExamReview } from "./ExamViews";
import { RichText } from "./RichText";
import { LocaleProvider } from "../i18n";
import { hydrateQuestionPackage } from "../domain/schemas";
import { textForLocale, type Locale } from "../domain/content";
import type { ExamAttempt } from "../domain/exam";
import choice from "../../content-libraries/templates/question-choice.template.json";
import subjective from "../../content-libraries/templates/question-subjective.template.json";

// A published export can be audited without checking authored content into the platform repository.
const auditPath = process.env.CEPTLENS_QUESTION_AUDIT_FILE;
const sources: unknown[] = auditPath ? JSON.parse(readFileSync(auditPath, "utf8")).questions : [choice, subjective];
const questions = sources.map(hydrateQuestionPackage);
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); });

function checkRichText(element: Element | null, source: string) {
  expect(element).not.toBeNull();
  const copy = element!.cloneNode(true) as Element;
  expect(copy.querySelector(".katex-error")).toBeNull();
  for (const math of copy.querySelectorAll(".inline-math")) math.replaceWith(`$${math.querySelector("annotation")!.textContent}$`);
  for (const pending of copy.querySelectorAll(".term-link-pending small")) pending.remove();
  for (const br of copy.querySelectorAll("br")) br.replaceWith("\n");
  const expected = source.replace(/\r\n|\r/g, "\n").replace(/\[\[term:[^|]+\|([^\]]+)\]\]/g, "$1").replace(/\*\*/g, "");
  expect(copy.textContent).toBe(expected);
  expect(element!.querySelectorAll("br").length).toBe((source.match(/\r\n|\r|\n/g) ?? []).length);
}

for (const locale of ["en-US", "zh-CN"] as Locale[]) {
  for (const question of questions) {
    for (const mode of ["practice", "quick"] as const) {
      it(`${question.id} ${locale} ${mode}: preserves authored text, breaks, answers and CeptCheck; hides grading`, async () => {
        localStorage.setItem("ceptlens-locale", locale);
        await act(() => root.render(<MemoryRouter><LocaleProvider><QuestionPanel question={question} terms={[]} mode={mode} preview /></LocaleProvider></MemoryRouter>));
        if (mode === "practice") {
          expect(container.querySelector(".answer-panel")).toBeNull();
          await act(() => (container.querySelector(".answer-actions .primary-button") as HTMLButtonElement).click());
        }
        checkRichText(container.querySelector(".question-stem"), textForLocale(question.stem, locale));
        checkRichText(container.querySelector(".reference-answer"), textForLocale(question.type === "subjective" ? question.subjectiveAnswer!.referenceAnswer : question.explanation, locale));
        question.options.forEach((option, i) => checkRichText(container.querySelectorAll(".option-content")[i], textForLocale(option.text, locale)));
        if (question.ceptCheck) checkRichText(container.querySelector(".cept-check h2"), textForLocale(question.ceptCheck.stem, locale));
        else expect(container.querySelector(".cept-check")).toBeNull();
        expect(Boolean(container.querySelector(".question-toolbar .featured-badge"))).toBe(Boolean(question.featured));
        expect(Boolean(container.querySelector(".cept-check .featured-badge"))).toBe(Boolean(question.ceptCheck?.featured));
        expect(container.querySelector(".scoring-guidance, .rubric, .practice-notice")).toBeNull();
        expect(container.querySelector(".answer-heading strong")?.textContent ?? "").toBe(question.type === "subjective" ? "" : question.correctAnswer.join("、"));
      });
    }
    if (question.subjectiveAnswer) it(`${question.id} ${locale}: keeps the full rubric and points in Assess review`, async () => {
      localStorage.setItem("ceptlens-locale", locale);
      const attempt = { id: "display-review", name: "Review", status: "submitted", startedAt: 1, submittedAt: 2, questions: [question], answers: {}, results: [], total: null, objectiveScore: 0, objectiveMax: 0, completePaper: false } as unknown as ExamAttempt;
      await act(() => root.render(<MemoryRouter><LocaleProvider><ExamReview attempt={attempt} busy={false} error="" back={() => {}} grade={() => {}} /></LocaleProvider></MemoryRouter>));
      const items = container.querySelectorAll(".review-answer ul li");
      expect(items.length).toBe(question.subjectiveAnswer!.rubric.length);
      question.subjectiveAnswer!.rubric.forEach((item, i) => {
        expect(items[i].textContent).toContain(String(item.points));
        expect(items[i].textContent).toContain(textForLocale(item.criterion, locale).replace(/\*\*/g, "").replace(/\[\[term:[^|]+\|([^\]]+)\]\]/g, "$1"));
      });
    });
  }
}

it("preserves CRLF, blank lines and breaks inside bold text without changing math or term links", async () => {
  const text = "**Heading\r\ncontinued**\r\n\r\nUse $d^2$ and [[term:cache|cache]].\nNext line.";
  await act(() => root.render(<MemoryRouter><RichText text={text} terms={[]} /></MemoryRouter>));
  checkRichText(container.firstElementChild, text);
  expect(container.querySelectorAll("strong br")).toHaveLength(1);
  expect(container.querySelectorAll(".katex")).toHaveLength(1);
});
