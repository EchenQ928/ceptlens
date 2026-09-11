// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import raw from "../../content-libraries/templates/question-subjective.template.json";
import { hydrateQuestionPackage } from "../domain/schemas";
import { QuestionPreview } from "./QuestionPreview";

it("shows one formatted learning answer and keeps grading guidance out of the page", async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const question = hydrateQuestionPackage(raw);
  question.explanation = "INTERNAL_EXPLANATION";
  question.subjectiveAnswer = {
    referenceAnswer: "**Prefill：批量计算，建立缓存**\n\n独立的渲染测试内容。",
    rubric: [{ criterion: "INTERNAL_CRITERION", points: 1 }],
    gradingInstruction: "INTERNAL_GRADING"
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(() => root.render(<MemoryRouter><QuestionPreview question={question} terms={[]} /></MemoryRouter>));
    const show = [...container.querySelectorAll("button")].find(button => button.textContent === "查看答案")!;
    await act(() => show.click());
    const answer = container.querySelector(".answer-panel")!;
    expect(answer.textContent?.match(/Prefill：批量计算，建立缓存/g)).toHaveLength(1);
    expect(answer.querySelectorAll("strong").length).toBeGreaterThan(0);
    expect(answer.querySelectorAll("br").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("INTERNAL_EXPLANATION");
    for (const item of question.subjectiveAnswer!.rubric) expect(container.textContent).not.toContain(item.criterion);
    expect(container.textContent).not.toContain(question.subjectiveAnswer!.gradingInstruction);
    expect(answer.querySelector("ol")).toBeNull();
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});

it("shows a featured CeptCheck badge without featuring the parent question", async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const question = hydrateQuestionPackage({ ...raw, ceptCheck: { stem: 'Compare the two computations.', featured: true } });
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(() => root.render(<MemoryRouter><QuestionPreview question={question} terms={[]} /></MemoryRouter>));
    expect(container.querySelector('.question-panel > .question-meta .featured-badge')).toBeNull();
    expect(container.querySelector('.cept-check .featured-badge')?.textContent).toContain('精选 CeptCheck');
  } finally { await act(() => root.unmount()); container.remove(); }
});
