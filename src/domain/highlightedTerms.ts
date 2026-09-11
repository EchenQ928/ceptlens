import type { QuestionPackage } from "./content";

/** Author-owned selections travel with question uploads, never a hardcoded roadmap. */
export function highlightedTermIds(questions: QuestionPackage[]): string[] {
  return [...new Set(questions.flatMap(q => (q.highlightedTerms ?? []).filter(id => q.termDependencies.some(term => term.id === id))))];
}
