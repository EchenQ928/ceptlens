import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { QuestionPackage, TermPackage } from "../domain/content";
import type { TermTrailNode } from "../domain/navigation";
import { subjectiveMaxScore } from "../domain/schemas";
import { useProgress } from "../hooks/useProgress";
import { updateProgress, type StudyMode } from "../infrastructure/progressRepository";
import { RichText } from "./RichText";

export function QuestionPanel({ question, terms, mode, previousId, nextId, preview = false }: { question: QuestionPackage; terms: TermPackage[]; mode: StudyMode; previousId?: string; nextId?: string; preview?: boolean }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(mode === "quick");
  const progress = useProgress();
  const favorite = progress.favorites.includes(question.id);
  const [answerText, setAnswerText] = useState("");
  const isMulti = question.type === "multiple_choice";
  const isSubjective = question.type === "subjective";
  const correct = useMemo(() => selected.length === question.correctAnswer.length && selected.every((key) => question.correctAnswer.includes(key)), [question, selected]);
  const sourceNode: TermTrailNode = { kind: "question", id: question.id, label: `第 ${question.ordering.order} 题 · ${question.taxonomy.primaryConcept}`, href: `/learn/questions/${question.id}?mode=${mode}` };

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
        <div className="question-meta"><span className="type-chip">{isSubjective ? "主观题" : isMulti ? "多选题" : "单选题"}</span><span>{question.taxonomy.learningLevel}</span><span>{question.taxonomy.modelFamily}</span></div>
        {!preview && <button className={`icon-text-button ${favorite ? "active" : ""}`} aria-pressed={favorite} onClick={toggleFavorite}><Heart size={16} fill={favorite ? "currentColor" : "none"} /> {favorite ? "已收藏" : "收藏"}</button>}
      </div>
      <h1 className="question-stem"><RichText text={question.stem} terms={terms} sourceNode={sourceNode} /></h1>
      {isSubjective ? <><label className="sr-only" htmlFor="practice-answer">你的回答</label><textarea id="practice-answer" className="subjective-answer" value={answerText} onChange={event => setAnswerText(event.target.value)} placeholder="在这里组织你的回答…" /></> : <div className="option-list">{question.options.map((option) => {
        const chosen = selected.includes(option.key);
        const answer = question.correctAnswer.includes(option.key);
        const state = revealed ? (answer ? "correct" : chosen ? "wrong" : "") : chosen ? "selected" : "";
        return <div key={option.key} className={`option-row ${state}`} onClick={event => { if (!(event.target as HTMLElement).closest("a, button") && !window.getSelection()?.toString()) select(option.key); }}><button className="option-key" data-annotation-ignore disabled={revealed} onClick={() => select(option.key)} aria-pressed={chosen} aria-label={`选择 ${option.key}`}>{revealed && answer ? <Check size={17} /> : option.key}</button><div className="option-content"><RichText text={option.text} terms={terms} sourceNode={sourceNode} /></div></div>;
      })}</div>}
      <div className="answer-actions" data-annotation-ignore>
        {mode === "practice" && !revealed && <button className="primary-button" disabled={!preview && !isSubjective && selected.length === 0} onClick={reveal}><Eye size={17} /> 查看答案</button>}
        {mode === "practice" && revealed && <button className="secondary-button" onClick={() => { setSelected([]); setAnswerText(""); setRevealed(false); }}><RotateCcw size={16} /> 重做</button>}
        {mode === "quick" && <button className="secondary-button" onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={16} /> : <Eye size={16} />}{revealed ? "隐藏答案" : "显示答案"}</button>}
      </div>
      {revealed && isSubjective && <p className="practice-notice">本题仅展示参考作答，不自动判断对错。请对照评分要点自评。</p>}
      {revealed && <section className="answer-panel"><div className="answer-heading"><span>参考答案</span><strong>{question.correctAnswer.join("、") || "见评分要点"}</strong></div><p><RichText text={question.explanation} terms={terms} sourceNode={sourceNode} /></p>{question.subjectiveAnswer && <div className="rubric"><b>参考作答</b><p><RichText text={question.subjectiveAnswer.referenceAnswer} terms={terms} sourceNode={sourceNode} /></p><b>评分要点 · {subjectiveMaxScore(question)} 分</b><ol>{question.subjectiveAnswer.rubric.map((item, index) => <li key={`${index}-${item.criterion}`}><RichText text={item.criterion} terms={terms} sourceNode={sourceNode} />（{item.points} 分）</li>)}</ol></div>}</section>}
      {!preview && <footer className="question-footer" data-annotation-ignore>
        <button className="secondary-button" disabled={!previousId} onClick={() => previousId && navigate(`/learn/questions/${previousId}?mode=${mode}`)}><ChevronLeft size={17} /> 上一题</button>
        <div className="confidence-actions"><span>掌握感受</span>{(["clear", "fuzzy", "guess"] as const).map((value) => <button key={value} aria-pressed={progress.confidence[question.id] === value} onClick={() => updateProgress((progress) => { progress.confidence[question.id] = value; })}>{value === "clear" ? "清楚" : value === "fuzzy" ? "模糊" : "猜的"}</button>)}</div>
        <button className="primary-button" disabled={!nextId} onClick={() => nextId && navigate(`/learn/questions/${nextId}?mode=${mode}`)}>下一题 <ChevronRight size={17} /></button>
      </footer>}
    </article>
  );
}
