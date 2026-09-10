// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import katex from "katex";
import { BackpropagationAnimation, FRAME_DELAY, frames } from "./explorer";
import { evaluate, example, initial, type Parameters } from "./model";

async function mount(Component: React.ComponentType, run: (container: HTMLDivElement) => Promise<void>) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(() => root.render(<Component />));
    await run(container);
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
}

it("keeps the forward values and backward gradients mathematically consistent", () => {
  expect(example).toMatchObject({ a: 3, h: 3, prediction: 2, loss: 1, dPrediction: -2, dH: -2, dA: -2 });
  expect(example.gradients).toEqual({ w1: -4, w2: -2, b: -2, v: -6, c: -2 });
  for (const key of Object.keys(initial) as Array<keyof Parameters>) {
    const epsilon = 1e-5;
    const plus = evaluate({ ...initial, [key]: initial[key] + epsilon }).loss;
    const minus = evaluate({ ...initial, [key]: initial[key] - epsilon }).loss;
    const numeric = (plus - minus) / (2 * epsilon);
    expect(example.gradients[key]).toBeCloseTo(numeric, 6);
  }
});

it("renders every animation formula with reliable math markup", () => {
  for (const frame of frames) {
    for (const formula of [frame.formula, frame.substitution]) {
      expect(formula).not.toMatch(/[\t\r\n]/);
      expect(() => katex.renderToString(formula, { throwOnError: true, strict: "error" })).not.toThrow();
    }
  }
  expect(frames.at(-1)?.gradients).toEqual({ prediction: -2, v: -6, c: -2, h: -2, a: -2, w1: -4, w2: -2, b: -2 });
});

it("steps through the stable graph and can autoplay from the overview to completion", async () => {
  vi.useFakeTimers();
  try {
    await mount(BackpropagationAnimation, async (container) => {
      const index = () => Number(container.querySelector("[data-frame]")?.getAttribute("data-frame"));
      const click = async (label: string) => act(() => Array.from(container.querySelectorAll("button")).find((button) => button.textContent === label)?.click());
      expect(index()).toBe(0);
      expect(container.querySelector("[data-node='loss']")?.textContent).toContain("= 1");
      await click("播放演示");
      await act(async () => { await vi.advanceTimersByTimeAsync(FRAME_DELAY); });
      expect(index()).toBe(1);
      await click("暂停");
      expect(index()).toBe(1);
      for (let step = 1; step < frames.length - 1; step += 1) await click("下一步");
      expect(index()).toBe(frames.length - 1);
      expect(container.querySelector("[data-parameter='w1']")?.textContent).toContain("−4");
      expect(container.querySelector("[data-parameter='w2']")?.textContent).toContain("−2");
      expect(container.querySelector("[data-parameter='v']")?.textContent).toContain("−6");
      expect(container.querySelector("[data-parameter='c']")?.textContent).toContain("−2");
    });
  } finally {
    vi.useRealTimers();
  }
});
