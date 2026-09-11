import type { QuestionPackage } from './content';

export type FeaturedFilter = 'all' | 'question' | 'ceptCheck';

export function matchesFeatured(question: QuestionPackage, filter: FeaturedFilter): boolean {
  if (filter === 'question') return question.featured === true;
  if (filter === 'ceptCheck') return question.ceptCheck?.featured === true;
  return true;
}
