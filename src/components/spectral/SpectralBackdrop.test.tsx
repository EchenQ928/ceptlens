// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SpectralBackdrop } from "./SpectralBackdrop";

const state = vi.hoisted(() => ({ reduced: false, inView: true, create: vi.fn() }));
vi.mock("motion/react", () => ({ useInView: () => state.inView, useReducedMotion: () => state.reduced }));
vi.mock("./createSpectralRenderer", () => ({ createSpectralRenderer: (...args: unknown[]) => state.create(...args) }));
let root: Root, host: HTMLDivElement, now = 0, sequence = 0;
const callbacks = new Map<number, FrameRequestCallback>();
let instance: { canvasElement: HTMLCanvasElement; dispose: ReturnType<typeof vi.fn>; setSpeed: ReturnType<typeof vi.fn>; setFrame: ReturnType<typeof vi.fn>; getCurrentFrame: () => number; setUniforms: ReturnType<typeof vi.fn>; setMaxPixelCount: ReturnType<typeof vi.fn> };

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  state.reduced = false; state.inView = true; state.create.mockReset(); now = 0; callbacks.clear();
  Object.defineProperty(document,"hidden",{ configurable:true,value:false });
  vi.stubGlobal("matchMedia", () => ({ matches:false }));
  vi.stubGlobal("requestAnimationFrame",(callback: FrameRequestCallback) => { callbacks.set(++sequence,callback); return sequence; });
  vi.stubGlobal("cancelAnimationFrame",(id: number) => callbacks.delete(id));
  vi.spyOn(performance,"now").mockImplementation(() => now);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  let frame = 0;
  const canvas = document.createElement("canvas");
  instance = { canvasElement:canvas, dispose:vi.fn(() => canvas.remove()), setSpeed:vi.fn(), setFrame:vi.fn((value:number) => { frame = value; }), getCurrentFrame:() => frame, setUniforms:vi.fn(), setMaxPixelCount:vi.fn() };
  state.create.mockImplementation((element:HTMLElement) => { element.append(canvas); return instance; });
});
afterEach(async () => { await act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function render(paused = false) { await act(async () => { root.render(<SpectralBackdrop paused={paused}/>); }); await act(() => vi.dynamicImportSettled()); }
async function tick() { await act(() => { now += 40; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(now)); }); }

it("keeps the poster and never initializes WebGL when reduced motion is requested", async () => {
  state.reduced = true; await render(); await tick();
  expect(state.create).not.toHaveBeenCalled();
  expect(host.querySelector(".spectral-poster")).not.toBeNull();
  expect(host.querySelector(".spectral-backdrop")?.getAttribute("data-running")).toBe("false");
});
it("freezes and resumes the same renderer without losing the current frame", async () => {
  await render(); await tick();
  const frame = instance.getCurrentFrame(); expect(frame).toBeGreaterThan(0);
  await render(true); await tick();
  expect(instance.getCurrentFrame()).toBe(frame);
  expect(callbacks.size).toBe(0);
  await render(false); await tick();
  expect(instance.getCurrentFrame()).toBeGreaterThan(frame);
  expect(state.create).toHaveBeenCalledTimes(1);
});
it("suspends work when hidden or offscreen, retaining its WebGL context", async () => {
  await render(); await tick();
  await act(() => { Object.defineProperty(document,"hidden",{configurable:true,value:true}); document.dispatchEvent(new Event("visibilitychange")); });
  const frame = instance.getCurrentFrame(); await tick(); expect(instance.getCurrentFrame()).toBe(frame); expect(callbacks.size).toBe(0);
  await act(() => { Object.defineProperty(document,"hidden",{configurable:true,value:false}); document.dispatchEvent(new Event("visibilitychange")); });
  await tick(); expect(instance.getCurrentFrame()).toBeGreaterThan(frame);
  state.inView = false; await render(); await tick(); expect(callbacks.size).toBe(0);
  state.inView = true; await render(); await tick(); expect(state.create).toHaveBeenCalledTimes(1);
});
it("falls back to the poster and disposes resources after context loss", async () => {
  await render(); await tick();
  await act(() => instance.canvasElement.dispatchEvent(new Event("webglcontextlost")));
  expect(host.querySelector(".spectral-backdrop")?.getAttribute("data-renderer")).toBe("fallback");
  expect(host.querySelectorAll("canvas")).toHaveLength(0);
  expect(instance.dispose).toHaveBeenCalledOnce();
  expect(callbacks.size).toBe(0);
});
it("contains an initialization failure without affecting page content", async () => {
  state.create.mockImplementation(() => { throw new Error("WebGL unavailable"); });
  await render(); await tick();
  expect(host.querySelector(".spectral-backdrop")?.getAttribute("data-renderer")).toBe("fallback");
  expect(state.create).toHaveBeenCalledTimes(1);
  expect(callbacks.size).toBe(0);
});
