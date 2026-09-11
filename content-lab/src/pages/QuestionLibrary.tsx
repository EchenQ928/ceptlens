import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FeaturedBadges, FeaturedContentFilter } from '../components/FeaturedContent';
import { RichText } from '../components/RichText';
import { matchesFeatured, type FeaturedFilter } from '../domain/featured';
import { useContent } from '../hooks/useContent';
import { uiText, useLocale } from '../i18n';

export function QuestionLibrary() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const [featured, setFeatured] = useState<FeaturedFilter>('all');
  const filtered = questions.filter(question => matchesFeatured(question, featured));
  return <div className="page"><h1>{uiText(locale, '题目草稿', 'Question drafts')}</h1>
    <FeaturedContentFilter questions={questions} value={featured} onChange={setFeatured} />
    {filtered.map(question => <Link className="lab-question-link" key={question.id} to={`/learn/questions/${question.id}`}><FeaturedBadges question={question} /><RichText text={question.stem} terms={terms} linkTerms={false} /></Link>)}
    {!filtered.length && <div className="empty-state">{questions.length ? uiText(locale, '没有匹配的精选内容。请选择其他筛选条件。', 'No featured content matches. Try another filter.') : uiText(locale, '还没有题目。可从上方导入题目 JSON。', 'No questions yet. Import a question JSON above.')}</div>}
  </div>;
}
