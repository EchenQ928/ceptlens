// @vitest-environment jsdom
import { expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LayerExplorer } from './explorer';

it('keeps the full forward result visible while selection traces the matching inputs and calculation', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(() => root.render(<LayerExplorer />));
    const signals = () => Array.from(container.querySelectorAll('[data-signal]')).map(node => node.textContent);
    const expected = ['hA = 2','hB = 0','hC = 1','hD = 4','y = 2.5'];
    expect(signals()).toEqual(expected);
    expect(container.querySelectorAll('[data-edge]')).toHaveLength(10);
    for (const [id, sources, value] of [['B',['x1-B','x2-B'],0],['C',['A-C','B-C'],1],['D',['A-D','B-D'],4],['输出',['C-out','D-out'],2.5],['A',['x1-A','x2-A'],2]] as const) {
      await act(() => (container.querySelector(`[aria-label="查看单元 ${id}"]`) as HTMLButtonElement).click());
      expect(Array.from(container.querySelectorAll('[data-active="true"]')).map(edge => edge.getAttribute('data-edge'))).toEqual([...sources]);
      expect(container.querySelector('h3')?.textContent).toContain(`= ${value}`);
      if(id==='B') expect(container.querySelector('[aria-live]')?.textContent).toContain('负数归零');
      if(id==='输出') expect(container.querySelector('[aria-live]')?.textContent).toContain('直接保留总和');
      expect(signals()).toEqual(expected);
    }
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
