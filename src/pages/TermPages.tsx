import { ArrowLeft, ArrowRight, ChevronLeft, CornerDownRight, Network, Search } from "lucide-react";
import { motion } from "motion/react";
import { ConceptSymbol, conceptTone } from "../components/ConceptSymbol";
import { Suspense, useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { RichText } from "../components/RichText";
import { TermExperienceProvider } from "../content-sdk";
import type { TermNavigationItem } from "../domain/content";
import { textForLocale } from "../domain/content";
import { highlightedTermIds } from "../domain/highlightedTerms";
import { collectPendingTerms } from "../domain/contentGaps";
import { appendTrailNode, type TermNavigationState, type TermTrailNode } from "../domain/navigation";
import { richTextToPlainText } from "../domain/schemas";
import { termDisplayName } from "../domain/termNames";
import { useContent } from "../hooks/useContent";
import { termViews } from "../infrastructure/staticContent";
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
      <div><span className="workspace-icon"><Network size={28}/></span><h1>{uiText(locale, "词条", "Concepts")}</h1></div>
      <span className="library-count">{terms.length} {uiText(locale,"个概念","concepts")}</span>
    </div>
    {highlighted.length > 0 && <section className="concept-collection"><div><h2>{uiText(locale,"精选概念","Featured concepts")}</h2></div><div className="concept-pills">{highlighted.map(id=>{const term=terms.find(t=>t.id===id); const label=termDisplayName(id,term?textForLocale(term.title,locale):id,locale);return term?<Link key={id} to={`/terms/${id}`}>{label}<ArrowRight size={13}/></Link>:<span key={id} className="concept-upcoming">{label}<small>{uiText(locale,"待完善","Upcoming")}</small></span>;})}</div></section>}
    <div className="term-library-toolbar">
      <label className="search-box standalone"><Search size={17} /><input aria-label={uiText(locale, "搜索词条", "Search concepts")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiText(locale, "搜索概念", "Search concepts")} /></label>
      <div className="mode-segment" role="group" aria-label={uiText(locale, "词条状态", "Term status")}>
        <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>{uiText(locale, "全部", "All")}</button>
        <button className={scope === "installed" ? "active" : ""} onClick={() => setScope("installed")}>{uiText(locale, "已完成", "Ready")}</button>
        <button className={scope === "pending" ? "active" : ""} onClick={() => setScope("pending")}>{uiText(locale, "待补", "Pending")}</button>
      </div>
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

export function TermPage({ preview = false }: { preview?: boolean }) {
  const { termId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { terms } = useContent();
  const { locale } = useLocale();
  const term = terms.find((item) => item.id === termId);
  const [sectionState, setSectionState] = useState<{ termId?: string; items: TermNavigationItem[] }>({ items: [] });
  const sections = sectionState.termId === termId ? sectionState.items : [];
  const registerSection = useCallback((section: TermNavigationItem) => {
    setSectionState((current) => {
      const items = current.termId === termId ? current.items : [];
      const existing = items.findIndex((item) => item.id === section.id);
      if (existing < 0) return { termId, items: [...items, section] };
      if (items[existing].title === section.title) return current;
      return { termId, items: items.map((item, index) => index === existing ? section : item) };
    });
  }, [termId]);

  if (!term) return <div className="page"><div className="empty-state"><h2>{uiText(locale, "词条不存在或已被删除", "Term not found or deleted")}</h2><Link to="/terms">{uiText(locale, "返回词条库", "Back to terms")}</Link></div></div>;
  const prerequisites = term.prerequisites.map((id) => ({ id, term: terms.find((item) => item.id === id) }));
  const currentNode: TermTrailNode = { kind: "term", id: term.id, label: textForLocale(term.title, locale), href: `/terms/${term.id}` };
  const trail = appendTrailNode(((location.state as TermNavigationState | null)?.termTrail ?? []).filter((node) => node?.id && node?.href), currentNode);
  const view = termViews.get(term.id);
  if (!view) return <div className="page"><div className="empty-state"><h2>{uiText(locale, "教学包入口缺失", "Teaching package entry is missing")}</h2><p>{uiText(locale, "请重新导入", "Re-import the complete package for")} {term.id}.</p></div></div>;
  const TermBody = view.Component;
  const termState = (target: TermTrailNode) => ({ termTrail: appendTrailNode(trail, target) });
  const previousNode = trail.at(-2);

  return <div className="term-page-layout">
    <article className="term-article">
      <div className="term-page-tools" data-annotation-ignore>
        {!preview && <button className="back-link" onClick={() => previousNode ? navigate(previousNode.href, { state: { termTrail: trail.slice(0, -1) } }) : navigate("/terms")}><ChevronLeft size={17} /> {previousNode ? uiText(locale, "返回", "Back") : uiText(locale, "词条", "Concepts")}</button>}
        <nav className="term-inline-toc" aria-label={uiText(locale, "本页内容", "On this page")}>{sections.map((section, index) => <button type="button" key={section.id} onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{String(index + 1).padStart(2, "0")}</span><RichText text={section.title} terms={terms} linkTerms={false}/></button>)}</nav>
      </div>
      <header className="term-hero">
        
        <h1>{textForLocale(term.title, locale)}</h1>
        <p className="term-summary"><RichText text={term.summary} terms={terms} sourceNode={currentNode} /></p>
        {prerequisites.length > 0 && <div className="prerequisite-row"><b>{uiText(locale, "阅读前置", "Prerequisites")}</b>{prerequisites.map(({ id, term: prerequisite }) => prerequisite ? <Link key={id} to={`/terms/${id}`} state={termState({ kind: "term", id, label: textForLocale(prerequisite.title, locale), href: `/terms/${id}` })}>{textForLocale(prerequisite.title, locale)}</Link> : <span className="prerequisite-pending" key={id}>{termDisplayName(id, term.termDependencies.find((item) => item.id === id)?.title ?? id, locale)} · {uiText(locale, "待导入", "pending")}</span>)}</div>}
      </header>
      <TermExperienceProvider key={term.id} value={{ term, terms, sourceNode: currentNode, sections, registerSection }}><Suspense fallback={<div className="empty-state" role="status">{uiText(locale, "正在加载教学内容…", "Loading teaching content…")}</div>}><TermBody /></Suspense></TermExperienceProvider>
    </article>
    {!preview && <aside className="term-context">
      <div className="trail-heading"><h2>{uiText(locale, "探索路径", "Exploration trail")}</h2></div>
      {previousNode && <Link className="trail-back" to={previousNode.href} state={{ termTrail: trail.slice(0, -1) }}><ArrowLeft size={16} /><span>{uiText(locale, "返回上一节点", "Back to previous node")}<strong>{previousNode.label}</strong></span></Link>}
      <ol className="term-trail">{trail.map((node, index) => { const current = index === trail.length - 1; return <li key={`${node.kind}-${node.id}-${index}`} className={current ? "current" : ""}><span className="trail-marker">{current ? <CornerDownRight size={14} /> : index + 1}</span>{current ? <b>{node.label}</b> : <Link to={node.href} state={{ termTrail: trail.slice(0, index + 1) }}>{node.label}</Link>}<small>{node.kind === "question" ? uiText(locale, "题目", "Question") : current ? uiText(locale, "当前词条", "Current term") : uiText(locale, "词条", "Term")}</small></li>; })}</ol>
    </aside>}
  </div>;
}
