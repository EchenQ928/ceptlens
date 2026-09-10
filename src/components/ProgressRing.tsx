import type { CSSProperties } from "react";

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${safeValue}%` } as CSSProperties}
      aria-label={`${label}: ${Math.round(safeValue)}%`}
    >
      <div className="progress-ring-inner">
        <strong>{Math.round(safeValue)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
