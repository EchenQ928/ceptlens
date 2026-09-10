import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RichText } from "../components/RichText";
import { termsById, orderedQuestions } from "../domain/content";
import { useCopy, useLocale } from "../i18n";
import { useProgress } from "../state/progress";

export function TermPage() {
  const { termId } = useParams();
  const navigate = useNavigate();
  const copy = useCopy();
  const { pick } = useLocale();
  const { isFavorite, toggleFavorite } = useProgress();
  const term = termId ? termsById.get(termId) : undefined;

  if (!term) {
    return (
      <div className="empty-state">
        <h1>{copy("notFoundTitle")}</h1>
        <p>{copy("notFoundDescription")}</p>
        <Link className="button button-primary" to="/terms">
          {copy("navTerms")}
        </Link>
      </div>
    );
  }

  const relatedQuestions = orderedQuestions.filter((question) => question.relatedTerms.includes(term.id));

  return (
    <div className="page-stack term-page">
      <div className="question-nav">
        <button className="back-link" onClick={() => navigate("/terms")}>
          <ArrowLeft size={16} />
          <span>{copy("navTerms")}</span>
        </button>
        <span className="question-position">{term.topic}</span>
      </div>

      <section className="term-header">
        <div className="term-header-top">
          <span className="eyebrow">{term.id}</span>
          <button
            className={`icon-button favorite-button ${isFavorite(term.id) ? "is-favorite" : ""}`}
            onClick={() => toggleFavorite(term.id)}
            aria-label={isFavorite(term.id) ? copy("removeFavorite") : copy("addFavorite")}
            title={isFavorite(term.id) ? copy("removeFavorite") : copy("addFavorite")}
          >
            <Star size={18} fill={isFavorite(term.id) ? "currentColor" : "none"} />
          </button>
        </div>
        <h1>{pick(term.title)}</h1>
        <p className="term-summary">{pick(term.summary)}</p>
      </section>

      <section className="term-core">
        <span className="eyebrow">{copy("coreIdea")}</span>
        <p>
          <RichText text={pick(term.coreIdea)} />
        </p>
      </section>

      <section className="term-sections">
        {term.sections.map((section) => (
          <article className="term-section" key={section.title.en}>
            <h2>{pick(section.title)}</h2>
            {section.body.map((body, index) => (
              <p key={`${section.title.en}-${index}`}>
                <RichText text={pick(body)} />
              </p>
            ))}
          </article>
        ))}
      </section>

      {relatedQuestions.length > 0 ? (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{copy("relatedTerms")}</span>
              <h2>{copy("question")}</h2>
            </div>
          </div>
          <div className="lesson-list compact-list">
            {relatedQuestions.slice(0, 5).map((question) => (
              <Link className="lesson-row" key={question.id} to={`/learn/${question.id}`}>
                <span className="lesson-number">{String(question.order).padStart(2, "0")}</span>
                <span className="lesson-main">
                  <span className="lesson-meta">
                    <span>{question.topic}</span>
                    <span>{question.level}</span>
                  </span>
                  <strong>{pick(question.prompt)}</strong>
                </span>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
