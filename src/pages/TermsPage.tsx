import { ArrowRight, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { library } from "../domain/content";
import { useCopy, useLocale } from "../i18n";
import { useProgress } from "../state/progress";

export function TermsPage() {
  const copy = useCopy();
  const { pick } = useLocale();
  const { isFavorite } = useProgress();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const topics = [...new Set(library.terms.map((term) => term.topic))];
  const terms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return library.terms.filter((term) => {
      const matchesTopic = topic === "all" || term.topic === topic;
      const searchable = [term.title.en, term.title.zh, term.summary.en, term.summary.zh].join(" ").toLowerCase();
      return matchesTopic && (!normalized || searchable.includes(normalized));
    });
  }, [query, topic]);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <span className="eyebrow">REFERENCE</span>
          <h1>{copy("navTerms")}</h1>
          <p>{copy("bilingualDescription")}</p>
        </div>
        <div className="intro-stat">
          <strong>{terms.length}</strong>
          <span>{copy("terms")}</span>
        </div>
      </section>

      <section className="term-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy("searchTerms")}
            aria-label={copy("searchTerms")}
          />
        </label>
        <select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label={copy("topic")}>
          <option value="all">{copy("allTopics")}</option>
          {topics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      {terms.length > 0 ? (
        <section className="term-list">
          {terms.map((term) => (
            <Link className="term-row" key={term.id} to={`/terms/${term.id}`}>
              <span className="term-row-main">
                <span className="lesson-meta">
                  <span>{term.topic}</span>
                  {isFavorite(term.id) ? (
                    <span className="favorite-label">
                      <Star size={13} fill="currentColor" />
                    </span>
                  ) : null}
                </span>
                <strong>{pick(term.title)}</strong>
                <span>{pick(term.summary)}</span>
              </span>
              <ArrowRight size={17} />
            </Link>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h2>{copy("noResults")}</h2>
        </div>
      )}
    </div>
  );
}
