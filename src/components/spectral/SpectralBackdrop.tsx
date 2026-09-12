import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { ShaderMount } from "@paper-design/shaders";
import { canAnimate, nextQuality, spectralPresets, type SpectralPreset } from "./motionPolicy";
import { createLiquidScene, liquidShaderUniforms } from "./liquidScene";

export function SpectralBackdrop({ preset = "home", paused = false, intensity = 1 }: { preset?: SpectralPreset; paused?: boolean; intensity?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const renderer = useRef<ShaderMount | null>(null);
  const reduced = !!useReducedMotion();
  const inView = useInView(root);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activated, setActivated] = useState(false);
  const mobile = useRef(window.matchMedia("(max-width: 700px)").matches);
  const initialPreset = useRef(preset);
  const live = canAnimate({ paused, reduced, visible, inView, failed });
  const liveRef = useRef(live);
  liveRef.current = live;
  const initial = spectralPresets[initialPreset.current];
  const uniforms = useRef({ workspace: initial.workspace, intensity: initial.intensity, tone: initial.tone });
  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const quality = useRef<"full" | "low" | "poster">("full");
  // Development-only deterministic frames let the exported posters and recordings match the shader exactly.
  const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
  const frame = devParams?.has("spectralFrame") ? Number(devParams.get("spectralFrame")) : null;
  // Changing the uniform ABI must recreate contexts retained by development HMR.
  const rendererKey = `liquid-refraction-v2:${frame ?? 'live'}`;
  const posterOnly = devParams?.get("spectralPoster") === "1";
  const running = live && frame === null;
  useEffect(() => { if (inView) setActivated(true); }, [inView]);
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  useEffect(() => {
    if (reduced || posterOnly || !activated || failed || !mount.current || renderer.current) return;
    let cancelled = false;
    const target = mount.current;
    let instance: ShaderMount | null = null;
    let lost: (() => void) | undefined;
    import("./createSpectralRenderer").then(({ createSpectralRenderer }) => {
      if (cancelled) return;
      try {
        instance = createSpectralRenderer(target, initialPreset.current, mobile.current);
        renderer.current = instance;
        if (frame !== null && Number.isFinite(frame)) instance.setFrame(frame);
        lost = () => { instance?.setSpeed(0); setFailed(true); };
        instance.canvasElement.addEventListener("webglcontextlost", lost);
        setReady(true);
      } catch {
        target.replaceChildren();
        setFailed(true);
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (lost) instance?.canvasElement.removeEventListener("webglcontextlost", lost);
      instance?.dispose();
      renderer.current = null;
      setReady(false);
    };
  }, [reduced, posterOnly, activated, failed, rendererKey]);
  useEffect(() => {
    const instance = renderer.current;
    if (!instance || !ready) return;
    instance.setSpeed(0);
    if (!running) instance.setUniforms({ u_glassCount: 0 });
  }, [ready, running, preset]);
  // Route tint blends without mounting a second canvas. Motion never forces a React render each frame.
  useEffect(() => {
    const instance = renderer.current;
    if (!instance || !ready) return;
    const to = spectralPresets[preset];
    const from = { ...uniforms.current };
    let raf = 0;
    const start = performance.now();
    const update = (now: number) => {
      const progress = reduced || !running ? 1 : Math.min(1, (now - start) / 600);
      const t = progress * progress * (3 - 2 * progress);
      uniforms.current = { workspace: from.workspace + (to.workspace - from.workspace)*t, intensity: from.intensity + (to.intensity*intensity - from.intensity)*t, tone: from.tone + (to.tone-from.tone)*t };
      instance.setUniforms({ u_workspace: uniforms.current.workspace, u_intensity: uniforms.current.intensity, u_tone: uniforms.current.tone });
      if (progress < 1) raf = requestAnimationFrame(update);
    };
    update(start);
    return () => cancelAnimationFrame(raf);
  }, [preset, intensity, reduced, ready, running]);
  useEffect(() => {
    if (!running || !ready || !renderer.current) return;
    const scene = root.current ? createLiquidScene(root.current) : null;
    let raf = 0, start = performance.now(), last = start, lastDraw = start, frames = 0;
    const interval = 1000 / (mobile.current ? 30 : 60);
    const monitor = (now: number) => {
      if (!renderer.current || !liveRef.current) return;
      if (now-lastDraw < interval) { raf = requestAnimationFrame(monitor); return; }
      const elapsed = now-last;
      lastDraw = now - ((now-lastDraw) % interval);
      last = now; frames += 1;
      if (scene) {
        const material = scene.read(now, elapsed);
        renderer.current.setUniforms(liquidShaderUniforms(material));
        if (import.meta.env.DEV && root.current && now-start > 3000) {
          root.current.dataset.glassCount = String(material.u_glassCount);
          root.current.dataset.scroll = material.u_scroll[0].toFixed(3);
        }
      }
      if (now-start > 3000) {
        const fps = frames * 1000 / (now-start);
        const next = nextQuality(mobile.current ? fps*2 : fps,quality.current);
        if (next !== quality.current) {
          quality.current = next;
          if (next === "poster") { setFailed(true); return; }
          renderer.current.setMaxPixelCount(mobile.current ? 240000 : 850000);
        }
        if (root.current) { root.current.dataset.fps = String(Math.round(fps)); root.current.dataset.quality = next; }
        start = now; frames = 0;
      }
      const p = pointer.current;
      const dx = p.targetX-p.x, dy = p.targetY-p.y;
      if (Math.abs(dx)+Math.abs(dy) > .00005) {
        p.x += dx*.045; p.y += dy*.045;
        renderer.current.setUniforms({ u_pointer: [p.x,p.y] });
      }
      renderer.current.setFrame((renderer.current.getCurrentFrame() + elapsed*spectralPresets[preset].speed) % 16000);
      raf = requestAnimationFrame(monitor);
    };
    raf = requestAnimationFrame(monitor);
    const move = (event: PointerEvent) => {
      if (preset !== "home" || event.pointerType !== "mouse" || !root.current) return;
      const bounds = root.current.getBoundingClientRect();
      pointer.current.targetX = Math.max(-.02,Math.min(.02, (event.clientX/bounds.width-.5)*.04));
      pointer.current.targetY = Math.max(-.02,Math.min(.02, ((event.clientY-bounds.top)/bounds.height-.5)*.04));
    };
    const leave = () => { pointer.current.targetX = 0; pointer.current.targetY = 0; };
    window.addEventListener("pointermove",move,{ passive:true });
    document.documentElement.addEventListener("pointerleave",leave);
    return () => { cancelAnimationFrame(raf); scene?.dispose(); window.removeEventListener("pointermove",move); document.documentElement.removeEventListener("pointerleave",leave); };
  }, [running, ready, preset]);
  const workspace = preset !== "home" && preset !== "auth";
  const poster = workspace ? "workspace" : preset;
  return <div ref={root} className={"spectral-backdrop spectral-" + preset} aria-hidden="true" data-running={running && ready} data-renderer={failed ? "fallback" : ready ? "webgl" : "poster"} style={{ "--spectral-poster": "url('" + import.meta.env.BASE_URL + "spectral/" + poster + ".webp')" } as CSSProperties}>
    <div className="spectral-poster"/>
    <div ref={mount} className={"spectral-canvas" + (ready && !failed ? " is-ready" : "")}/>
  </div>;
}
