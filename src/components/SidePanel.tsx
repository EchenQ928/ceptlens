import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import { uiText, useLocale } from "../i18n";
export function SidePanel({ title, subtitle, close, children }: { title: string; subtitle?: string; close: () => void; children: ReactNode }) {
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const ref = useRef<HTMLElement>(null); const closeRef = useRef(close); closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); }
      if (e.key === "Tab" && window.innerWidth <= 720) {
        const items = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,a[href],[tabindex="0"]') ?? [])];
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); if (previous?.isConnected) previous.focus(); };
  }, []);
  // Non-modal on purpose: readers can still scroll and inspect the source alongside it.
  return <motion.aside ref={ref} inert={!present} className="learning-drawer" role="dialog" aria-label={title} tabIndex={-1} initial={{ opacity: 0, x: reduced ? 0 : 45 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : 45 }} transition={{ duration: reduced ? 0 : .3, ease: [.22, 1, .36, 1] }}>
    <header className="drawer-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-text-button" onClick={close} aria-label={uiText(locale, `关闭${title}`, `Close ${title}`)}><X size={20} /></button></header>
    {children}
  </motion.aside>;
}
