import katex from "katex";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TermNavigationItem, TermPackage, TermViewDefinition } from "../domain/content";
import type { TermTrailNode } from "../domain/navigation";
import { RichText } from "../components/RichText";
import { highlightCode } from "./codeHighlight";
import "./codeHighlight.css";
export { CuratedVisual, VisualFrame, type CuratedVisualName } from "./curatedVisuals";

export interface TermExperienceContextValue {
  term: TermPackage;
  terms: TermPackage[];
  sourceNode: TermTrailNode;
  sections: TermNavigationItem[];
  registerSection: (section: TermNavigationItem) => void;
}

const TermExperienceContext = createContext<TermExperienceContextValue | null>(null);

export function TermExperienceProvider({ value, children }: { value: TermExperienceContextValue; children: ReactNode }) {
  return <TermExperienceContext.Provider value={value}>{children}</TermExperienceContext.Provider>;
}

function useTermExperience() {
  const value = useContext(TermExperienceContext);
  if (!value) throw new Error("定制词条必须在 TermExperienceProvider 内渲染");
  return value;
}

export function defineTermView(definition: TermViewDefinition): TermViewDefinition {
  return definition;
}

export function TermText({ children, className }: { children: string; className?: string }) {
  const { terms, sourceNode } = useTermExperience();
  return <RichText text={children} terms={terms} sourceNode={sourceNode} className={className} />;
}

export function TermSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { sections, registerSection } = useTermExperience();
  useEffect(() => registerSection({ id, title }), [id, title, registerSection]);
  const position = sections.findIndex((item) => item.id === id);
  const index = position >= 0 ? position + 1 : sections.length + 1;
  return <section className="term-section" id={id}><div className="section-index">{String(index).padStart(2, "0")}</div><div className="section-body"><h2><TermText>{title}</TermText></h2>{children}</div></section>;
}

export function Paragraph({ children }: { children: string }) {
  return <p><TermText>{children}</TermText></p>;
}

export function Callout({ tone, title, children }: { tone: "key" | "note" | "boundary"; title: string; children: string }) {
  return <aside className={`callout ${tone}`}><strong><TermText>{title}</TermText></strong><p><TermText>{children}</TermText></p></aside>;
}

export function Flow({ title, steps }: { title?: string; steps: Array<{ label: string; detail: string }> }) {
  return <div className="flow-block">{title && <h3><TermText>{title}</TermText></h3>}<div className="flow-steps">{steps.map((step, index) => <div className="flow-step" key={step.label}><span>{index + 1}</span><div><b><TermText>{step.label}</TermText></b><p><TermText>{step.detail}</TermText></p></div></div>)}</div></div>;
}

export function Formula({ expression, caption, symbols }: { expression: string; caption?: string; symbols: Array<{ symbol: string; meaning: string }> }) {
  const html = useMemo(() => katex.renderToString(expression, { displayMode: true, throwOnError: false, strict: "ignore" }), [expression]);
  return <div className="formula-block"><div className="formula-expression" dangerouslySetInnerHTML={{ __html: html }} />{caption && <p><TermText>{caption}</TermText></p>}<dl>{symbols.map(({ symbol, meaning }) => <div key={symbol}><dt dangerouslySetInnerHTML={{ __html: katex.renderToString(symbol, { throwOnError: false, strict: "ignore" }) }} /><dd><TermText>{meaning}</TermText></dd></div>)}</dl></div>;
}

export function Comparison({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <div className="table-scroll"><table className="comparison-table"><thead><tr>{columns.map((column) => <th key={column}><TermText>{column}</TermText></th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}><TermText>{cell}</TermText></td>)}</tr>)}</tbody></table></div>;
}

export function CodeBlock({ language, code, caption }: { language: string; code: string; caption?: string }) {
  const highlighted = useMemo(() => highlightCode(code, language), [code, language]);
  return <figure className="code-block"><div className="code-language">{language.trim().toLowerCase() === "python" ? "Python" : language}</div><pre>{highlighted === null ? <code>{code}</code> : <code dangerouslySetInnerHTML={{ __html: highlighted }} />}</pre>{caption && <figcaption>{caption}</figcaption>}</figure>;
}

export function EngineeringBoundaries({ items }: { items: string[] }) {
  return <TermSection id="engineering-boundaries" title="工程边界"><ul>{items.map((item) => <li key={item}><TermText>{item}</TermText></li>)}</ul></TermSection>;
}

/** A package-local teaching view may reuse this reviewed explorer or provide its own component. */
export function DepthwiseConvolutionExplorer() {
  const input = [
    [[1, 2, 0], [0, 1, 2], [2, 1, 1]],
    [[0, 1, 2], [2, 1, 0], [1, 0, 1]]
  ];
  const kernels = [
    [[1, 0], [0, 1]],
    [[0, 1], [1, 0]]
  ];
  const [channel, setChannel] = useState(0);
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const [row, col] = cell;
  const values = [input[channel][row][col], input[channel][row][col + 1], input[channel][row + 1][col], input[channel][row + 1][col + 1]];
  const weights = kernels[channel].flat();
  const result = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  return <div className="depthwise-explorer"><div className="explorer-toolbar" role="group" aria-label="输入通道">{[0, 1].map((index) => <button key={index} className={channel === index ? "active" : ""} onClick={() => { setChannel(index); setCell([0, 0]); }}>通道 {index + 1}</button>)}</div><div className="tensor-story"><div className="tensor-panel"><b>输入通道 {channel + 1}</b><div className="matrix input-matrix">{input[channel].flatMap((line, r) => line.map((value, c) => <span key={`${r}-${c}`} className={r >= row && r <= row + 1 && c >= col && c <= col + 1 ? "highlight" : ""}>{value}</span>))}</div></div><span className="operator">×</span><div className="tensor-panel"><b>本通道自己的卷积核</b><div className="matrix kernel-matrix">{kernels[channel].flat().map((value, index) => <span key={index}>{value}</span>)}</div></div><span className="operator">→</span><div className="tensor-panel"><b>输出通道 {channel + 1}</b><div className="matrix output-matrix">{[[0, 0], [0, 1], [1, 0], [1, 1]].map(([r, c]) => { const patch = [input[channel][r][c], input[channel][r][c + 1], input[channel][r + 1][c], input[channel][r + 1][c + 1]]; const output = patch.reduce((sum, value, index) => sum + value * weights[index], 0); return <button key={`${r}-${c}`} className={row === r && col === c ? "selected" : ""} onClick={() => setCell([r, c])}>{output}</button>; })}</div></div></div><p className="calculation-line">选中的输出元素 = {values.map((value, index) => `${value}×${weights[index]}`).join(" + ")} = <strong>{result}</strong></p><p className="explorer-conclusion">通道 {channel + 1} 只读取输入通道 {channel + 1}，并使用自己的卷积核；这里没有发生通道间混合。</p></div>;
}
