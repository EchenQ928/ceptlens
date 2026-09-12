import { ArrowRight, Search, Network } from "lucide-react";
import { motion } from "motion/react";
import { ConceptSymbol, conceptTone } from "../components/ConceptSymbol";
import { ProductIcon } from "../components/ProductIcon";
import { LiquidSelection } from '../components/LiquidSelection';
import { useState } from "react";
import { Link } from "react-router-dom";
import { textForLocale } from "../domain/content";
import { highlightedTermIds } from "../domain/highlightedTerms";
import { collectPendingTerms } from "../domain/contentGaps";
import { richTextToPlainText } from "../domain/schemas";
import { termDisplayName } from "../domain/termNames";
import { useContent } from "../hooks/useContent";
import { useLocale, uiText } from "../i18n";

export function TermLibraryPage() {
  const { terms, questions } = useContent();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "installed" | "pending">("installed");
  const normalizedQuery = query.trim().toLowerCase();
  const pendingTerms = collectPendingTerms(questions, terms, locale);
  const highlighted = highlightedTermIds(questions).filter(id => terms.some(term => term.id === id));
  const installedResults = scope === "pending" ? [] : terms.filter((term) =>
    [term.id, textForLocale(term.title, locale), richTextToPlainText(term.summary, locale), ...term.aliases.map(alias => textForLocale(alias, locale))].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const pendingResults = scope === "installed" ? [] : pendingTerms.filter((term) =>
    [term.id, term.title, ...term.references.flatMap((reference) => [reference.label, reference.reason])].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const hasResults = installedResults.length + pendingResults.length > 0;

  return <div className="page concepts-page">
    <div className="page-heading compact">
      <div><span className="workspace-icon"><ProductIcon kind="concepts"/></span><h1>{uiText(locale, "词条", "Concepts")}</h1></div>
      <span className="library-count">{terms.length} {uiText(locale,"个概念","concepts")}</span>
    </div>
    {highlighted.length > 0 && <section className="concept-collection"><div><h2>{uiText(locale,"精选概念","Featured concepts")}</h2></div><div className="concept-pills">{highlighted.map(id=>{const term=terms.find(t=>t.id===id); const label=termDisplayName(id,term?textForLocale(term.title,locale):id,locale);return term?<Link key={id} to={`/terms/${id}`}>{label}<ArrowRight size={13}/></Link>:<span key={id} className="concept-upcoming">{label}<small>{uiText(locale,"待完善","Upcoming")}</small></span>;})}</div></section>}
    <div className="term-library-toolbar">
      <label className="search-box standalone"><Search size={17} /><input aria-label={uiText(locale, "搜索词条", "Search concepts")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiText(locale, "搜索概念", "Search concepts")} /></label>
      <LiquidSelection className="mode-segment" value={scope+locale} label={uiText(locale, "词条状态", "Term status")}>
        <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>{uiText(locale, "全部", "All")}</button>
        <button className={scope === "installed" ? "active" : ""} onClick={() => setScope("installed")}>{uiText(locale, "已完成", "Ready")}</button>
        <button className={scope === "pending" ? "active" : ""} onClick={() => setScope("pending")}>{uiText(locale, "待补", "Pending")}</button>
      </LiquidSelection>
    </div>
    <div className="term-grid">
      {installedResults.map((term, index) => <motion.div key={term.id} className={`concept-card-wrap tone-${conceptTone(term.id)}`} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: .4, delay: Math.min(index % 3 * .06, .12) }}><Link className="term-card" to={`/terms/${term.id}`}><ConceptSymbol id={term.id}/><h2>{textForLocale(term.title, locale)}</h2><p>{richTextToPlainText(term.summary, locale)}</p><ArrowRight className="concept-arrow" size={21}/></Link></motion.div>)}
      {pendingResults.map((term) => <article className="term-card pending-term-card" key={term.id}>
        <span className="content-status pending">{uiText(locale, "待补教学包", "Package pending")}</span><h2>{term.title}</h2><code>{term.id}</code><p>{term.references[0]?.reason}</p><div><span>{term.questionCount ? `${term.questionCount} ${uiText(locale, "道题", "questions")}` : ""}{term.questionCount && term.termCount ? " · " : ""}{term.termCount ? `${term.termCount} ${uiText(locale, "个词条", "terms")}` : ""}{uiText(locale, "引用", " cited")}</span><span>{uiText(locale, "未开放", "Unavailable")}</span></div>
      </article>)}
    </div>
    {!hasResults && <div className="empty-state"><Network /><h3>{uiText(locale, "没有匹配的词条", "No matching terms")}</h3></div>}
  </div>;
}

export { TermPage } from './TermReader';
