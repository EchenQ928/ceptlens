export interface TermTrailNode {
  kind: "question" | "term";
  id: string;
  label: string;
  href: string;
}

export interface TermNavigationState {
  termTrail?: TermTrailNode[];
}

export function appendTrailNode(trail: TermTrailNode[], node: TermTrailNode): TermTrailNode[] {
  const last = trail.at(-1);
  if (last?.kind === node.kind && last.id === node.id) return trail;
  return [...trail, node];
}

export function buildTermTrail(trail: TermTrailNode[], source: TermTrailNode | undefined, target: TermTrailNode): TermTrailNode[] {
  const withSource = source ? appendTrailNode(trail, source) : trail;
  return appendTrailNode(withSource, target);
}
