import { ChevronLeft, ListTree } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QuestionPanel } from "../components/QuestionPanel";
import { RichText } from "../components/RichText";
import { textForLocale } from "../domain/content";
import { termDisplayName } from "../domain/termNames";
import type { TermTrailNode } from "../domain/navigation";
import { withoutCode } from "../domain/taxonomy";
import { useContent } from "../hooks/useContent";
import type { StudyMode } from "../infrastructure/progressRepository";
import { updateProgress } from "../infrastructure/progressRepository";
import { useEffect, useState } from "react";
import { useLocale, uiText } from "../i18n";

export function StudyPage() {
  const { questionId } = useParams();
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [params] = useSearchParams();
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const question = questions.find((item) => item.id === questionId);
  useEffect(() => { if (question) updateProgress(progress => { progress.lastQuestionId = question.id; }); }, [question]);
  const mode: StudyMode = params.get("mode") === "quick" ? "quick" : "practice";
  if (!question) return <div className="page"><div className="empty-state"><h2>{uiText(locale, "题目不存在或已被删除", "Question not found or deleted")}</h2><Link to="/learn">{uiText(locale, "返回题库", "Back to library")}</Link></div></div>;
  const sequence = question.id.startsWith("KV-CACHE-") ? questions.filter(q=>q.id.startsWith("KV-CACHE-")) : questions;
  const index = sequence.findIndex((item) => item.id === question.id);
  const linkedTerms = question.termDependencies.map((dependency) => ({ dependency, term: terms.find((term) => term.id === dependency.id) }));
  const questionNode: TermTrailNode = { kind: "question", id: question.id, label: `${uiText(locale, "第", "Question")} ${question.ordering.order} · ${textForLocale(question.taxonomy.primaryConcept, locale)}`, href: `/learn/questions/${question.id}?mode=${mode}` };
  return (
    <div className={`study-layout ${outlineOpen ? "outline-open" : ""}`}><div className="study-reading-bar"><Link to="/learn"><ChevronLeft size={16}/>{uiText(locale,"题库","Library")}</Link><span>{question.id.startsWith("KV-CACHE-") ? "KV Cache" : uiText(locale,"学习路径","Learning path")} <b>{index+1} / {sequence.length}</b></span><button aria-expanded={outlineOpen} onClick={()=>setOutlineOpen(v=>!v)}><ListTree size={16}/>{uiText(locale,"目录","Outline")}</button><div className="reading-progress"><i style={{width:`${(index+1)/sequence.length*100}%`}}/></div></div>
      <aside className="study-index"><Link className="back-link" to="/learn"><ChevronLeft size={16} /> {uiText(locale, "返回题库", "Back to library")}</Link><div className="study-index-title"><ListTree size={17} /><b>{uiText(locale, "主干顺序", "Core sequence")}</b></div><div className="study-question-list">{sequence.map((item) => <Link key={item.id} to={`/learn/questions/${item.id}?mode=${mode}`} className={item.id === question.id ? "active" : ""}><span>{item.ordering.order}</span><div><b>{textForLocale(item.taxonomy.primaryConcept, locale)}</b><small>{withoutCode(textForLocale(item.taxonomy.modelFamily, locale))}</small></div></Link>)}</div></aside>
      <div className="study-main"><QuestionPanel key={`${question.id}:${mode}`} question={question} terms={terms} mode={mode} previousId={sequence[index - 1]?.id} nextId={sequence[index + 1]?.id} /></div>
      <aside className="study-context"><div className="context-section"><span className="eyebrow">POSITION</span><h3>{uiText(locale, "第", "Question")} {question.ordering.order}</h3><p>{textForLocale(question.taxonomy.primaryConcept, locale)}</p></div><div className="context-section"><span className="eyebrow">{uiText(locale,"前置知识","PREREQUISITES")}</span>{question.ordering.prerequisites.length ? question.ordering.prerequisites.map((id) => { const item = questions.find((candidate) => candidate.id === id); return item ? <Link key={id} to={`/learn/questions/${id}?mode=${mode}`}>{textForLocale(item.taxonomy.primaryConcept, locale)}</Link> : null; }) : <p>{uiText(locale, "本题无题目级前置。", "This question has no question-level prerequisite.")}</p>}</div><div className="context-section"><span className="eyebrow">{uiText(locale,"相关概念","CONCEPTS")}</span>{linkedTerms.length ? linkedTerms.map(({ dependency, term }) => term ? <Link key={term.id} to={`/terms/${term.id}`} state={{ termTrail: [questionNode, { kind: "term", id: term.id, label: textForLocale(term.title, locale), href: `/terms/${term.id}` }] }}>{textForLocale(term.title, locale)}<small><RichText text={term.summary} terms={terms} linkTerms={false} /></small></Link> : <div className="missing-term-card" key={dependency.id}><b>{termDisplayName(dependency.id, dependency.title, locale)}</b><span>{uiText(locale, "词条待完善", "Upcoming lesson")}</span></div>) : <p>{uiText(locale, "本题没有显式词条链接。", "This question has no explicit term links.")}</p>}</div></aside>
    </div>
  );
}
