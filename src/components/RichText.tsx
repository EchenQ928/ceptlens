import katex from "katex";
import { Fragment, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { textForLocale, type RichText, type TermPackage } from "../domain/content";
import { buildTermTrail, type TermNavigationState, type TermTrailNode } from "../domain/navigation";
import { useLocale } from "../i18n";

const tokenPattern = /(\[\[term:[a-zA-Z0-9][a-zA-Z0-9._-]*\|[^\]]+\]\]|\$[^$\n]+\$|\*\*[^*]+\*\*)/g;
const termTokenPattern = /^\[\[term:([a-zA-Z0-9][a-zA-Z0-9._-]*)\|([^\]]+)\]\]$/;

/** Preserve authored line and paragraph breaks without applying whitespace rules to KaTeX. */
function renderPlainText(text: string): ReactNode[] {
  return text.split(/\r\n|\r|\n/).map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>);
}

function renderTokens(text: string, terms: TermPackage[], trail: TermTrailNode[], sourceNode?: TermTrailNode, keyPrefix = "rich", linkTerms = true, locale: "zh-CN" | "en-US" = "zh-CN"): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  [...text.matchAll(tokenPattern)].forEach((match, index) => {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(<Fragment key={`${keyPrefix}-plain-${index}`}>{renderPlainText(text.slice(cursor, start))}</Fragment>);
    const token = match[0];
    const termToken = token.match(termTokenPattern);
    if (termToken) {
      const [, termId, label] = termToken;
      const term = terms.find((candidate) => candidate.id === termId);
      if (!linkTerms) {
        nodes.push(<Fragment key={`${keyPrefix}-unlinked-${index}`}>{label}</Fragment>);
      } else if (term && term.id !== sourceNode?.id) {
        const targetNode: TermTrailNode = { kind: "term", id: term.id, label: textForLocale(term.title, locale), href: `/terms/${term.id}` };
        nodes.push(<Link key={`${keyPrefix}-term-${index}`} className="term-link" to={targetNode.href} state={{ termTrail: buildTermTrail(trail, sourceNode, targetNode) }}>{label}</Link>);
      } else if (term) {
        nodes.push(<Fragment key={`${keyPrefix}-self-${index}`}>{label}</Fragment>);
      } else {
        nodes.push(<span key={`${keyPrefix}-pending-${index}`} className="term-link-pending" title={locale === "en-US" ? `Teaching package pending: ${termId}` : `待导入教学包：${termId}`}>{label}<small>{locale === "en-US" ? "Package pending" : "待补词条"}</small></span>);
      }
    } else if (token.startsWith("$")) {
      const html = katex.renderToString(token.slice(1, -1), { throwOnError: false, strict: "ignore" });
      nodes.push(<span key={`${keyPrefix}-math-${index}`} className="inline-math" dangerouslySetInnerHTML={{ __html: html }} />);
    } else {
      nodes.push(<strong key={`${keyPrefix}-bold-${index}`}>{renderTokens(token.slice(2, -2), terms, trail, sourceNode, `${keyPrefix}-bold-${index}`, linkTerms, locale)}</strong>);
    }
    cursor = start + token.length;
  });
  if (cursor < text.length) nodes.push(<Fragment key={`${keyPrefix}-tail`}>{renderPlainText(text.slice(cursor))}</Fragment>);
  return nodes;
}

/** Only [[term:id|display text]] becomes a term link. Plain word matches are intentionally ignored. */
export function RichText({ text, terms, className, sourceNode, linkTerms = true }: { text: RichText; terms: TermPackage[]; className?: string; sourceNode?: TermTrailNode; linkTerms?: boolean }) {
  const location = useLocation();
  const { locale } = useLocale();
  const trail = ((location.state as TermNavigationState | null)?.termTrail ?? []).filter((node) => node?.id && node?.href);
  const source = textForLocale(text, locale);
  const nodes = renderTokens(source, terms, trail, sourceNode, "rich", linkTerms, locale);
  return <span className={className}>{nodes.length ? nodes : source}</span>;
}
