// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { ActivationExplorer } from './explorer';
import { activations } from './model';

it('keeps all six graphs and readouts synchronized through negative, zero, positive and restored inputs', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container=document.createElement('div');
  document.body.append(container);
  const root=createRoot(container);
  try {
    await act(()=>root.render(<ActivationExplorer />));
    expect(container.querySelectorAll('[data-function]')).toHaveLength(6);
    const cases=[[-1,[0,-0.1,0.268941,-0.761594,-0.158808,-0.268941]],[0,[0,0,0.5,0,0,0]],[2,[2,2,0.880797,0.964028,1.954598,1.761594]],[-1,[0,-0.1,0.268941,-0.761594,-0.158808,-0.268941]]] as const;
    for(const [input,expected] of cases){
      const button=Array.from(container.querySelectorAll('button')).find(b=>b.textContent===(input<0?'负数 −1':input>0?'正数 2':'0'))!;
      await act(()=>button.click());
      expect(container.querySelector('input')?.value).toBe(String(input));
      activations.forEach((activation,index)=>{
        const point=container.querySelector(`[data-function-point="${activation.id}"]`)!;
        expect(Number(point.getAttribute('data-input'))).toBe(input);
        expect(Number(point.getAttribute('data-output'))).toBeCloseTo(expected[index],5);
        const formatted=String(Number(expected[index].toFixed(3))).replace('-','−');
        expect(container.querySelector(`[data-function-output="${activation.id}"]`)?.textContent).toBe(`输出 ${formatted}`);
      });
    }
  } finally { await act(()=>root.unmount());container.remove(); }
});

it('keeps all function values finite across the plotted domain and honors key output bounds',()=>{
  for(let step=-40;step<=40;step++){
    const z=step/10;
    for(const activation of activations){
      const value=activation.evaluate(z);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(activation.yMin);
      expect(value).toBeLessThanOrEqual(activation.yMax);
    }
    expect(activations[2].evaluate(z)).toBeGreaterThan(0);
    expect(activations[2].evaluate(z)).toBeLessThan(1);
    expect(Math.abs(activations[3].evaluate(z))).toBeLessThan(1);
  }
});
