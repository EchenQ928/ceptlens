import { FeaturedBadge } from "../components/FeaturedContent";
import { useState } from "react";
import { RichText } from "../components/RichText";
import { textForLocale, type QuestionPackage, type RichText as RichTextValue, type TermPackage } from "../domain/content";
import { uiText, useLocale } from "../i18n";
import { taxonomyText } from "../domain/taxonomy";

/** Content-only renderer: no learner account, progress tracking or exam service. */
export function QuestionPreview({ question, terms }: { question: QuestionPackage; terms: TermPackage[] }) {
  const { locale } = useLocale();
  const [selected, setSelected] = useState<string[]>([]); const [show, setShow] = useState(false);
  const sourceNode = { kind: "question" as const, id: question.id, label: textForLocale(question.taxonomy.primaryConcept, locale), href: `/learn/questions/${question.id}` };
  const rich = (text: RichTextValue) => <RichText text={text} terms={terms} sourceNode={sourceNode} />;
  return <article className="question-panel"><div className="question-meta">{question.featured && <FeaturedBadge kind="question" />} {question.type === "subjective" ? uiText(locale, "问答题", "Short answer") : question.type === "multiple_choice" ? uiText(locale, "多选题", "Multiple choice") : uiText(locale, "单选题", "Single choice")} · {taxonomyText(question.taxonomy.learningLevel, locale)} · {textForLocale(question.taxonomy.modelFamily, locale)}</div><h1 className="question-stem">{rich(question.stem)}</h1>
    {question.type === "subjective" ? <textarea className="subjective-answer" aria-label={uiText(locale, "试写答案", "Draft answer")} placeholder={uiText(locale, "试写答案，不记录成绩", "Draft an answer; it is not graded")} /> : <div className="option-list">{question.options.map(option => <div key={option.key} className={`option-row ${show ? question.correctAnswer.includes(option.key) ? "correct" : selected.includes(option.key) ? "wrong" : "" : selected.includes(option.key) ? "selected" : ""}`}><button className="option-key" disabled={show} aria-pressed={selected.includes(option.key)} aria-label={`${uiText(locale, "选择", "Select")} ${option.key}`} onClick={() => setSelected(current => question.type === "multiple_choice" ? current.includes(option.key) ? current.filter(key => key !== option.key) : [...current, option.key] : [option.key])}>{option.key}</button><div className="option-content">{rich(option.text)}</div></div>)}</div>}
    <div className="answer-actions"><button className="primary-button" onClick={() => setShow(value => !value)}>{show ? uiText(locale, "隐藏答案", "Hide answer") : uiText(locale, "查看答案", "Show answer")}</button><button className="secondary-button" onClick={() => { setSelected([]); setShow(false); }}>{uiText(locale, "重置", "Reset")}</button></div>
    {show && <section className="answer-panel"><div className="answer-heading"><span>{uiText(locale, "参考解答", "Reference answer")}</span>{question.type !== "subjective" && <strong>{question.correctAnswer.join("、")}</strong>}</div><p>{rich(question.type === "subjective" ? question.subjectiveAnswer!.referenceAnswer : question.explanation)}</p></section>}
    {question.ceptCheck && <section className="cept-check"><div className="question-meta">CeptCheck {question.ceptCheck.featured && <FeaturedBadge kind="ceptCheck" />}</div><h2>{rich(question.ceptCheck.stem)}</h2></section>}
  </article>;
}
