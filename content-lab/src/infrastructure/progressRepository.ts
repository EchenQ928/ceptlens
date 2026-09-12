import { z } from "zod";

export type StudyMode = "practice" | "quick";

export interface ProgressState {
  completed: string[];
  wrong: string[];
  favorites: string[];
  confidence: Record<string, "clear" | "fuzzy" | "guess">;
  lastQuestionId?: string;
  studyMode: StudyMode;
}

const KEY = "ceptlens.progress.v1";
const progressSchema = z.object({
  completed: z.array(z.string()).catch([]), wrong: z.array(z.string()).catch([]),
  favorites: z.array(z.string()).catch([]),
  confidence: z.record(z.enum(["clear", "fuzzy", "guess"])).catch({}),
  lastQuestionId: z.string().optional().catch(undefined), studyMode: z.enum(["practice", "quick"]).catch("practice")
});

const initial = (): ProgressState => ({ completed: [], wrong: [], favorites: [], confidence: {}, studyMode: "practice" });

export function readProgress(): ProgressState {
  try {
    return progressSchema.parse(JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {
    return initial();
  }
}

export function writeProgress(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("progress-change"));
}

export function updateProgress(mutator: (state: ProgressState) => void) {
  const state = readProgress();
  mutator(state);
  writeProgress(state);
  return state;
}

export function replaceProgress(state: ProgressState) {
  writeProgress(progressSchema.parse(state));
}
