import { useId, type ReactNode, type CSSProperties } from "react";
export type ProductIconKind = "learn" | "assess" | "concepts" | "content" | "cache" | "layers" | "matrix" | "wave" | "target" | "branch" | "discussion" | "assistant" | "reveal";
// Original glyphs share a 32px optical grid and a common direction of light.
const forms: Record<ProductIconKind, ReactNode> = {
  learn: <><path className="icon-plane" d="M4 6.5c4-1.2 8-.6 12 2.2 4-2.8 8-3.4 12-2.2v20c-4-1.4-8-.8-12 1.8-4-2.6-8-3.2-12-1.8Z"/><path d="M16 8.7v19.6M8 12c1.7-.1 3.2.3 4.6 1.1M8 17c1.7-.1 3.2.3 4.6 1.1M20 13.1c1.4-.8 2.9-1.2 4.6-1.1M20 18.1c1.4-.8 2.9-1.2 4.6-1.1"/><path className="icon-highlight" d="M4 6.5c4-1.2 8-.6 12 2.2"/></>,
  assess: <><rect className="icon-plane" x="6" y="5.5" width="21" height="24" rx="4"/><rect className="icon-solid" x="11" y="3" width="11" height="6" rx="2"/><path d="m11 18 3.4 3.5 7.2-8M11 25h9"/><path className="icon-highlight" d="M7 12v-2a3 3 0 0 1 3-3"/></>,
  concepts: <><path className="icon-connection" d="m16 7-9 17m9-17 9 17M7 24h18"/><circle className="icon-plane" cx="16" cy="7" r="4.3"/><circle className="icon-plane" cx="6.5" cy="24" r="4.3"/><circle className="icon-plane" cx="25.5" cy="24" r="4.3"/><circle className="icon-solid" cx="16" cy="7" r="1.2"/><circle className="icon-solid" cx="6.5" cy="24" r="1.2"/><circle className="icon-solid" cx="25.5" cy="24" r="1.2"/></>,
  content: <><rect className="icon-plane" x="3" y="5" width="26" height="23" rx="5"/><path d="m12 12-4 4 4 4m8-8 4 4-4 4m-3-10-2 13"/><path className="icon-highlight" d="M7 6h14"/></>,
  cache: <><path className="icon-plane" d="M5 8h22v17c0 5-22 5-22 0Z"/><ellipse className="icon-plane" cx="16" cy="8" rx="11" ry="5"/><path d="M5 16c0 5 22 5 22 0M10 21v2"/><path className="icon-highlight" d="M7 6c3-3 13-3 17 0"/></>,
  layers: <><path className="icon-plane" d="m3 20 13 8 13-8-13-8Z"/><path className="icon-plane" d="m3 13 13 8 13-8-13-8Z"/><path className="icon-plane" d="m3 8 13 8L29 8 16 1Z"/><path className="icon-highlight" d="m3 8 13 8 13-8"/></>,
  matrix: <><rect className="icon-plane" x="4" y="4" width="24" height="24" rx="4"/><path d="M12 4v24m8-24v24M4 12h24M4 20h24"/><path className="icon-solid" d="M12 12h8v8h-8Z"/></>,
  wave: <><rect className="icon-plane" x="3" y="5" width="26" height="23" rx="5"/><path d="M6 18h5l3-9 4 15 3-8h5"/></>,
  target: <><circle className="icon-plane" cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5"/><path d="M16 2v6m14 8h-6M16 30v-6M2 16h6"/><circle className="icon-solid" cx="16" cy="16" r="1.2"/></>,
  branch: <><path className="icon-connection" d="M8 8v16m0-9h10c5 0 6-4 6-8"/><circle className="icon-plane" cx="8" cy="6" r="3.5"/><circle className="icon-plane" cx="8" cy="26" r="3.5"/><circle className="icon-plane" cx="24" cy="5" r="3.5"/></>,
  discussion: <><path className="icon-plane" d="M9 4h15a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H13l-7 5v-6a5 5 0 0 1-3-4V9a5 5 0 0 1 6-5Z"/><path d="M9 11h14M9 17h9"/><path className="icon-highlight" d="M9 5h13"/></>,
  assistant: <><path className="icon-plane" d="M16 3c2.3 8 5 10.7 13 13-8 2.3-10.7 5-13 13C13.7 21 11 18.3 3 16 11 13.7 13.7 11 16 3Z"/><path d="m16 10 2 6-2 6-2-6Z"/><path className="icon-highlight" d="M16 3c-2.3 8-5 10.7-13 13"/></>,
  reveal: <><path className="icon-plane" d="M2 16s5-10 14-10 14 10 14 10-5 10-14 10S2 16 2 16Z"/><circle cx="16" cy="16" r="5"/><circle className="icon-solid" cx="16" cy="16" r="1.5"/><path className="icon-highlight" d="M7 11c3-3 6-4 9-4"/></>
};
export function ProductIcon({ kind, className = "", size = 24 }: { kind: ProductIconKind; className?: string; size?: number }) {
  const id = useId().replaceAll(":", "");
  return <svg className={"product-icon " + className} width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={"url(#" + id + "edge)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-kind={kind}>
    <defs><linearGradient id={id+"edge"} x1="3" y1="2" x2="29" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#eef6ff"/><stop offset=".38" stopColor="currentColor"/><stop offset="1" stopColor="currentColor" stopOpacity=".55"/></linearGradient><linearGradient id={id+"plane"} x1="5" y1="4" x2="27" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" stopOpacity=".36"/><stop offset="1" stopColor="currentColor" stopOpacity=".035"/></linearGradient></defs>
    <g className="icon-form" style={{ "--icon-plane": "url(#" + id + "plane)" } as CSSProperties}>{forms[kind]}</g>
  </svg>;
}
