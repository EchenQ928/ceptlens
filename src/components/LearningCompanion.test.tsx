// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LearningCompanion } from "./LearningCompanion";
import { LearningSession } from "./LearningSession";
const content = vi.hoisted(() => ({ questions: [], terms: [{ id: "demo", title: "前向传播" }] }));
vi.mock("../hooks/useContent", () => ({ useContent: () => content }));
let container: HTMLDivElement, root: Root;
let activeExam: string | null;
beforeEach(() => {
  activeExam = null;
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); sessionStorage.clear(); window.getSelection()?.removeAllRanges();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  Range.prototype.getBoundingClientRect = vi.fn(() => ({ x: 10, y: 10, left: 10, right: 80, top: 10, bottom: 30, width: 70, height: 20, toJSON: () => ({}) }));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const result = url.includes("/session") ? { user: { id: "u1", name: "同事 A" }, activeExam, agent: { enabled: false, model: null, message: "未接入" } } : url.includes("/assistant/history") ? { messages: [], agent: { enabled: false } } : { discussions: [] };
    return new Response(JSON.stringify({ ok: true, ...result }));
  }));
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function render(route = "/terms/demo") {
  await act(() => root.render(<MemoryRouter initialEntries={[route]}><LearningSession><article className="term-article"><p>前向传播是输入生成输出的过程。</p></article><LearningCompanion /></LearningSession></MemoryRouter>));
}
async function click(text: string) {
  const b = [...container.querySelectorAll("button")].find(b => b.textContent?.includes(text)); if (!b) throw new Error(text);
  await act(() => (b as HTMLButtonElement).click());
}
it("opens a quote-bound shared annotation from the right-click menu", async () => {
  await render(); const p = container.querySelector("article p")!;
  const range = document.createRange(); range.setStart(p.firstChild!, 0); range.setEnd(p.firstChild!, 4); window.getSelection()!.addRange(range);
  const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
  await act(() => p.dispatchEvent(event)); expect(event.defaultPrevented).toBe(true);
  expect(container.querySelector('[aria-label="选区操作"]')).not.toBeNull(); await click("批注");
  expect(container.querySelector('[aria-label="共享讨论"] blockquote')?.textContent).toBe("前向传播");
  expect(container.querySelector('[aria-label="批注内容"]')).not.toBeNull();
});
it("opens the assistant without a selection and shows its real unavailable state", async () => {
  await render(); await click("学习助手");
  expect(container.querySelector('[aria-label="学习助手"]')).not.toBeNull();
  expect(container.textContent).toContain("暂未接入大模型 API");
  expect(container.querySelector('[aria-label="移除引用"]')).not.toBeNull();
});
it("suppresses both affordances in exam routes and during an exam on other pages", async () => {
  activeExam = "exam-123"; await render();
  expect(container.querySelector(".companion-dock")).toBeNull(); expect(container.textContent).toContain("考核进行中");
});
