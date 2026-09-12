import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

/** Adapted from Magic UI's MIT Interactive Hover Button; see THIRD_PARTY_NOTICES.md. */
export function FlowLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} className={`flow-link ${className}`}><span className="flow-fill" aria-hidden="true"/><span className="flow-label">{children}</span><span className="flow-arrival" aria-hidden="true">{children}</span><span className="flow-arrow" aria-hidden="true"><ArrowUpRight size={19}/></span></Link>;
}

/** One-shot typing: no layout shift, no repeated screen-reader announcements. */
export function TypeLine({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const letters = Array.from(text);
  useEffect(() => {
    setCount(0);
    if (!visible || reduced) return;
    let index = 0;
    const timer = window.setInterval(() => { if (document.hidden) return; index += 1; setCount(index); if (index >= Array.from(text).length) clearInterval(timer); }, 55);
    return () => clearInterval(timer);
  }, [text, visible, reduced]);
  const complete = reduced || count >= letters.length;
  return <span ref={ref} className="type-line"><span className="sr-only">{text}</span><span className="type-measure" aria-hidden="true">{text}</span><span className="type-ink" aria-hidden="true">{complete ? text : letters.slice(0, count).join("")}{!complete && <i/>}</span></span>;
}

/** Layered light fields; no bitmap, WebGL dependency, or continuous JS render loop. */
export function AuraScene({ compact = false, paused = false }: { compact?: boolean; paused?: boolean }) {
  const reduced = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  useEffect(() => { const update = () => setPageVisible(!document.hidden); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, []);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const x = useMotionValue(0), y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 65, damping: 24 }), springY = useSpring(y, { stiffness: 65, damping: 24 });
  function follow(event: PointerEvent<HTMLDivElement>) {
    if (reduced || paused || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * .025);
    y.set((event.clientY - rect.top - rect.height / 2) * .025);
  }
  return <div ref={ref} className={`aura-scene ${compact ? "compact" : ""} ${!paused && pageVisible && visible && !reduced ? "scene-live" : ""}`} onPointerMove={follow} onPointerLeave={() => { x.set(0); y.set(0); }} aria-hidden="true">
    <div className="aura-atmosphere"/>
    <motion.div className="aura-optics" style={{ x: springX, y: springY }}><div className="aura-haze"/><div className="aura-ray"/><div className="aura-orbit orbit-outer"/><div className="aura-orbit orbit-inner"/><div className="aura-core"/><div className="aura-glint"/></motion.div>
  </div>;
}
