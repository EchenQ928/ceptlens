// @vitest-environment jsdom
import { expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ConnectionExplorer } from './explorer';

it('maps each weight to exactly one edge and one product without applying activation or changing outputs', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(() => root.render(<ConnectionExplorer />));
    expect(container.querySelectorAll('[data-edge]')).toHaveLength(6);
    expect(container.querySelectorAll('table button')).toHaveLength(6);
    for (const [id, product, total] of [['A1',0.7,-0.6],['A2',-0.8,-0.6],['A3',-0.6,-0.6],['B1',-0.3,2.6],['B2',1.6,2.6],['B3',1.5,2.6],['A1',0.7,-0.6]] as const) {
      await act(() => (container.querySelector(`[aria-label="查看权重 w${id}"]`) as HTMLButtonElement).click());
      const edges = container.querySelectorAll('[data-edge][data-selected="true"]');
      expect(edges).toHaveLength(1);
      expect(edges[0].getAttribute('data-edge')).toBe(id);
      const products = container.querySelectorAll('[data-product][data-selected="true"]');
      expect(products).toHaveLength(1);
      expect(products[0].getAttribute('data-product')).toBe(id);
      expect(products[0].lastElementChild?.textContent).toBe(String(product).replace('-', '−'));
      expect(container.querySelector('[data-total]')?.textContent).toBe(`z${id[0]} = ${String(total).replace('-', '−')}`);
      expect(container.querySelector('[data-output="A"]')?.textContent).toBe('zA = −0.6');
      expect(container.querySelector('[data-output="B"]')?.textContent).toBe('zB = 2.6');
    }
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
