import { ChevronLeft, ListTree } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QuestionPanel } from "../components/QuestionPanel";
import type { TermTrailNode } from "../domain/navigation";
import { richTextToPlainText } from "../domain/schemas";
import { withoutCode } from "../domain/taxonomy";
import { useContent } from "../hooks/useContent";
import type { StudyMode } from "../infrastructure/progressRepository";
import { updateProgress } from "../infrastructure/progressRepository";
import { useEffect } from "react";

export function StudyPage() {
  const { questionId } = useParams();
  const [params] = useSearchParams();
  const { questions, terms } = useContent();
  const question = questions.find((item) => item.id === questionId);
  useEffect(() => { if (question) updateProgress(progress => { progress.lastQuestionId = question.id; }); }, [question]);
  const mode: StudyMode = params.get("mode") === "quick" ? "quick" : "practice";
  if (!question) return <div className="page"><div className="empty-state"><h2>题目不存在或已被删除</h2><Link to="/learn">返回题库</Link></div></div>;
  const index = questions.findIndex((item) => item.id === question.id);
  const linkedTerms = question.termDependencies.map((dependency) => ({ dependency, term: terms.find((term) => term.id === dependency.id) }));
  const questionNode: TermTrailNode = { kind: "question", id: question.id, label: `第 ${question.ordering.order} 题 · ${question.taxonomy.primaryConcept}`, href: `/learn/questions/${question.id}?mode=${mode}` };
  return (
    <div className="study-layout">
      <aside className="study-index"><Link className="back-link" to="/learn"><ChevronLeft size={16} /> 返回题库</Link><div className="study-index-title"><ListTree size={17} /><b>主干顺序</b></div><div className="study-question-list">{questions.map((item) => <Link key={item.id} to={`/learn/questions/${item.id}?mode=${mode}`} className={item.id === question.id ? "active" : ""}><span>{item.ordering.order}</span><div><b>{item.taxonomy.primaryConcept}</b><small>{withoutCode(item.taxonomy.modelFamily)}</small></div></Link>)}</div></aside>
      <div className="study-main"><QuestionPanel key={`${question.id}:${mode}`} question={question} terms={terms} mode={mode} previousId={questions[index - 1]?.id} nextId={questions[index + 1]?.id} /></div>
      <aside className="study-context"><div className="context-section"><span className="eyebrow">POSITION</span><h3>第 {question.ordering.order} 题</h3><p>{question.taxonomy.primaryConcept}</p></div><div className="context-section"><span className="eyebrow">PREREQUISITES</span>{question.ordering.prerequisites.length ? question.ordering.prerequisites.map((id) => { const item = questions.find((candidate) => candidate.id === id); return item ? <Link key={id} to={`/learn/questions/${id}?mode=${mode}`}>{item.taxonomy.primaryConcept}</Link> : null; }) : <p>本题无题目级前置。</p>}</div><div className="context-section"><span className="eyebrow">TERM PACKAGES</span>{linkedTerms.length ? linkedTerms.map(({ dependency, term }) => term ? <Link key={term.id} to={`/terms/${term.id}`} state={{ termTrail: [questionNode, { kind: "term", id: term.id, label: term.title, href: `/terms/${term.id}` }] }}>{term.title}<small>{richTextToPlainText(term.summary)}</small></Link> : <div className="missing-term-card" key={dependency.id}><b>{dependency.title}</b><span>待导入教学包</span><small>{dependency.reason}</small></div>) : <p>本题没有显式词条链接。</p>}</div></aside>
    </div>
  );
}
