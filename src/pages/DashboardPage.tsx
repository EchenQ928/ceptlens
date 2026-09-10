import { ArrowRight, BookOpen, CheckCircle2, Code2, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProgressRing } from "../components/ProgressRing";
import { library, orderedQuestions, topicCounts } from "../domain/content";
import { useCopy, useLocale } from "../i18n";
import { useProgress } from "../state/progress";

export function DashboardPage() {
  const copy = useCopy();
  const { pick } = useLocale();
  const { progress, isCompleted } = useProgress();
  const completedCount = progress.completedQuestionIds.filter((id) =>
    orderedQuestions.some((question) => question.id === id)
  ).length;
  const completion = (completedCount / orderedQuestions.length) * 100;
  const nextQuestion = orderedQuestions.find((question) => !isCompleted(question.id)) ?? orderedQuestions[0];
  const topics = Object.entries(topicCounts());

  return (
    <div className="page-stack">
      <section className="page-intro dashboard-intro">
        <div>
          <span className="eyebrow">CEPTLENS / LEARNING SYSTEM</span>
          <h1>{copy("overviewTitle")}</h1>
          <p>{copy("overviewDescription")}</p>
        </div>
        <div className="intro-actions">
          <Link className="button button-primary" to={`/learn/${nextQuestion.id}`}>
            <BookOpen size={17} />
            <span>{completedCount > 0 ? copy("continueLearning") : copy("startLearning")}</span>
          </Link>
          <Link className="button button-secondary" to="/terms">
            <Layers3 size={17} />
            <span>{copy("reviewTerms")}</span>
          </Link>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{copy("progress")}</span>
              <h2>{completedCount} / {orderedQuestions.length}</h2>
            </div>
            <ProgressRing value={completion} label={copy("completed")} />
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${completion}%` }} />
          </div>
          <div className="panel-footer-line">
            <span>{library.terms.length} {copy("terms")}</span>
            <span>{orderedQuestions.length} {copy("questionsAvailable")}</span>
          </div>
        </div>

        <div className="panel checkpoint-panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">{copy("recentCheckpoint")}</span>
              <h2>{nextQuestion.id.toUpperCase()}</h2>
            </div>
            <CheckCircle2 size={21} className={isCompleted(nextQuestion.id) ? "icon-success" : "icon-muted"} />
          </div>
          <p className="checkpoint-prompt">{pick(nextQuestion.prompt)}</p>
          <div className="meta-row">
            <span>{nextQuestion.topic}</span>
            <span>{nextQuestion.level}</span>
          </div>
          <Link className="text-link" to={`/learn/${nextQuestion.id}`}>
            <span>{isCompleted(nextQuestion.id) ? copy("review") : copy("next")}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ROADMAP</span>
            <h2>{copy("learningPath")}</h2>
          </div>
          <p>{copy("learningPathDescription")}</p>
        </div>
        <div className="topic-grid">
          {topics.map(([topic, count]) => {
            const topicCompleted = progress.completedQuestionIds.filter((id) =>
              orderedQuestions.some((question) => question.id === id && question.topic === topic)
            ).length;
            return (
              <Link className="topic-row" key={topic} to={`/learn?topic=${encodeURIComponent(topic)}`}>
                <span className="topic-icon">
                  <Sparkles size={16} />
                </span>
                <span className="topic-copy">
                  <strong>{topic}</strong>
                  <small>
                    {topicCompleted} / {count} {copy("questions")}
                  </small>
                </span>
                <ArrowRight size={17} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="split-callout">
        <div>
          <span className="eyebrow">BILINGUAL BY DEFAULT</span>
          <h2>{copy("bilingualContent")}</h2>
          <p>{copy("bilingualDescription")}</p>
        </div>
        <div className="callout-code">library.json<br /><span>en + zh</span></div>
      </section>

      <section className="developer-callout">
        <div className="developer-callout-icon">
          <Code2 size={20} />
        </div>
        <div>
          <h2>{copy("developerTitle")}</h2>
          <p>{copy("developerDescription")}</p>
        </div>
        <Link className="text-link" to="/developers">
          <span>{copy("developerLink")}</span>
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
