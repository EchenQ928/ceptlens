// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {RegressionExplorer,ClassificationExplorer} from './explorer';
import {classificationExample,regressionExample} from './model';
async function mount(Component:React.ComponentType,run:(container:HTMLDivElement)=>Promise<void>) {
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container);
  try{await act(()=>root.render(<Component/>));await run(container);}finally{await act(()=>root.unmount());container.remove();}
}

it('keeps sample errors, chart markers and batch averages synchronized through target, symmetric error and reset',async()=>{
  await mount(RegressionExplorer,async container=>{
    for(const [label,error,absolute,squared,mae,mse] of [
      ['预测 1','−2','2','4','(2 + 0 + 2) ÷ 3 ≈ 1.333','(4 + 0 + 4) ÷ 3 ≈ 2.667'],
      ['刚好预测 3','0','0','0','(0 + 0 + 2) ÷ 3 ≈ 0.667','(0 + 0 + 4) ÷ 3 ≈ 1.333'],
      ['预测 5','2','2','4','(2 + 0 + 2) ÷ 3 ≈ 1.333','(4 + 0 + 4) ÷ 3 ≈ 2.667'],
      ['预测 1','−2','2','4','(2 + 0 + 2) ÷ 3 ≈ 1.333','(4 + 0 + 4) ÷ 3 ≈ 2.667']]){
      await act(()=>Array.from(container.querySelectorAll('button')).find(b=>b.textContent===label)!.click());
      for(const [attribute,value] of [['error',error],['absolute',absolute],['squared',squared],['mae',mae],['mse',mse]])expect(container.querySelector(`[data-${attribute}]`)?.textContent).toBe(value);
      expect(container.querySelector('[data-square-point]')?.getAttribute('cy')).toBe(String(278-Number(squared)*25));
    }
  });
});

it('equal squared losses retain opposite prediction gradients, matching finite differences and the rendered explanation',async()=>{
  for(const prediction of [0,1,2.75,3,3.25,5,6]){
    const epsilon=1e-5;
    const state=regressionExample(prediction);
    const left=regressionExample(prediction-epsilon),right=regressionExample(prediction+epsilon);
    expect(state.squaredGradients[0]).toBeCloseTo((right.squared[0]-left.squared[0])/(2*epsilon),7);
    expect(state.squaredGradients[0]/3).toBeCloseTo((right.mse-left.mse)/(2*epsilon),7);
    if(prediction!==3)expect(regressionExample(prediction-.05*state.squaredGradients[0]).squared[0]).toBeLessThan(state.squared[0]);
  }
  await mount(RegressionExplorer,async container=>{
    for(const [prediction,gradient,direction] of [[1,'−4','预测应增大'],[5,'4','预测应减小']] as const){
      const card=container.querySelector(`[data-direction-case="${prediction}"]`)!;
      expect(card.textContent).toContain('单个样本的平方误差 = 4');
      expect(card.querySelector('[data-case-gradient]')?.textContent).toBe(gradient);
      expect(card.textContent).toContain(direction);
    }
  });
});

it('keeps probabilities normalized and cross-entropy synchronized at low, default, high and restored probabilities',async()=>{
  await mount(ClassificationExplorer,async container=>{
    for(const [label,loss] of [['10%','2.303'],['60%','0.511'],['90%','0.105'],['60%','0.511']]){
      await act(()=>Array.from(container.querySelectorAll('button')).find(b=>b.textContent===label)!.click());
      expect(container.querySelector('[data-ce-loss]')?.textContent).toBe(loss);
      const total=Array.from(container.querySelectorAll('[data-probability]')).reduce((sum,e)=>sum+parseFloat(e.textContent!),0);
      expect(total).toBeCloseTo(100,8);
    }
  });
  expect(classificationExample(.01).loss).toBeCloseTo(4.605170186,8);
  expect(classificationExample(.99).loss).toBeCloseTo(.010050336,8);
  expect(regressionExample(0).mse).toBeCloseTo(13/3,10);
  expect(regressionExample(6).mse).toBeCloseTo(13/3,10);
});
