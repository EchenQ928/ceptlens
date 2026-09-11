import { Award } from 'lucide-react';
import type { QuestionPackage } from '../domain/content';
import { matchesFeatured, type FeaturedFilter } from '../domain/featured';
import { uiText, useLocale } from '../i18n';
import './featured-content.css';

export function FeaturedBadge({ kind }: { kind: Exclude<FeaturedFilter, 'all'> }) {
  const { locale } = useLocale();
  return <span className="featured-badge"><Award size={14} aria-hidden="true" />{kind === 'question' ? uiText(locale, '精选题目', 'Featured question') : uiText(locale, '精选 CeptCheck', 'Featured CeptCheck')}</span>;
}

export function FeaturedBadges({ question }: { question: QuestionPackage }) {
  if (!question.featured && !question.ceptCheck?.featured) return null;
  return <span className="featured-badges">{question.featured && <FeaturedBadge kind="question" />}{question.ceptCheck?.featured && <FeaturedBadge kind="ceptCheck" />}</span>;
}

export function FeaturedContentFilter({ questions, value, onChange }: { questions: QuestionPackage[]; value: FeaturedFilter; onChange: (value: FeaturedFilter) => void }) {
  const { locale } = useLocale();
  const options: Array<{ value: FeaturedFilter; label: string }> = [
    { value: 'all', label: uiText(locale, '全部', 'All') },
    { value: 'question', label: uiText(locale, '精选题目', 'Featured questions') },
    { value: 'ceptCheck', label: uiText(locale, '精选 CeptCheck', 'Featured CeptChecks') }
  ];
  return <div className="featured-filter" role="group" aria-label={uiText(locale, '精选内容', 'Featured content')}>
    <b>{uiText(locale, '精选内容', 'Featured content')}</b>
    {options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}<small>{questions.filter(question => matchesFeatured(question, option.value)).length}</small></button>)}
  </div>;
}
