import { ArrowRight, CheckCircle2, Circle, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { orderedQuestions } from "../domain/content";
import { useCopy, useLocale } from "../i18n";
import { useProgress } from "../state/progress";

export function LearnPage() {
  const copy = useCopy();
  const { pick } = useLocale();
  const { isCompleted } = useProgress();
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "all");
  const [level, setLevel] = useState("all");
  const topics = [...new Set(orderedQuestions.map((question) => question.topic))];
  const levels = ["Foundation", "Working Knowledge", "Deep Dive"];

  const filteredQuestions = useMemo(
    () =>
      orderedQuestions.filter(
        (question) =>
          (topic === "all" || question.topic === topic) &&
          (level === "all" || question.level === level)
      ),
    [level, topic]
  );

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <span className="eyebrow">LEARNING PATH</span>
          <h1>{copy("navLearn")}</h1>
          <p>{copy("learningPathDescription")}</p>
        </div>
        <div className="intro-stat">
          <strong>{filteredQuestions.length}</strong>
          <span>{copy("questionsAvailable")}</span>
        </div>
      </section>

      <section className="filter-bar" aria-label="Learning filters">
        <div className="filter-label">
          <Filter size={16} />
          <span>{copy("topic")}</span>
        </div>
        <select value={topic} onChange={(event) => setTopic(event.target.value)}>
          <option value="all">{copy("allTopics")}</option>
          {topics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="all">{copy("allLevels")}</option>
          {levels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      <section className="lesson-list" aria-label={copy("navLearn")}>
        {filteredQuestions.map((question) => (
          <Link className="lesson-row" key={question.id} to={`/learn/${question.id}`}>
            <span className="lesson-number">{String(question.order).padStart(2, "0")}</span>
            <span className="lesson-main">
              <span className="lesson-meta">
                <span>{question.topic}</span>
                <span>{question.level}</span>
              </span>
              <strong>{pick(question.prompt)}</strong>
            </span>
            <span className={`lesson-status ${isCompleted(question.id) ? "is-complete" : ""}`}>
              {isCompleted(question.id) ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
