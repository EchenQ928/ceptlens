import { ArrowLeft, ChevronLeft, CornerDownRight } from 'lucide-react';
import { Suspense, useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { RichText } from '../components/RichText';
import { TermExperienceProvider } from '../content-sdk';
import { textForLocale, type TermNavigationItem } from '../domain/content';
import { appendTrailNode, type TermNavigationState, type TermTrailNode } from '../domain/navigation';
import { termDisplayName } from '../domain/termNames';
import { useContent } from '../hooks/useContent';
import { termViews } from '../infrastructure/staticContent';
import { useLocale, uiText } from '../i18n';
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
