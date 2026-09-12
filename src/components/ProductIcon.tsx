import { BookOpen, ClipboardCheck, Network, Braces, Database, Layers, Grid2X2, Activity, Crosshair, GitBranch, MessagesSquare, Sparkles, Eye } from "lucide-react";
export type ProductIconKind = "learn" | "assess" | "concepts" | "content" | "cache" | "layers" | "matrix" | "wave" | "target" | "branch" | "discussion" | "assistant" | "reveal";
const icons = { learn: BookOpen, assess: ClipboardCheck, concepts: Network, content: Braces, cache: Database, layers: Layers, matrix: Grid2X2, wave: Activity, target: Crosshair, branch: GitBranch, discussion: MessagesSquare, assistant: Sparkles, reveal: Eye };
export function ProductIcon({ kind, className = "" }: { kind: ProductIconKind; className?: string }) {
  const Icon = icons[kind];
  return <Icon className={`product-icon ${className}`} size={24} strokeWidth={1.6} aria-hidden="true" focusable="false" data-kind={kind}/>;
}
