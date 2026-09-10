import type { QuestionBundle, QuestionPackage, TermPackage } from "../domain/content";
import { toQuestionSource } from "../domain/schemas";
import { baselineQuestions, baselineTerms } from "./staticContent";

/** Runtime reads immutable content built from the two portable libraries. Mutations go through the host API. */
export const contentRepository = {
  listQuestions(): QuestionPackage[] {
    return baselineQuestions;
  },

  listTerms(): TermPackage[] {
    return baselineTerms;
  },

  getQuestion(id: string) {
    return baselineQuestions.find((item) => item.id === id);
  },

  getTerm(id: string) {
    return baselineTerms.find((item) => item.id === id);
  },

  exportQuestions(items: QuestionPackage[]): QuestionBundle {
    return { schemaVersion: "3.0", kind: "question-bundle", exportedAt: new Date().toISOString(), questions: items.map(toQuestionSource) as QuestionBundle["questions"] };
  }
};
