// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createLiquidScene, LIQUID_LIMIT } from './liquidScene';

let shell: HTMLDivElement, backdrop: HTMLDivElement;
const rectangle = (x: number, y: number, w: number, h: number) => ({ x,y,width:w,height:h,top:y,left:x,right:x+w,bottom:y+h,toJSON() {} });
beforeEach(() => {
  shell = document.createElement('div'); shell.className = 'app-frame';
  backdrop = document.createElement('div'); shell.append(backdrop); document.body.append(shell);
  vi.spyOn(backdrop,'getBoundingClientRect').mockReturnValue(rectangle(0,0,1440,900));
  vi.stubGlobal('innerHeight',900); vi.stubGlobal('scrollY',0);
});
afterEach(() => { shell.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function pane(y: number, className = 'term-card') {
  const node = document.createElement('article'); node.className=className; node.style.borderRadius='20px';
  const bounds = vi.spyOn(node,'getBoundingClientRect').mockReturnValue(rectangle(100,y,300,180)); shell.append(node); return {node,bounds};
}
it('keeps optical geometry aligned to moving windows, excluding offscreen and hidden panes', () => {
  const visible = pane(120); pane(1000); const hidden=pane(0); hidden.bounds.mockReturnValue(rectangle(0,0,0,0));
  const scene=createLiquidScene(backdrop);
  expect(scene.read(0,16).u_glassCount).toBe(1);
  expect(scene.read(0,16).u_glass[0]).toEqual([250,210,150,90]);
  visible.bounds.mockReturnValue(rectangle(100,-50,300,180)); document.dispatchEvent(new Event('scroll'));
  expect(scene.read(20,20).u_glass[0]).toEqual([250,40,150,90]);
  scene.dispose();
});
it('caps visible surfaces without capturing text or allocating one renderer per card', () => {
  for (let i=0;i<30;i++) pane(i*5);
  const scene=createLiquidScene(backdrop); const material=scene.read(0,16);
  expect(material.u_glassCount).toBe(LIQUID_LIMIT); expect(material.u_glass).toHaveLength(LIQUID_LIMIT);
  expect(shell.querySelectorAll('[data-liquid-surface]')).toHaveLength(LIQUID_LIMIT);
  expect(shell.querySelectorAll('canvas')).toHaveLength(0); scene.dispose();
  expect(shell.querySelectorAll('[data-liquid-surface]')).toHaveLength(0);
});
it('damps scroll response and disconnects event observation on disposal', () => {
  pane(100); const remove=vi.spyOn(document,'removeEventListener'); const scene=createLiquidScene(backdrop);
  vi.stubGlobal('scrollY',900); document.dispatchEvent(new Event('scroll'));
  const start=scene.read(16,16).u_scroll[0], later=scene.read(32,16).u_scroll[0];
  expect(start).toBeGreaterThan(0); expect(later).toBeGreaterThan(start); expect(later).toBeLessThan(1);
  scene.dispose(); expect(remove).toHaveBeenCalledWith('scroll',expect.any(Function),true);
});
