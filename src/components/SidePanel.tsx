import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function SidePanel({ title, subtitle, close, children }: { title: string; subtitle?: string; close: () => void; children: ReactNode }) {
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
  return <aside ref={ref} className="learning-drawer" role="dialog" aria-label={title} tabIndex={-1}>
    <header className="drawer-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-text-button" onClick={close} aria-label={`关闭${title}`}><X size={20} /></button></header>
    {children}
  </aside>;
}
