import { ArrowLeft, ArrowRight, ChevronLeft, CornerDownRight, Network, Search } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { RichText } from "../components/RichText";
import { TermExperienceProvider } from "../content-sdk";
import type { TermNavigationItem } from "../domain/content";
import { collectPendingTerms } from "../domain/contentGaps";
import { appendTrailNode, type TermNavigationState, type TermTrailNode } from "../domain/navigation";
import { richTextToPlainText } from "../domain/schemas";
import { useContent } from "../hooks/useContent";
import { termViews } from "../infrastructure/staticContent";

export function TermLibraryPage() {
  const { terms, questions } = useContent();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "installed" | "pending">("all");
  const normalizedQuery = query.trim().toLowerCase();
  const pendingTerms = collectPendingTerms(questions, terms);
  const installedResults = scope === "pending" ? [] : terms.filter((term) =>
    [term.id, term.title, richTextToPlainText(term.summary), ...term.aliases].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const pendingResults = scope === "installed" ? [] : pendingTerms.filter((term) =>
    [term.id, term.title, ...term.references.flatMap((reference) => [reference.label, reference.reason])].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const hasResults = installedResults.length + pendingResults.length > 0;

  return <div className="page">
    <div className="page-heading compact">
      <div><p className="eyebrow">SHARED KNOWLEDGE</p><h1>共享词条库</h1><p>已完成教学包与待补词条统一编目；待补项不会伪装成空白词条页。</p></div>
      <div className="term-library-metrics"><span><strong>{terms.length + pendingTerms.length}</strong>全部词条</span><span><strong>{terms.length}</strong>已完成</span><span className="pending"><strong>{pendingTerms.length}</strong>待补</span></div>
    </div>
    <div className="term-library-toolbar">
      <label className="search-box standalone"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索词条、ID、来源题目或补充原因" /></label>
      <div className="mode-segment" role="group" aria-label="词条状态">
        <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>全部</button>
        <button className={scope === "installed" ? "active" : ""} onClick={() => setScope("installed")}>已完成</button>
        <button className={scope === "pending" ? "active" : ""} onClick={() => setScope("pending")}>待补</button>
      </div>
    </div>
    <div className="term-grid">
      {installedResults.map((term) => <Link className="term-card" key={term.id} to={`/terms/${term.id}`}>
        <span className="content-status published">教学包</span><h2>{term.title}</h2><p>{richTextToPlainText(term.summary)}</p><div><span>定制教学页面</span><ArrowRight size={16} /></div>
      </Link>)}
      {pendingResults.map((term) => <article className="term-card pending-term-card" key={term.id}>
        <span className="content-status pending">待补教学包</span><h2>{term.title}</h2><code>{term.id}</code><p>{term.references[0]?.reason}</p><div><span>{term.questionCount ? `${term.questionCount} 道题` : ""}{term.questionCount && term.termCount ? " · " : ""}{term.termCount ? `${term.termCount} 个词条` : ""}引用</span><span>未开放</span></div>
      </article>)}
    </div>
    {!hasResults && <div className="empty-state"><Network /><h3>没有匹配的词条</h3></div>}
    <div className="coverage-line">目录共 {terms.length + pendingTerms.length} 项：{terms.length} 个教学包可进入，{pendingTerms.length} 个待按词条设计规范补齐。</div>
  </div>;
}

export function TermPage({ preview = false }: { preview?: boolean }) {
  const { termId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { terms } = useContent();
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

  if (!term) return <div className="page"><div className="empty-state"><h2>词条不存在或已被删除</h2><Link to="/terms">返回词条库</Link></div></div>;
  const prerequisites = term.prerequisites.map((id) => ({ id, term: terms.find((item) => item.id === id) }));
  const currentNode: TermTrailNode = { kind: "term", id: term.id, label: term.title, href: `/terms/${term.id}` };
  const trail = appendTrailNode(((location.state as TermNavigationState | null)?.termTrail ?? []).filter((node) => node?.id && node?.href), currentNode);
  const view = termViews.get(term.id);
  if (!view) return <div className="page"><div className="empty-state"><h2>教学包入口缺失</h2><p>请重新导入 {term.id} 的完整教学包。</p></div></div>;
  const TermBody = view.Component;
  const termState = (target: TermTrailNode) => ({ termTrail: appendTrailNode(trail, target) });
  const previousNode = trail.at(-2);

  return <div className="term-page-layout">
    <article className="term-article">
      <div className="term-page-tools" data-annotation-ignore>
        {!preview && <button className="back-link" onClick={() => previousNode ? navigate(previousNode.href, { state: { termTrail: trail.slice(0, -1) } }) : navigate("/terms")}><ChevronLeft size={17} /> {previousNode ? "返回上一节点" : "返回词条库"}</button>}
        <nav className="term-inline-toc" aria-label="本页内容">{sections.map((section, index) => <button type="button" key={section.id} onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</button>)}</nav>
      </div>
      <header className="term-hero">
        {!preview && <div className="term-hero-meta"><span className="content-status published">定制教学包</span><span>{term.id}</span><span>SDK {term.sdkVersion}</span></div>}
        <h1>{term.title}</h1>
        <p className="term-summary"><RichText text={term.summary} terms={terms} sourceNode={currentNode} /></p>
        {prerequisites.length > 0 && <div className="prerequisite-row"><b>阅读前置</b>{prerequisites.map(({ id, term: prerequisite }) => prerequisite ? <Link key={id} to={`/terms/${id}`} state={termState({ kind: "term", id, label: prerequisite.title, href: `/terms/${id}` })}>{prerequisite.title}</Link> : <span className="prerequisite-pending" key={id}>{term.termDependencies.find((item) => item.id === id)?.title ?? id} · 待导入</span>)}</div>}
      </header>
      <TermExperienceProvider key={term.id} value={{ term, terms, sourceNode: currentNode, sections, registerSection }}><Suspense fallback={<div className="empty-state" role="status">正在加载教学内容…</div>}><TermBody /></Suspense></TermExperienceProvider>
    </article>
    {!preview && <aside className="term-context">
      <div className="trail-heading"><span className="eyebrow">EXPLORATION TRAIL</span><h2>探索路径</h2><p>这里记录你从题目或上一个概念走到当前词条的路径。</p></div>
      {previousNode && <Link className="trail-back" to={previousNode.href} state={{ termTrail: trail.slice(0, -1) }}><ArrowLeft size={16} /><span>返回上一节点<strong>{previousNode.label}</strong></span></Link>}
      <ol className="term-trail">{trail.map((node, index) => { const current = index === trail.length - 1; return <li key={`${node.kind}-${node.id}-${index}`} className={current ? "current" : ""}><span className="trail-marker">{current ? <CornerDownRight size={14} /> : index + 1}</span>{current ? <b>{node.label}</b> : <Link to={node.href} state={{ termTrail: trail.slice(0, index + 1) }}>{node.label}</Link>}<small>{node.kind === "question" ? "题目" : current ? "当前词条" : "词条"}</small></li>; })}</ol>
    </aside>}
  </div>;
}
