import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "motion/react";
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

