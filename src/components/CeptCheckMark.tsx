/** Two views of an idea, with a check at their intersection. */
export function CeptCheckMark({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 16c3-7 7-10 13-10s10 3 13 10c-3 7-7 10-13 10S6 23 3 16Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.7"/><path d="m13.5 16 1.8 1.8 3.6-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M25 3v5M22.5 5.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
