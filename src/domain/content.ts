import { z } from "zod";
import rawLibrary from "../../content-libraries/library.json";

export const localeSchema = z.enum(["en", "zh"]);
export type Locale = z.infer<typeof localeSchema>;

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1)
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

const sectionSchema = z.object({
  title: localizedTextSchema,
  body: z.array(localizedTextSchema).min(1)
});

export const termSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.string().min(1),
  title: localizedTextSchema,
  summary: localizedTextSchema,
  coreIdea: localizedTextSchema,
  sections: z.array(sectionSchema).min(1)
});
export type Term = z.infer<typeof termSchema>;

const choiceSchema = z.object({
  key: z.string().regex(/^[A-Z]$/),
  label: localizedTextSchema
});
export type Choice = z.infer<typeof choiceSchema>;

export const questionSchema = z.object({
  id: z.string().regex(/^q\d{3}-[a-z0-9-]+$/),
  order: z.number().int().positive(),
  type: z.enum(["single", "multiple"]),
  topic: z.string().min(1),
  level: z.enum(["Foundation", "Working Knowledge", "Deep Dive"]),
  stage: z.string().min(1),
  prompt: localizedTextSchema,
  choices: z.array(choiceSchema).min(2),
  answer: z.array(z.string().regex(/^[A-Z]$/)).min(1),
  explanation: localizedTextSchema,
  relatedTerms: z.array(z.string())
});
export type Question = z.infer<typeof questionSchema>;

export const librarySchema = z.object({
  version: z.string().min(1),
  title: localizedTextSchema,
  description: localizedTextSchema,
  terms: z.array(termSchema).min(1),
  questions: z.array(questionSchema).min(1)
});
export type Library = z.infer<typeof librarySchema>;

const termLinkPattern = /\[\[term:([a-z0-9-]+)\|([^\]]+)\]\]/g;

export function termLinks(text: string): Array<{ id: string; label: string }> {
  return Array.from(text.matchAll(termLinkPattern), (match) => ({
    id: match[1],
    label: match[2]
  }));
}

export function stripRichText(text: string): string {
  return text.replace(termLinkPattern, "$2");
}

export function validateLibraryData(data: unknown): Library {
  const parsed = librarySchema.parse(data);
  const termIds = new Set<string>();
  const questionIds = new Set<string>();
  const questionOrders = new Set<number>();
  const errors: string[] = [];

  for (const term of parsed.terms) {
    if (termIds.has(term.id)) {
      errors.push(`Duplicate term id: ${term.id}`);
    }
    termIds.add(term.id);

    for (const text of [
      term.title.en,
      term.title.zh,
      term.summary.en,
      term.summary.zh,
      term.coreIdea.en,
      term.coreIdea.zh,
      ...term.sections.flatMap((section) => [
        section.title.en,
        section.title.zh,
        ...section.body.flatMap((body) => [body.en, body.zh])
      ])
    ]) {
      for (const link of termLinks(text)) {
        if (!termIds.has(link.id) && !parsed.terms.some((candidate) => candidate.id === link.id)) {
          errors.push(`Broken term link in ${term.id}: ${link.id}`);
        }
      }
    }
  }

  for (const question of parsed.questions) {
    if (questionIds.has(question.id)) {
      errors.push(`Duplicate question id: ${question.id}`);
    }
    if (questionOrders.has(question.order)) {
      errors.push(`Duplicate question order: ${question.order}`);
    }
    questionIds.add(question.id);
    questionOrders.add(question.order);

    const choiceKeys = new Set(question.choices.map((choice) => choice.key));
    for (const answer of question.answer) {
      if (!choiceKeys.has(answer)) {
        errors.push(`Answer ${answer} is not a choice in ${question.id}`);
      }
    }
    for (const termId of question.relatedTerms) {
      if (!parsed.terms.some((term) => term.id === termId)) {
        errors.push(`Unknown related term in ${question.id}: ${termId}`);
      }
    }
    for (const text of [
      question.prompt.en,
      question.prompt.zh,
      question.explanation.en,
      question.explanation.zh,
      ...question.choices.flatMap((choice) => [choice.label.en, choice.label.zh])
    ]) {
      for (const link of termLinks(text)) {
        if (!parsed.terms.some((term) => term.id === link.id)) {
          errors.push(`Broken term link in ${question.id}: ${link.id}`);
        }
      }
    }
  }

  const expectedOrders = Array.from({ length: parsed.questions.length }, (_, index) => index + 1);
  if (JSON.stringify([...questionOrders].sort((a, b) => a - b)) !== JSON.stringify(expectedOrders)) {
    errors.push("Question orders must be contiguous starting at 1");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
  return parsed;
}

export const library = validateLibraryData(rawLibrary);
export const termsById = new Map(library.terms.map((term) => [term.id, term]));
export const questionsById = new Map(library.questions.map((question) => [question.id, question]));
export const orderedQuestions = [...library.questions].sort((a, b) => a.order - b.order);

export function localized(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en;
}

export function topicCounts(): Record<string, number> {
  return library.questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.topic] = (counts[question.topic] ?? 0) + 1;
    return counts;
  }, {});
}
