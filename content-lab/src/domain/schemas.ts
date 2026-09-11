import { z } from "zod";
import { textForLocale, type QuestionPackage, type RichText, type TermDependency, type TermPackage } from "./content";

const nonEmpty = z.string().trim().min(1);
const localizedText = z.object({ "zh-CN": nonEmpty, "en-US": nonEmpty }).strict();
const richText = z.union([nonEmpty, localizedText]);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, "ID 只能包含字母、数字、点、下划线和连字符");

const taxonomySchema = z.object({
  primaryConcept: richText,
  modelFamily: richText,
  learningLevel: z.string().regex(/^L[0-3]\s/),
  engineeringStage: z.string().regex(/^E(?:[0-9]|1[0-2])\s/),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  secondaryModelFamilies: z.array(richText).optional().default([]),
  secondaryEngineeringStages: z.array(richText).max(2).optional().default([]),
  knowledgeTopics: z.array(richText).optional().default([]),
  taskScenarios: z.array(richText).optional().default([]),
  optimizationObjectives: z.array(richText).optional().default([]),
  runtimeEnvironments: z.array(richText).optional().default([])
}).strict();

const orderingSchema = z.object({
  order: z.number().int().positive(),
  prerequisites: z.array(id).optional().default([])
}).strict();

const optionSchema = z.object({ key: nonEmpty, text: richText }).strict();
const rubricSchema = z.object({ criterion: richText, points: z.number().positive() }).strict();
const subjectiveAnswerSchema = z.object({
  referenceAnswer: richText,
  rubric: z.array(rubricSchema).min(1),
  gradingInstruction: richText.optional()
}).strict();
const ceptCheckSchema = z.object({ stem: richText, featured: z.boolean().optional() }).strict();

const questionBase = z.object({
  schemaVersion: z.literal("3.0"),
  id,
  stem: richText,
  explanation: richText,
  ceptCheck: ceptCheckSchema.optional(),
  featured: z.boolean().optional(),
  highlightedTerms: z.array(id).max(32).refine(ids => new Set(ids).size === ids.length, "Highlighted term IDs must be unique").optional(),
  taxonomy: taxonomySchema,
  ordering: orderingSchema
});

const choiceQuestionSchema = questionBase.extend({
  type: z.enum(["single_choice", "multiple_choice"]),
  options: z.array(optionSchema).min(2),
  correctAnswer: z.array(nonEmpty).min(1)
}).strict().superRefine((question, ctx) => {
  const optionKeys = question.options.map((option) => option.key);
  if (new Set(optionKeys).size !== optionKeys.length) ctx.addIssue({ code: "custom", path: ["options"], message: "选项 key 不得重复" });
  if (new Set(question.correctAnswer).size !== question.correctAnswer.length) ctx.addIssue({ code: "custom", path: ["correctAnswer"], message: "答案 key 不得重复" });
  for (const answerKey of question.correctAnswer) if (!optionKeys.includes(answerKey)) ctx.addIssue({ code: "custom", path: ["correctAnswer"], message: `答案 ${answerKey} 不对应任何选项` });
  if (question.type === "single_choice" && question.correctAnswer.length !== 1) ctx.addIssue({ code: "custom", path: ["correctAnswer"], message: "单选题只能有一个答案" });
  if (new Set(question.ordering.prerequisites).size !== question.ordering.prerequisites.length) ctx.addIssue({ code: "custom", path: ["ordering", "prerequisites"], message: "前置题目 ID 不得重复" });
  if (question.ordering.prerequisites.includes(question.id)) ctx.addIssue({ code: "custom", path: ["ordering", "prerequisites"], message: "题目不能把自身设为前置" });
});

const subjectiveQuestionSchema = questionBase.extend({
  type: z.literal("subjective"),
  subjectiveAnswer: subjectiveAnswerSchema
}).strict().superRefine((question, ctx) => {
  if (new Set(question.ordering.prerequisites).size !== question.ordering.prerequisites.length) ctx.addIssue({ code: "custom", path: ["ordering", "prerequisites"], message: "前置题目 ID 不得重复" });
  if (question.ordering.prerequisites.includes(question.id)) ctx.addIssue({ code: "custom", path: ["ordering", "prerequisites"], message: "题目不能把自身设为前置" });
});

export const questionPackageSchema = z.union([choiceQuestionSchema, subjectiveQuestionSchema]);

export const termPackageSchema = z.object({
  schemaVersion: z.literal("3.0"),
  sdkVersion: z.literal("1.x"),
  id,
  title: richText,
  aliases: z.array(richText).optional().default([]),
  summary: richText,
  coreConclusion: richText,
  prerequisites: z.array(id).optional().default([])
}).strict().superRefine((term, ctx) => {
  if (new Set(term.aliases).size !== term.aliases.length) ctx.addIssue({ code: "custom", path: ["aliases"], message: "别名不得重复" });
  if (new Set(term.prerequisites).size !== term.prerequisites.length) ctx.addIssue({ code: "custom", path: ["prerequisites"], message: "前置词条 ID 不得重复" });
  if (term.prerequisites.includes(term.id)) ctx.addIssue({ code: "custom", path: ["prerequisites"], message: "词条不能把自身设为前置" });
});

export const questionBundleSchema = z.object({
  schemaVersion: z.literal("3.0"),
  kind: z.literal("question-bundle"),
  exportedAt: nonEmpty.optional(),
  questions: z.array(questionPackageSchema).min(1)
}).strict();

export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}

export const explicitTermLinkPattern = /\[\[term:([a-zA-Z0-9][a-zA-Z0-9._-]*)\|([^\]]+)\]\]/g;

export function collectExplicitTermLinks(text: string): string[] {
  return [...text.matchAll(explicitTermLinkPattern)].map((match) => match[1]);
}

export function collectExplicitTermLinkDetails(text: string): Array<{ id: string; title: string }> {
  const details = new Map<string, string>();
  for (const match of text.matchAll(explicitTermLinkPattern)) if (!details.has(match[1])) details.set(match[1], match[2]);
  return [...details].map(([termId, title]) => ({ id: termId, title }));
}

export function richTextToPlainText(text: RichText, locale: "zh-CN" | "en-US" = "zh-CN"): string {
  text = textForLocale(text, locale);
  return text.replace(explicitTermLinkPattern, (_marker, _termId, label: string) => label);
}

export function questionRichText(question: { stem: RichText; explanation: RichText; options?: Array<{ text: RichText }>; subjectiveAnswer?: { referenceAnswer: RichText; rubric: Array<{ criterion: RichText }> }; ceptCheck?: { stem: RichText } }): string {
  return [question.stem, ...(question.options ?? []).map((option) => option.text), question.explanation, question.subjectiveAnswer?.referenceAnswer ?? "", ...(question.subjectiveAnswer?.rubric.map((item) => item.criterion) ?? []), question.ceptCheck?.stem ?? ""]
    .flatMap((value) => [textForLocale(value, "zh-CN"), textForLocale(value, "en-US")])
    .join("\n");
}

export function termRichText(term: { summary: RichText; coreConclusion: RichText }): string {
  return [term.summary, term.coreConclusion]
    .flatMap((value) => [textForLocale(value, "zh-CN"), textForLocale(value, "en-US")])
    .join("\n");
}

export function dependenciesFromText(text: string, sourceLabel: string): TermDependency[] {
  return collectExplicitTermLinkDetails(text).map((term) => ({ ...term, reason: `${sourceLabel}中显式引用，需要补充或复用对应教学包。` }));
}

export function hydrateQuestionPackage(value: unknown): QuestionPackage {
  const parsed = questionPackageSchema.parse(value);
  return {
    ...parsed,
    options: "options" in parsed ? parsed.options : [],
    correctAnswer: "correctAnswer" in parsed ? parsed.correctAnswer : [],
    termDependencies: dependenciesFromText(questionRichText(parsed), `题目“${textForLocale(parsed.taxonomy.primaryConcept, "zh-CN")}”`)
  } as QuestionPackage;
}

export function hydrateTermPackage(value: unknown, termDependencies: TermDependency[] = []): TermPackage {
  return { ...termPackageSchema.parse(value), termDependencies } as TermPackage;
}

export function subjectiveMaxScore(question: QuestionPackage): number {
  return question.subjectiveAnswer?.rubric.reduce((sum, item) => sum + item.points, 0) ?? 0;
}

export function toQuestionSource(question: QuestionPackage) {
  const { termDependencies: _derived, options, correctAnswer, ...base } = question;
  return question.type === "subjective" ? base : { ...base, options, correctAnswer };
}
