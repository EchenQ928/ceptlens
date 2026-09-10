import { ArrowLeft, ArrowRight, Check, RotateCcw, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { orderedQuestions } from "../domain/content";
import { useCopy, useLocale } from "../i18n";
import { useProgress } from "../state/progress";

const assessmentQuestions = orderedQuestions.filter((_, index) => index % 3 === 0).slice(0, 10);

export function AssessmentPage() {
  const copy = useCopy();
  const { pick } = useLocale();
  const { markCompleted } = useProgress();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [finished, setFinished] = useState(false);

  const question = assessmentQuestions[index];
  const score = useMemo(
    () =>
      assessmentQuestions.reduce((total, item) => {
        const actual = [...(answers[item.id] ?? [])].sort();
        const expected = [...item.answer].sort();
        return total + (actual.length === expected.length && actual.every((key, position) => key === expected[position]) ? 1 : 0);
      }, 0),
    [answers]
  );

  const start = () => {
    setStarted(true);
    setFinished(false);
    setIndex(0);
    setSelected([]);
    setAnswers({});
  };

  const select = (key: string) => {
    if (!question) {
      return;
    }
    if (question.type === "single") {
      setSelected([key]);
    } else {
      setSelected((current) =>
        current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
      );
    }
  };

  const next = () => {
    if (!question || selected.length === 0) {
      return;
    }
    setAnswers((current) => ({ ...current, [question.id]: selected }));
    markCompleted(question.id);
    if (index === assessmentQuestions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected([]);
  };

  if (!started || finished) {
    return (
      <div className="page-stack">
        <section className="assessment-hero">
          <div className="assessment-icon">
            <Trophy size={24} />
          </div>
          <span className="eyebrow">CHECKPOINT / {assessmentQuestions.length} ITEMS</span>
          <h1>{copy("assessmentTitle")}</h1>
          <p>{copy("assessmentIntro")}</p>
          {finished ? (
            <div className="score-block">
              <span>{copy("assessmentScore")}</span>
              <strong>
                {score} <small>/ {assessmentQuestions.length}</small>
              </strong>
            </div>
          ) : null}
          <div className="assessment-actions">
            <button className="button button-primary" onClick={start}>
              {finished ? <RotateCcw size={17} /> : <Check size={17} />}
              <span>{finished ? copy("restartAssessment") : copy("startAssessment")}</span>
            </button>
            {finished ? (
              <Link className="button button-secondary" to="/learn">
                <span>{copy("backToLearn")}</span>
                <ArrowRight size={17} />
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack question-page assessment-page">
      <div className="question-nav">
        <Link className="back-link" to="/learn">
          <ArrowLeft size={16} />
          <span>{copy("backToLearn")}</span>
        </Link>
        <span className="question-position">
          {index + 1} / {assessmentQuestions.length}
        </span>
      </div>

      <section className="question-header">
        <div className="question-labels">
          <span className="eyebrow">{question.topic}</span>
          <span className="pill">{question.level}</span>
        </div>
        <h1>{pick(question.prompt)}</h1>
        <p className="question-instruction">
          {question.type === "single" ? copy("selectOne") : copy("selectMultiple")}
        </p>
      </section>

      <section className="choice-list">
        {question.choices.map((choice) => (
          <button
            className={`choice-row ${selected.includes(choice.key) ? "is-selected" : ""}`}
            key={choice.key}
            onClick={() => select(choice.key)}
            type="button"
            aria-pressed={selected.includes(choice.key)}
          >
            <span className="choice-key">{choice.key}</span>
            <span className="choice-label">{pick(choice.label)}</span>
          </button>
        ))}
      </section>
      <button className="button button-primary answer-button" onClick={next} disabled={selected.length === 0}>
        <span>{index === assessmentQuestions.length - 1 ? copy("finishAssessment") : copy("next")}</span>
        <ArrowRight size={17} />
      </button>
    </div>
  );
}
