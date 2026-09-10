import { ArrowLeft, ArrowRight, Check, CircleHelp, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { RichText } from "../components/RichText";
import { orderedQuestions, questionsById, termsById } from "../domain/content";
import { useCopy, useLocale } from "../i18n";
import { useProgress } from "../state/progress";

export function QuestionPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const copy = useCopy();
  const { pick } = useLocale();
  const { markCompleted } = useProgress();
  const question = questionId ? questionsById.get(questionId) : undefined;
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelected([]);
    setSubmitted(false);
  }, [question?.id]);

  const questionIndex = question ? orderedQuestions.findIndex((item) => item.id === question.id) : -1;
  const nextQuestion = questionIndex >= 0 ? orderedQuestions[questionIndex + 1] : undefined;

  const isCorrect = useMemo(() => {
    if (!question || !submitted) {
      return false;
    }
    const expected = [...question.answer].sort();
    const actual = [...selected].sort();
    return expected.length === actual.length && expected.every((key, index) => key === actual[index]);
  }, [question, selected, submitted]);

  if (!question) {
    return (
      <div className="empty-state">
        <CircleHelp size={30} />
        <h1>{copy("notFoundTitle")}</h1>
        <p>{copy("notFoundDescription")}</p>
        <Link className="button button-primary" to="/learn">
          {copy("backToLearn")}
        </Link>
      </div>
    );
  }

  const handleChoice = (key: string) => {
    if (submitted) {
      return;
    }
    if (question.type === "single") {
      setSelected([key]);
      return;
    }
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const submit = () => {
    if (selected.length === 0) {
      return;
    }
    setSubmitted(true);
    markCompleted(question.id);
  };

  return (
    <div className="page-stack question-page">
      <div className="question-nav">
        <button className="back-link" onClick={() => navigate("/learn")}>
          <ArrowLeft size={16} />
          <span>{copy("backToLearn")}</span>
        </button>
        <span className="question-position">
          {String(question.order).padStart(2, "0")} / {String(orderedQuestions.length).padStart(2, "0")}
        </span>
      </div>

      <section className="question-header">
        <div className="question-labels">
          <span className="eyebrow">{question.topic}</span>
          <span className="pill">{question.level}</span>
          <span className="pill">{question.stage}</span>
        </div>
        <h1>{pick(question.prompt)}</h1>
        <p className="question-instruction">
          {question.type === "single" ? copy("selectOne") : copy("selectMultiple")}
        </p>
      </section>

      <section className="choice-list" aria-label={copy("question")}>
        {question.choices.map((choice) => {
          const checked = selected.includes(choice.key);
          const answerChoice = question.answer.includes(choice.key);
          const stateClass = submitted
            ? answerChoice
              ? "is-answer"
              : checked
                ? "is-wrong"
                : ""
            : checked
              ? "is-selected"
              : "";
          return (
            <button
              className={`choice-row ${stateClass}`}
              key={choice.key}
              onClick={() => handleChoice(choice.key)}
              type="button"
              aria-pressed={checked}
            >
              <span className="choice-key">{choice.key}</span>
              <span className="choice-label">{pick(choice.label)}</span>
              {submitted && answerChoice ? <Check size={18} /> : null}
            </button>
          );
        })}
      </section>

      {!submitted ? (
        <button className="button button-primary answer-button" onClick={submit} disabled={selected.length === 0}>
          <Check size={17} />
          <span>{copy("checkAnswer")}</span>
        </button>
      ) : (
        <section className={`answer-panel ${isCorrect ? "is-correct" : "is-review"}`}>
          <div className="answer-panel-heading">
            <div>
              <span className="eyebrow">{isCorrect ? copy("correct") : copy("review")}</span>
              <h2>{isCorrect ? copy("correctHeadline") : copy("reviewHeadline")}</h2>
            </div>
            <span className="answer-mark">{isCorrect ? copy("successMark") : copy("reviewMark")}</span>
          </div>
          <div className="answer-copy">
            <strong>{copy("showExplanation")}</strong>
            <p>
              <RichText text={pick(question.explanation)} />
            </p>
          </div>
          <div className="answer-copy">
            <strong>{copy("answer")}</strong>
            <p>{question.answer.join(", ")}</p>
          </div>
          {question.relatedTerms.length > 0 ? (
            <div className="related-terms">
              <strong>{copy("relatedTerms")}</strong>
              <div className="term-chip-list">
                {question.relatedTerms.map((termId) => {
                  const term = termsById.get(termId);
                  return term ? (
                    <Link className="term-chip" key={term.id} to={`/terms/${term.id}`}>
                      {pick(term.title)}
                    </Link>
                  ) : null;
                })}
              </div>
            </div>
          ) : null}
          <div className="answer-actions">
            {nextQuestion ? (
              <Link className="button button-primary" to={`/learn/${nextQuestion.id}`}>
                <span>{copy("nextQuestion")}</span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <Link className="button button-primary" to="/assessment">
                <span>{copy("takeAssessment")}</span>
                <ArrowRight size={17} />
              </Link>
            )}
            <button
              className="button button-secondary"
              onClick={() => {
                setSelected([]);
                setSubmitted(false);
              }}
            >
              <RotateCcw size={16} />
              <span>{copy("tryAgain")}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
