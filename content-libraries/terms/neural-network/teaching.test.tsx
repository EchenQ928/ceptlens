// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MlpForwardExplorer } from "./explorer";
let container: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(() => root.render(<MlpForwardExplorer />));
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); });
async function select(name: string) {
  await act(() => (container.querySelector(`[aria-label="${name}"]`) as HTMLButtonElement).click());
}

const signal = (name: string) => container.querySelector('[data-node="'+name+'"]')?.textContent;
it("keeps function identity separate from values on outgoing connections", async () => {
  expect(container.querySelectorAll('[data-connection="input-hidden"]')).toHaveLength(4);
  expect(container.querySelectorAll('[data-connection="hidden-output"]')).toHaveLength(2);
  expect(container.querySelector('input')).toBeNull();
  const before = [signal('a'), signal('b'), signal('output')];
  expect(before).toEqual(['hA = 2', 'hB = 0', 'y = 1']);
  await select("查看函数 FB 的计算");
  expect(container.querySelector('[aria-pressed="true"]')?.textContent).toContain('FB');
  expect(container.querySelector('[aria-pressed="true"] [data-node]')).toBeNull();
  expect(container.querySelector('h3')?.textContent).toContain('FB');
  expect(container.textContent).toContain('负数归零');
  expect([signal('a'), signal('b'), signal('output')]).toEqual(before);
  await select("查看输出函数的计算");
  expect(container.querySelector('h3')?.textContent).toContain('Fout');
  expect(container.textContent).toContain('权重 wout1');
  expect(container.textContent).toContain('偏置 bout');
  expect(container.textContent).toContain('直接输出');
  await select("查看函数 FA 的计算");
  expect([signal('a'), signal('b'), signal('output')]).toEqual(before);
});
