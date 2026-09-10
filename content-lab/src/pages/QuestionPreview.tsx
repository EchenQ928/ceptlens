import { useState } from "react";
import { RichText } from "../components/RichText";
import type { QuestionPackage, TermPackage } from "../domain/content";

/** Content-only renderer: no learner account, progress tracking or exam service. */
export function QuestionPreview({ question, terms }: { question: QuestionPackage; terms: TermPackage[] }) {
  const [selected, setSelected] = useState<string[]>([]); const [show, setShow] = useState(false);
  const sourceNode = { kind: "question" as const, id: question.id, label: question.taxonomy.primaryConcept, href: `/learn/questions/${question.id}` };
  const rich = (text: string) => <RichText text={text} terms={terms} sourceNode={sourceNode} />;
  return <article className="question-panel"><div className="question-meta">{question.type === "subjective" ? "问答题" : question.type === "multiple_choice" ? "多选题" : "单选题"} · {question.taxonomy.learningLevel} · {question.taxonomy.modelFamily}</div><h1 className="question-stem">{rich(question.stem)}</h1>
    {question.type === "subjective" ? <textarea className="subjective-answer" aria-label="试写答案" placeholder="试写答案，不记录成绩" /> : <div className="option-list">{question.options.map(option => <div key={option.key} className={`option-row ${show ? question.correctAnswer.includes(option.key) ? "correct" : selected.includes(option.key) ? "wrong" : "" : selected.includes(option.key) ? "selected" : ""}`}><button className="option-key" disabled={show} aria-pressed={selected.includes(option.key)} aria-label={`选择 ${option.key}`} onClick={() => setSelected(current => question.type === "multiple_choice" ? current.includes(option.key) ? current.filter(key => key !== option.key) : [...current, option.key] : [option.key])}>{option.key}</button><div className="option-content">{rich(option.text)}</div></div>)}</div>}
    <div className="answer-actions"><button className="primary-button" onClick={() => setShow(value => !value)}>{show ? "隐藏答案" : "查看答案"}</button><button className="secondary-button" onClick={() => { setSelected([]); setShow(false); }}>重置</button></div>
    {show && <section className="answer-panel"><div className="answer-heading"><span>参考答案</span><strong>{question.correctAnswer.join("、")}</strong></div><p>{rich(question.explanation)}</p>{question.subjectiveAnswer && <><p>{rich(question.subjectiveAnswer.referenceAnswer)}</p><ol>{question.subjectiveAnswer.rubric.map((item, index) => <li key={index}>{rich(item.criterion)}（{item.points} 分）</li>)}</ol></>}</section>}
    {question.ceptCheck && <section className="cept-check"><div className="question-meta">CeptCheck · 延伸理解</div><h2>{rich(question.ceptCheck.stem)}</h2><p>先暂停页面，在心里回答这个问题，再继续学习。</p></section>}
  </article>;
}
