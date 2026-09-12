import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FeaturedBadge } from "./FeaturedContent";
import { ProductIcon } from "./ProductIcon";
import { Check, CircleCheck, CircleHelp, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { QuestionPackage, TermPackage } from "../domain/content";
import { textForLocale } from "../domain/content";
import type { TermTrailNode } from "../domain/navigation";
import { subjectiveMaxScore } from "../domain/schemas";
import { useProgress } from "../hooks/useProgress";
import { updateProgress, type StudyMode } from "../infrastructure/progressRepository";
import { RichText } from "./RichText";
import { useLocale, uiText } from "../i18n";
import { taxonomyText } from "../domain/taxonomy";

export function QuestionPanel({ question, terms, mode, previousId, nextId, preview = false }: { question: QuestionPackage; terms: TermPackage[]; mode: StudyMode; previousId?: string; nextId?: string; preview?: boolean }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { locale } = useLocale();
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(mode === "quick");
  const progress = useProgress();
  const favorite = progress.favorites.includes(question.id);
  const [answerText, setAnswerText] = useState("");
  const isMulti = question.type === "multiple_choice";
  const isSubjective = question.type === "subjective";
  const correct = useMemo(() => selected.length === question.correctAnswer.length && selected.every((key) => question.correctAnswer.includes(key)), [question, selected]);
  const sourceNode: TermTrailNode = { kind: "question", id: question.id, label: `${uiText(locale, "第", "Question")} ${question.ordering.order} · ${textForLocale(question.taxonomy.primaryConcept, locale)}`, href: `/learn/questions/${question.id}?mode=${mode}` };

  function select(key: string) {
    if (revealed) return;
    setSelected((current) => isMulti ? (current.includes(key) ? current.filter((value) => value !== key) : [...current, key]) : [key]);
  }

  function reveal() {
    setRevealed(true);
    if (preview) return;
    updateProgress((progress) => {
      if (!progress.completed.includes(question.id)) progress.completed.push(question.id);
      progress.lastQuestionId = question.id;
      if (!isSubjective) progress.wrong = correct ? progress.wrong.filter((id) => id !== question.id) : [...new Set([...progress.wrong, question.id])];
    });
  }

  function toggleFavorite() {
    const next = !favorite;
    updateProgress((progress) => {
      progress.favorites = next ? [...new Set([...progress.favorites, question.id])] : progress.favorites.filter((id) => id !== question.id);
    });
  }

  return (
    <article className="question-panel">
      <div className="question-toolbar" data-annotation-ignore>
        <div className="question-meta">{question.featured && <FeaturedBadge kind="question" />}<span className="type-chip">{isSubjective ? uiText(locale, "主观题", "Short answer") : isMulti ? uiText(locale, "多选题", "Multiple choice") : uiText(locale, "单选题", "Single choice")}</span><span>{taxonomyText(question.taxonomy.learningLevel, locale)}</span></div>
        {!preview && <button className={`icon-text-button ${favorite ? "active" : ""}`} aria-pressed={favorite} onClick={toggleFavorite}><Heart size={16} fill={favorite ? "currentColor" : "none"} /> {favorite ? uiText(locale, "已收藏", "Saved") : uiText(locale, "收藏", "Save")}</button>}
      </div>
      <h1 className="question-stem"><RichText text={question.stem} terms={terms} sourceNode={sourceNode} /></h1>
      {isSubjective ? <><label className="sr-only" htmlFor="practice-answer">{uiText(locale, "你的回答", "Your answer")}</label><textarea id="practice-answer" className="subjective-answer" value={answerText} onChange={event => setAnswerText(event.target.value)} placeholder={uiText(locale, "在这里组织你的回答…", "Write your answer here…")} /></> : <div className="option-list">{question.options.map((option) => {
        const chosen = selected.includes(option.key);
        const answer = question.correctAnswer.includes(option.key);
        const state = revealed ? (answer ? "correct" : chosen ? "wrong" : "") : chosen ? "selected" : "";
        return <div key={option.key} className={`option-row ${state}`} onClick={event => { if (!(event.target as HTMLElement).closest("a, button") && !window.getSelection()?.toString()) select(option.key); }}><button className="option-key" data-annotation-ignore disabled={revealed} onClick={() => select(option.key)} aria-pressed={chosen} aria-label={`${uiText(locale, "选择", "Select")} ${option.key}`}>{revealed && answer ? <Check size={17} /> : option.key}</button><div className="option-content"><RichText text={option.text} terms={terms} sourceNode={sourceNode} /></div></div>;
      })}</div>}
      <div className="answer-actions" data-annotation-ignore>
        {mode === "practice" && !revealed && <button className="primary-button" disabled={!preview && !isSubjective && selected.length === 0} onClick={reveal}><ProductIcon kind="reveal"/> {uiText(locale, "查看答案", "Show answer")}</button>}
        {mode === "practice" && revealed && <button className="secondary-button" onClick={() => { setSelected([]); setAnswerText(""); setRevealed(false); }}><RotateCcw size={16} /> {uiText(locale, "重做", "Try again")}</button>}
        {mode === "quick" && <button className="secondary-button" onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={16} /> : <Eye size={16} />}{revealed ? uiText(locale, "隐藏答案", "Hide answer") : uiText(locale, "显示答案", "Show answer")}</button>}
      </div>
      <AnimatePresence initial={false}>{revealed && <motion.div key="revealed-answer" className="answer-reveal" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .45, ease: [.22, 1, .36, 1] }}>
      {revealed && isSubjective && <p className="practice-notice">{uiText(locale, "本题仅展示参考作答，不自动判断对错。请对照评分要点自评。", "This practice view shows a reference answer only. Compare your response with the guidance yourself.")}</p>}
      {revealed && mode === "practice" && !isSubjective && <div role="status" className={`answer-feedback ${correct ? "is-correct" : "needs-review"}`}>{correct ? <CircleCheck size={19}/> : <CircleHelp size={19}/>}<div><strong>{correct ? uiText(locale,"答对了","Correct") : uiText(locale,"再想一想","Review your answer")}</strong></div></div>}
      {revealed && <section className="answer-panel"><div className="answer-heading"><span>{uiText(locale, "参考答案", "Reference answer")}</span><strong>{question.correctAnswer.join("、") || uiText(locale, "见评分要点", "See guidance")}</strong></div>{!isSubjective && <p><RichText text={question.explanation} terms={terms} sourceNode={sourceNode} /></p>}{question.subjectiveAnswer && <div className="rubric"><p><RichText text={question.subjectiveAnswer.referenceAnswer} terms={terms} sourceNode={sourceNode} /></p><div className="scoring-guidance"><b>{uiText(locale, "评分要点", "Scoring guidance")} · {subjectiveMaxScore(question)} {uiText(locale, "分", "points")}</b><ol>{question.subjectiveAnswer.rubric.map((item, index) => <li key={`${index}-${textForLocale(item.criterion, locale)}`}><RichText text={item.criterion} terms={terms} sourceNode={sourceNode} />（{item.points} {uiText(locale, "分", "points")}）</li>)}</ol></div></div>}</section>}
      </motion.div>}</AnimatePresence>
      {question.ceptCheck && <section className="cept-check"><div className="question-meta"><span>CeptCheck</span>{question.ceptCheck.featured && <FeaturedBadge kind="ceptCheck" />}</div><h2><RichText text={question.ceptCheck.stem} terms={terms} sourceNode={sourceNode} /></h2></section>}
      {!preview && <footer className="question-footer" data-annotation-ignore>
        <button className="secondary-button" disabled={!previousId} onClick={() => previousId && navigate(`/learn/questions/${previousId}?mode=${mode}`, { state: { questionDirection: -1 } })}><ChevronLeft size={17} /> {uiText(locale, "上一题", "Previous")}</button>
        <div className="confidence-actions"><span>{uiText(locale, "掌握感受", "Confidence")}</span>{(["clear", "fuzzy", "guess"] as const).map((value) => <button key={value} aria-pressed={progress.confidence[question.id] === value} onClick={() => updateProgress((progress) => { progress.confidence[question.id] = value; })}>{value === "clear" ? uiText(locale, "清楚", "Clear") : value === "fuzzy" ? uiText(locale, "模糊", "Fuzzy") : uiText(locale, "猜的", "Guessed")}</button>)}</div>
        <button className="primary-button" disabled={!nextId} onClick={() => nextId && navigate(`/learn/questions/${nextId}?mode=${mode}`, { state: { questionDirection: 1 } })}>{uiText(locale, "下一题", "Next")} <ChevronRight size={17} /></button>
      </footer>}
    </article>
  );
}
