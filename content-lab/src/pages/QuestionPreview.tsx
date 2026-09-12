import { useSearchParams } from 'react-router-dom';
import { QuestionPanel } from '../components/QuestionPanel';
import type { QuestionPackage, TermPackage } from '../domain/content';

/** Platform renderer with local state only: no progress writes or grading calls. */
export function QuestionPreview({ question, terms }: { question: QuestionPackage; terms: TermPackage[] }) {
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'quick' ? 'quick' : 'practice';
  return <QuestionPanel key={`${question.id}-${mode}`} question={question} terms={terms} mode={mode} preview />;
}
