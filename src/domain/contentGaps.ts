import type { Locale, QuestionPackage, TermPackage } from "./content";
import { textForLocale } from "./content";
import { dependencyReason, termDisplayName } from "./termNames";

export interface PendingTermReference {
  kind: "question" | "term";
  id: string;
  label: string;
  reason: string;
}

export interface PendingTermSummary {
  id: string;
  title: string;
  references: PendingTermReference[];
  questionCount: number;
  termCount: number;
}

/** Build the visible backlog from authored dependencies without inventing empty term pages. */
export function collectPendingTerms(questions: QuestionPackage[], terms: TermPackage[], locale: Locale = "zh-CN"): PendingTermSummary[] {
  const installed = new Set(terms.map((term) => term.id));
  const pending = new Map<string, { title: string; references: PendingTermReference[] }>();

  const add = (dependency: { id: string; title: string; reason: string }, reference: PendingTermReference) => {
    if (installed.has(dependency.id)) return;
    const current = pending.get(dependency.id) ?? { title: termDisplayName(dependency.id, dependency.title, locale), references: [] };
    if (!current.references.some((item) => item.kind === reference.kind && item.id === reference.id)) {
      current.references.push({ ...reference, reason: dependencyReason(reference.reason, locale) });
    }
    pending.set(dependency.id, current);
  };

  for (const question of questions) {
    for (const dependency of question.termDependencies) {
      add(dependency, {
        kind: "question",
        id: question.id,
        label: locale === "en-US"
          ? `Question ${question.ordering.order} · ${textForLocale(question.taxonomy.primaryConcept, locale)}`
          : `第 ${question.ordering.order} 题 · ${textForLocale(question.taxonomy.primaryConcept, locale)}`,
        reason: dependency.reason
      });
    }
  }

  for (const term of terms) {
    for (const dependency of term.termDependencies) {
      add(dependency, { kind: "term", id: term.id, label: textForLocale(term.title, locale), reason: dependency.reason });
    }
    for (const prerequisiteId of term.prerequisites) {
      if (installed.has(prerequisiteId)) continue;
      const declared = term.termDependencies.find((dependency) => dependency.id === prerequisiteId);
      add(declared ?? {
        id: prerequisiteId,
        title: prerequisiteId,
        reason: `“${textForLocale(term.title, locale)}”把该概念声明为阅读前置，需要补充完整教学包。`
      }, { kind: "term", id: term.id, label: textForLocale(term.title, locale), reason: declared?.reason ?? `“${textForLocale(term.title, locale)}”的阅读前置。` });
    }
  }

  return [...pending.entries()].map(([id, value]) => ({
    id,
    title: value.title,
    references: value.references,
    questionCount: value.references.filter((reference) => reference.kind === "question").length,
    termCount: value.references.filter((reference) => reference.kind === "term").length
  })).sort((a, b) => a.title.localeCompare(b.title, locale === "en-US" ? "en" : "zh-CN"));
}
