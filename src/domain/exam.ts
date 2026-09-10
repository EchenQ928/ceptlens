import type { QuestionPackage } from "./content";
import type { Locale } from "./content";
export type ExamQuestion = Omit<QuestionPackage, "explanation" | "correctAnswer"> & { explanation?: string; correctAnswer?: string[] };
export type ExamAnswers = Record<string, string | string[]>;
export interface ExamResult { id: string; state: "correct" | "incorrect" | "pending" | "graded"; score: number | null; maxScore: number; reason?: string; items?: { index: number; points: number; feedback: string }[] }
export interface ExamAttempt {
  id: string; name: string; status: "active" | "submitted"; revision: number; startedAt: number; deadline: number; submittedAt: number | null; serverNow: number;
  completePaper: boolean; questions: ExamQuestion[]; answers: ExamAnswers; results: ExamResult[] | null; total: number | null; objectiveScore?: number; objectiveMax?: number;
}
export interface ExamCatalog { plan: { minutes: number }; readiness: { type: string; available: number; required: number }[]; exams: Pick<ExamAttempt, "id" | "status" | "startedAt" | "submittedAt" | "total" | "objectiveScore">[] }
export const examTypeName = (type: string, locale: Locale = "zh-CN") => locale === "en-US"
  ? type === "single_choice" ? "Single choice" : type === "multiple_choice" ? "Multiple choice" : "Short answer"
  : type === "single_choice" ? "单选题" : type === "multiple_choice" ? "多选题" : "主观题";
export function answeredCount(answers: ExamAnswers) { return Object.values(answers).filter(a => Array.isArray(a) ? a.length > 0 : a.trim().length > 0).length; }
