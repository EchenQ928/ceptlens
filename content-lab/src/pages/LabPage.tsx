import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useLocation, useMatch, useNavigate, useParams } from "react-router-dom";
import { Download, Upload as UploadIcon, CheckCheck, ArrowLeft } from "lucide-react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { RichText } from "../components/RichText";
import { useContent } from "../hooks/useContent";
import { TermLibraryPage, TermPage } from "./TermPages";
import { describeUpload, labClient, type Upload } from "../infrastructure/labClient";
import { QuestionPreview } from "./QuestionPreview";

export function LabPage() {
  const { terms, questions } = useContent();
  const location = useLocation(); const navigate = useNavigate();
  const term = useMatch("/terms/:termId"); const question = useMatch("/learn/questions/:questionId");
  const id = term?.params.termId ?? question?.params.questionId;
  const kind = question || location.pathname === "/questions" ? "questions" : "terms";
  const items = kind === "terms" ? terms.map(t => ({ id: t.id, title: t.title })) : questions.map(q => ({ id: q.id, title: `${q.ordering.order} · ${q.taxonomy.primaryConcept}` }));
  return <div className="lab-workspace">
    <header className="lab-topbar"><Link className="lab-brand" to="/"><span className="brand-mark"><span /></span><strong>CeptLens <small>内容实验室</small></strong></Link><span className="lab-local">本机草稿 · 不连接正式站</span><a href="/docs/LAB_GUIDE.md" target="_blank" rel="noreferrer">开发指南</a></header>
    <div className="lab-selector"><nav aria-label="内容类型"><Link className={kind === "terms" ? "active" : ""} to="/terms">词条</Link><Link className={kind === "questions" ? "active" : ""} to="/questions">题目</Link></nav><label><span className="sr-only">选择预览内容</span><select value={id ?? ""} onChange={event => navigate(kind === "terms" ? `/terms/${event.target.value}` : `/learn/questions/${event.target.value}`)}><option value="">选择预览内容 · {items.length} 项</option>{items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
    <LabActions kind={kind} selectedId={id} existingTerms={terms.map(t => t.id)} existingQuestions={questions.map(q => q.id)} />
    {id && <details className="lab-path"><summary>编辑位置与缺失词条</summary><p>编辑本实验室目录下的 <code>{kind === "terms" ? `content-libraries/terms/${id}/view.tsx` : `content-libraries/questions/*-${id}.json`}</code>。全部保存后点击“校验与刷新”；ZIP 导入成功后当前页面自动刷新。</p><p>缺失的显式链接会标为“待补词条”，不要求把整个正式词条库复制进来。需要联动预览时，再导入相关教学包。</p><Link to="/terms">查看已导入和待补词条</Link></details>}
    <main className="lab-content"><ErrorBoundary key={location.pathname}><Routes>
      <Route path="/terms/:termId" element={<TermPage />} />
      <Route path="/learn/questions/:questionId" element={<QuestionRoute />} />
      <Route path="/questions" element={<div className="page"><h1>题目草稿</h1>{questions.length ? questions.map(q => <Link className="lab-question-link" key={q.id} to={`/learn/questions/${q.id}`}><RichText text={q.stem} terms={terms} linkTerms={false} /></Link>) : <div className="empty-state">还没有题目。可从上方导入题目 JSON。</div>}</div>} />
      <Route path="*" element={terms.length || questions.length ? <TermLibraryPage /> : <div className="empty-state lab-empty"><h1>开始设计一个词条</h1><p>导入已有教学包，或下载模板后修改。图、公式、代码和交互均可在包内自行设计。</p><p>完成后导出 ZIP，打开正式平台的内容管理，使用管理员提供的口令自行上传。</p></div>} />
    </Routes></ErrorBoundary></main>
  </div>;
}

export function LabActions({ kind, selectedId, existingTerms, existingQuestions, reload = (href?: string) => { if (href) window.location.hash = href; window.location.reload(); } }: { kind: Upload["kind"]; selectedId?: string; existingTerms: string[]; existingQuestions: string[]; reload?: (href?: string) => void }) {
  const [pending, setPending] = useState<Upload | null>(null);
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!pending && !deletePending) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".lab-dialog");
    const buttons = () => [...dialog?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []];
    buttons()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); if (!busy) { setPending(null); setDeletePending(false); } }
      if (event.key === "Tab") {
        const focusable = buttons(); const first = focusable[0]; const last = focusable.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [pending, deletePending, busy]);
  async function run(label: string, operation: () => Promise<void>) { setError(""); setNotice(""); setBusy(label); try { await operation(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); } }
  const existing = pending?.kind === "terms" ? existingTerms : existingQuestions;
  return <section className="lab-actions" aria-label="教学包操作">
    <div className="lab-action-row">
      <button className="primary-button" disabled={!!busy} onClick={() => input.current?.click()}><UploadIcon size={17} />{kind === "terms" ? "导入／替换词条 ZIP" : "导入／替换题目 JSON"}</button>
      <input ref={input} className="sr-only" type="file" aria-label="选择内容包" accept={kind === "terms" ? ".zip" : ".json"} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void run("正在读取包清单…", async () => { setPending(await describeUpload(file, kind)); }); }} />
      <button className="secondary-button" disabled={!!busy} onClick={() => void run("正在校验、测试和构建…", async () => { await labClient.check(); reload(); })}><CheckCheck size={17} />校验与刷新</button>
      <button className="secondary-button" disabled={!!busy || (kind === "terms" ? !selectedId : !existingQuestions.length)} onClick={() => void run("导出前校验、测试和构建…", async () => { await labClient.download(kind === "terms" ? `/api/content/terms/${selectedId}/export` : "/api/content/questions/export", kind === "terms" ? `${selectedId}.term.zip` : "ceptlens-question-library.json"); setNotice("已导出。请到正式平台的内容管理输入口令后上传；实验室不会代为发布。"); })}><Download size={17} />{kind === "terms" ? "导出当前词条" : "导出题目包"}</button>
      <button className="icon-text-button" disabled={!!busy} onClick={() => void run("正在下载模板…", async () => { await labClient.download("/api/content/templates/term", "term-teaching-package-template.zip"); })}>下载词条模板</button>
      {selectedId && <button className="icon-text-button" disabled={!!busy} onClick={() => setDeletePending(true)}>移除本机草稿</button>}
    </div>
    {busy && <div role="status" className="lab-notice">{busy} 请保持实验室终端运行。校验结束前不要编辑包文件。</div>}
    {error && <div role="alert" className="lab-error"><strong>操作未完成</strong><pre>{error}</pre><button className="secondary-button" onClick={() => setError("")}>关闭提示</button></div>}
    {notice && <p role="status" className="lab-notice">{notice}</p>}
    {pending && <div className="lab-dialog-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="import-title" className="lab-dialog"><h2 id="import-title">确认导入到本机实验室</h2><p>{pending.file.name}</p><ul>{pending.items.map(item => <li key={item.id}><strong>{item.title}</strong> <code>{item.id}</code><span>{existing.includes(item.id) ? "将替换本机同 ID 草稿" : "新增草稿"}</span></li>)}</ul><p>替换前请按需导出旧稿备份。此操作不修改正式平台。</p><div className="lab-action-row"><button autoFocus className="secondary-button" disabled={!!busy} onClick={() => setPending(null)}>取消</button><button className="primary-button" disabled={!!busy} onClick={() => void run("正在隔离校验教学包，通过后保存…", async () => { const result = await labClient.import(pending); setPending(null); reload(pending.kind === "terms" ? `/terms/${result.id}` : `/learn/questions/${result.ids[0]}`); })}>确认导入</button></div>{busy && <p role="status">{busy}</p>}{error && <pre role="alert" className="lab-error">{error}</pre>}</section></div>}
    {deletePending && <div className="lab-dialog-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="lab-dialog"><h2 id="delete-title">移除本机草稿 {selectedId}？</h2><p>这会删除本机文件，建议先导出备份。正式平台内容不变。</p><div className="lab-action-row"><button autoFocus className="secondary-button" disabled={!!busy} onClick={() => setDeletePending(false)}>取消</button><button className="danger-button" disabled={!!busy} onClick={() => void run("正在移除并校验…", async () => { await labClient.remove(kind, selectedId!); setDeletePending(false); reload(kind === "terms" ? "/terms" : "/questions"); })}>确认移除</button></div>{error && <pre role="alert">{error}</pre>}</section></div>}
  </section>;
}

function QuestionRoute() { const { questionId } = useParams(); const { questions, terms } = useContent(); const question = questions.find(q => q.id === questionId); return question ? <div className="lab-question"><Link className="back-link" to="/questions"><ArrowLeft size={16} />题目草稿</Link><QuestionPreview key={question.id} question={question} terms={terms} /></div> : <div className="empty-state">没有找到这道题。</div>; }
