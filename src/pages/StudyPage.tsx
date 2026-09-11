import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QuestionPanel } from "../components/QuestionPanel";
import { RichText } from "../components/RichText";
import { textForLocale } from "../domain/content";
import { dependencyReason, termDisplayName } from "../domain/termNames";
import type { TermTrailNode } from "../domain/navigation";
import { useContent } from "../hooks/useContent";
import { updateProgress, type StudyMode } from "../infrastructure/progressRepository";
import { useLocale, uiText } from "../i18n";

export function StudyPage() {
  const { questionId } = useParams();
  const [params] = useSearchParams();
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const [focused, setFocused] = useState(false);
  const question = questions.find(item => item.id === questionId);
  useEffect(() => {
    if (question) updateProgress(progress => { progress.lastQuestionId = question.id; });
  }, [question]);
  const mode: StudyMode = params.get("mode") === "quick" ? "quick" : "practice";
  if (!question) return <div className="page"><div className="empty-state"><h2>{t("题目不存在或已被删除", "Question not found or deleted")}</h2><Link to="/learn">{t("返回题库", "Back to library")}</Link></div></div>;

  const sequence = question.id.startsWith("KV-CACHE-") ? questions.filter(q => q.id.startsWith("KV-CACHE-")) : questions;
  const index = sequence.findIndex(item => item.id === question.id);
  const linkedTerms = question.termDependencies.map(dependency => ({ dependency, term: terms.find(term => term.id === dependency.id) }));
  const pendingTerms = linkedTerms.filter(item => !item.term);
  const questionNode: TermTrailNode = {
    kind: "question", id: question.id,
    label: `${t("第", "Question")} ${index + 1} · ${textForLocale(question.taxonomy.primaryConcept, locale)}`,
    href: `/learn/questions/${question.id}?mode=${mode}`
  };
  return <div className={`study-layout ${focused ? "is-focused" : ""}`}>
    <div className="study-main">
      <div className="study-tools">
        <span className="study-step">{question.id.startsWith("KV-CACHE-") ? "KV CACHE" : t("学习题库", "LEARNING LIBRARY")} · <b>{index + 1}</b> / {sequence.length}</span>
        <button className="focus-toggle" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
          {focused ? <Minimize2 size={14}/> : <Maximize2 size={14}/>} {focused ? t("退出专注", "Exit focus") : t("专注阅读", "Focus")}
        </button>
      </div>
      <details className="study-sequence-menu">
        <summary>{t("题目导航", "Question navigation")}</summary>
        <div className="study-question-list">{sequence.map((item, sequenceIndex) =>
          <Link key={item.id} to={`/learn/questions/${item.id}?mode=${mode}`} className={item.id === question.id ? "active" : ""} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <span>{String(sequenceIndex + 1).padStart(2, "0")}</span><div><b>{textForLocale(item.taxonomy.primaryConcept, locale)}</b></div>
          </Link>
        )}</div>
        <Link className="sequence-library-link text-link" to="/learn">{t("返回完整题库", "Back to the full library")}</Link>
      </details>
      <QuestionPanel key={`${question.id}:${mode}`} question={question} terms={terms} mode={mode} previousId={sequence[index - 1]?.id} nextId={sequence[index + 1]?.id}/>
    </div>
    <aside className="study-context" aria-label={t("相关知识", "Related knowledge")}>
      <div className="context-section"><span className="eyebrow">{t("本题关注", "IN FOCUS")}</span><h3>{textForLocale(question.taxonomy.primaryConcept, locale)}</h3></div>
      <div className="context-section">
        <span className="eyebrow">{t("前置知识", "BUILDING ON")}</span>
        {question.ordering.prerequisites.length ? question.ordering.prerequisites.map(id => {
          const item = questions.find(candidate => candidate.id === id);
          return item ? <Link key={id} to={`/learn/questions/${id}?mode=${mode}`}>{textForLocale(item.taxonomy.primaryConcept, locale)}</Link> : null;
        }) : <p>{t("可以直接从这道题开始。", "You can start right here.")}</p>}
      </div>
      <div className="context-section">
        <span className="eyebrow">{t("深入相关概念", "EXPLORE THE CONCEPTS")}</span>
        {linkedTerms.filter(item => item.term).map(({ term }) => term &&
          <Link className="context-concept-link" key={term.id} to={`/terms/${term.id}`} state={{ termTrail: [questionNode, { kind: "term", id: term.id, label: textForLocale(term.title, locale), href: `/terms/${term.id}` }] }}>
            <b>{textForLocale(term.title, locale)}</b><small><RichText text={term.summary} terms={terms} linkTerms={false}/></small>
          </Link>
        )}
        {!linkedTerms.length && <p>{t("本题暂未关联词条。", "No concepts are linked to this question yet.")}</p>}
        {pendingTerms.length > 0 && <details className="context-pending"><summary>{pendingTerms.length} {t("个词条待完善", "concepts in preparation")}</summary>{pendingTerms.map(({ dependency }) =>
          <div className="missing-term-card" key={dependency.id}><b>{termDisplayName(dependency.id, dependency.title, locale)}</b><small>{dependencyReason(dependency.reason, locale)}</small></div>
        )}</details>}
      </div>
    </aside>
  </div>;
}
