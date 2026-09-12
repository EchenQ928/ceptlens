// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { DeveloperPage } from './DeveloperPage';
import { contentHostClient } from '../infrastructure/contentHostClient';
vi.mock('../components/LearningSession',()=>({useLearningSession:()=>({session:{authenticated:true,user:{role:'developer'}}})}));
vi.mock('../hooks/useContent',()=>({useContent:()=>({questions:[],terms:[]})}));
vi.mock('../infrastructure/contentHostClient',()=>({contentHostClient:{status:vi.fn().mockResolvedValue({publishing:false}),history:vi.fn().mockResolvedValue([]),importQuestionFiles:vi.fn().mockRejectedValue(new Error('Test rejection')),importTermPackages:vi.fn().mockRejectedValue(new Error('Test rejection'))}}));
it('allows multiple selection for both kinds and sends every file, including when retrying a selection',async()=>{
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
  try{
    await act(()=>root.render(<MemoryRouter><DeveloperPage/></MemoryRouter>));
    async function choose(extension:string){
      const input=container.querySelector('input[type=file]') as HTMLInputElement;expect(input.multiple).toBe(true);
      const files=[new File(['a'],`a.${extension}`),new File(['b'],`b.${extension}`)];
      Object.defineProperty(input,'files',{value:files,configurable:true});
      await act(()=>input.dispatchEvent(new Event('change',{bubbles:true})));expect(input.value).toBe('');return files;
    }
    const questions=await choose('json');expect(contentHostClient.importQuestionFiles).toHaveBeenLastCalledWith(questions,'');
    await choose('json');expect(contentHostClient.importQuestionFiles).toHaveBeenCalledTimes(2);
    const termTab=container.querySelectorAll('.kind-tabs button')[0] as HTMLButtonElement;
    // Locate the term tab by text rather than relying on tab order.
    const terms=[...container.querySelectorAll('.kind-tabs button')].find(b=>/词条|Terms/.test(b.textContent??'')) as HTMLButtonElement;
    expect(termTab).toBeTruthy();await act(()=>terms.click());
    const files=await choose('zip');expect(contentHostClient.importTermPackages).toHaveBeenLastCalledWith(files,'');
  }finally{await act(()=>root.unmount());container.remove();}
});
