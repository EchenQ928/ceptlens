import { contentRepository } from "../infrastructure/contentRepository";

export function useContent() {
  return {
    questions: contentRepository.listQuestions(),
    terms: contentRepository.listTerms()
  };
}
