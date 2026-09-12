import { ArrowRight, Search, Network } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LiquidSelection } from '../components/LiquidSelection';
import { ConceptSymbol } from '../components/ConceptSymbol';
import { textForLocale } from "../domain/content";
import { collectPendingTerms } from "../domain/contentGaps";
import { richTextToPlainText } from "../domain/schemas";
import { useContent } from "../hooks/useContent";
import { uiText, useLocale } from "../i18n";

export function TermLibraryPage() {
  const { terms, questions } = useContent();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "installed" | "pending">(terms.length ? "installed" : "all");
  const normalizedQuery = query.trim().toLowerCase();
  const pendingTerms = collectPendingTerms(questions, terms, locale);
  const installedResults = scope === "pending" ? [] : terms.filter((term) =>
    [term.id, textForLocale(term.title, locale), richTextToPlainText(term.summary, locale), ...term.aliases.map((alias) => textForLocale(alias, locale))].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const pendingResults = scope === "installed" ? [] : pendingTerms.filter((term) =>
    [term.id, term.title, ...term.references.flatMap((reference) => [reference.label, reference.reason])].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const hasResults = installedResults.length + pendingResults.length > 0;

  return <div className="page">
    <div className="page-heading compact">
      <div><h1>{uiText(locale, "词条草稿", "Term drafts")}</h1><p>{terms.length} {uiText(locale, "个本机教学包", "local teaching packages")}</p></div>
      <div className="term-library-metrics"><span><strong>{terms.length + pendingTerms.length}</strong>{uiText(locale, "全部词条", " total")}</span><span><strong>{terms.length}</strong>{uiText(locale, "已导入", " installed")}</span><span className="pending"><strong>{pendingTerms.length}</strong>{uiText(locale, "待补", " pending")}</span></div>
    </div>
    <div className="term-library-toolbar">
      <label className="search-box standalone"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiText(locale, "搜索词条、ID、来源题目或补充原因", "Search terms, IDs, source questions, or reasons")} /></label>
      <LiquidSelection className="mode-segment" value={scope} label={uiText(locale, "词条状态", "Term status")}>
        <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>{uiText(locale, "全部", "All")}</button>
        <button className={scope === "installed" ? "active" : ""} onClick={() => setScope("installed")}>{uiText(locale, "已导入", "Installed")}</button>
        <button className={scope === "pending" ? "active" : ""} onClick={() => setScope("pending")}>{uiText(locale, "待补", "Pending")}</button>
      </LiquidSelection>
    </div>
    <div className="term-grid">
      {installedResults.map((term) => <Link className="term-card" key={term.id} to={`/terms/${term.id}`}>
        <ConceptSymbol id={term.id}/>
        <span className="content-status pending">{uiText(locale, "本机草稿 · 待审查", "Local draft · pending review")}</span><h2>{textForLocale(term.title, locale)}</h2><p>{richTextToPlainText(term.summary, locale)}</p><div><span>{uiText(locale, "定制教学页面", "Custom teaching page")}</span><ArrowRight size={16} /></div>
      </Link>)}
      {pendingResults.map((term) => <article className="term-card pending-term-card" key={term.id}>
        <span className="content-status pending">{uiText(locale, "待补教学包", "Package pending")}</span><h2>{term.title}</h2><code>{term.id}</code><p>{term.references[0]?.reason}</p><div><span>{term.questionCount ? `${term.questionCount} ${uiText(locale, "道题", "questions")}` : ""}{term.questionCount && term.termCount ? " · " : ""}{term.termCount ? `${term.termCount} ${uiText(locale, "个词条", "terms")}` : ""} {uiText(locale, "引用", "referencing")}</span><span>{uiText(locale, "未开放", "Unavailable")}</span></div>
      </article>)}
    </div>
    {!hasResults && <div className="empty-state"><Network /><h3>{uiText(locale, "没有匹配的词条", "No matching terms")}</h3></div>}
    <div className="coverage-line">{uiText(locale, `目录共 ${terms.length + pendingTerms.length} 项：${terms.length} 个教学包可进入，${pendingTerms.length} 个待按词条设计规范补齐。`, `${terms.length + pendingTerms.length} terms in the catalog: ${terms.length} packages are available and ${pendingTerms.length} are pending.`)}</div>
  </div>;
}

export { TermPage } from './TermReader';
