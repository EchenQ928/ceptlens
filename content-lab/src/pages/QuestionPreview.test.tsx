// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import raw from "../../content-libraries/questions/003-KV-CACHE-20260909-Q03.json";
import { hydrateQuestionPackage } from "../domain/schemas";
import { QuestionPreview } from "./QuestionPreview";

it("shows one formatted learning answer and keeps grading guidance out of the page", async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const question = hydrateQuestionPackage(raw);
  question.explanation = "INTERNAL_EXPLANATION";
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
