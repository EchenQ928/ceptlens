// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ExamIntroduction, ExamPaper, ExamReview } from "./ExamViews";
import type { ExamAttempt } from "../domain/exam";
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  HTMLDialogElement.prototype.close = vi.fn(); HTMLDialogElement.prototype.showModal = vi.fn();
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); });
const paper = {
  id: "exam-1", name: "同事 A", status: "active", revision: 0, startedAt: 100, deadline: 1800100, serverNow: 200, submittedAt: null, completePaper: false,
  questions: [{ id: "q-1", type: "single_choice", stem: "[[term:nn|神经网络]] 中的 $w_1$ 是？", options: [{ key: "A", text: "权重" }, { key: "B", text: "偏置" }] }], answers: {}, results: null, total: null
} as unknown as ExamAttempt;
it("lets users start a partial experience paper while explaining the missing type", async () => {
  const start = vi.fn(); await act(() => root.render(<ExamIntroduction catalog={{ plan: { minutes: 30 }, readiness: [{ type: "subjective", available: 0, required: 2 }], exams: [] }} name="A" setName={() => {}} busy={false} connected error="" start={start} open={() => {}} />));
  expect(container.textContent).toContain("缺 2 道"); expect(container.textContent).toContain("不发布完整总成绩");
});
it("preserves formula rendering but disables term navigation and answer leakage in the paper", async () => {
  const answer = vi.fn();
  await act(() => root.render(<MemoryRouter><ExamPaper attempt={paper} answers={{}} index={0} setIndex={() => {}} remaining={1799} busy={false} error="" saveStatus="已保存" answer={answer} save={() => {}} submit={() => {}} reload={() => {}} /></MemoryRouter>));
  expect(container.querySelector(".katex")).not.toBeNull(); expect(container.querySelector("a")).toBeNull();
  expect(container.textContent).not.toContain("参考答案"); expect(container.textContent).not.toContain("term:"); expect(container.textContent).not.toContain("待补词条");
  await act(() => (container.querySelector('input[type="radio"]') as HTMLInputElement).click()); expect(answer).toHaveBeenCalledWith("q-1", ["A"]);
});
it("displays partial scores without fabricating a total and allows wrong-answer review", async () => {
  const submitted = { ...paper, status: "submitted", submittedAt: 1000, objectiveScore: 0, objectiveMax: 5, questions: [{ ...paper.questions[0], correctAnswer: ["A"], explanation: "解释" }], results: [{ id: "q-1", state: "incorrect", score: 0, maxScore: 5 }] } as ExamAttempt;
  await act(() => root.render(<MemoryRouter><ExamReview attempt={submitted} error="" busy={false} back={() => {}} grade={() => {}} /></MemoryRouter>));
  expect(container.textContent).toContain("暂不发布"); expect(container.textContent).toContain("参考答案"); expect(container.textContent).toContain("未作答");
});
