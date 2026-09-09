import { AlertTriangle, CheckCircle2, Download, FileArchive, FileJson2, KeyRound, PackagePlus, Save, Trash2, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import questionChoiceTemplate from "../../content-libraries/templates/question-choice.template.json";
import questionSubjectiveTemplate from "../../content-libraries/templates/question-subjective.template.json";
import { RichText } from "../components/RichText";
import type { TermPackage } from "../domain/content";
import { toQuestionSource } from "../domain/schemas";
import { useContent } from "../hooks/useContent";
import { contentHostClient, type ContentHostStatus } from "../infrastructure/contentHostClient";

type Kind = "question" | "term";

export function DeveloperPage() {
  const { questions, terms } = useContent();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("question");
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState(() => JSON.stringify(questionChoiceTemplate, null, 2));
  const [token, setToken] = useState(() => sessionStorage.getItem("ceptlens.content-token") ?? "");
  const [hostStatus, setHostStatus] = useState<ContentHostStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [hostError, setHostError] = useState("");
  const [result, setResult] = useState<{ ok: boolean; messages: string[] } | null>(null);
  const items = kind === "question" ? questions : terms;
  const selected = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    const refresh = () => contentHostClient.status().then(value => { setHostStatus(value); setHostError(""); }).catch(() => { setHostStatus(null); setHostError("内容服务未连接。请使用 npm run host 启动完整服务；仅运行前端预览无法保存内容。"); });
    void refresh(); const timer = window.setInterval(refresh, 5000); return () => window.clearInterval(timer);
  }, []);

  function rememberToken(value: string) {
    setToken(value.trim());
    sessionStorage.setItem("ceptlens.content-token", value.trim());
  }

  function selectKind(next: Kind) {
    setKind(next);
    setSelectedId("");
    setResult(null);
    if (next === "question") setEditor(JSON.stringify(questionChoiceTemplate, null, 2));
  }

  function loadItem(id: string) {
    setSelectedId(id);
    if (kind === "question") {
      const item = questions.find((candidate) => candidate.id === id);
      if (item) setEditor(JSON.stringify(toQuestionSource(item), null, 2));
    }
    setResult(null);
  }

  function reloadAfterPublish(message: string) {
    setResult({ ok: true, messages: [message, "页面将刷新并载入广播主机上的新内容库。"] });
    window.setTimeout(() => window.location.reload(), 1200);
  }

  async function runMutation(action: () => Promise<{ message?: string }>) {
    if (!hostStatus || hostStatus.publishing || busy) return setResult({ ok: false, messages: ["内容服务未连接或正在发布，请稍后重试。"] });
    if (!token.trim()) return setResult({ ok: false, messages: ["请输入广播主机终端显示的内容管理口令。"] });
    setBusy(true);
    setResult(null);
    try {
      const outcome = await action();
      reloadAfterPublish(outcome.message ?? "内容已发布。");
    } catch (error) {
      setResult({ ok: false, messages: [error instanceof Error ? error.message : String(error)] });
    } finally { setBusy(false); }
  }

  async function saveQuestion() {
    try { JSON.parse(editor); } catch (error) { return setResult({ ok: false, messages: [`JSON 解析失败：${error instanceof Error ? error.message : String(error)}`] }); }
    await runMutation(() => contentHostClient.importQuestions(editor, token));
  }

  async function importFile(file?: File) {
    if (!file) return;
    await runMutation(() => kind === "question" ? contentHostClient.importQuestions(file, token) : contentHostClient.importTermPackage(file, token));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove() {
    if (!selected || !window.confirm(`确认从广播主机删除 ${selected.id}？如果其他题目仍把它设为前置，系统会列出断链并回滚。`)) return;
    await runMutation(() => contentHostClient.remove(kind === "question" ? "questions" : "terms", selected.id, token));
  }

  function downloadQuestionTemplate(type: "choice" | "subjective") {
    const value = type === "choice" ? questionChoiceTemplate : questionSubjectiveTemplate;
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = type === "choice" ? "question-choice.template.json" : "question-subjective.template.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectedTerm = kind === "term" ? selected as TermPackage | undefined : undefined;
  return <div className="developer-layout">
    <aside className="developer-list">
      <div className="developer-list-head"><p className="eyebrow">PORTABLE CONTENT LIBRARIES</p><h2>内容资产</h2><div className="kind-tabs"><button className={kind === "question" ? "active" : ""} onClick={() => selectKind("question")}>题目 {questions.length}</button><button className={kind === "term" ? "active" : ""} onClick={() => selectKind("term")}>词条包 {terms.length}</button></div></div>
      <div className="content-item-list">{items.map((item) => <button key={item.id} className={selectedId === item.id ? "active" : ""} onClick={() => loadItem(item.id)}>{kind === "question" ? <FileJson2 size={15} /> : <FileArchive size={15} />}<span><b>{kind === "question" ? questions.find((question) => question.id === item.id)?.taxonomy.primaryConcept : terms.find((term) => term.id === item.id)?.title}</b><small>{item.id}</small></span><i className="content-status published">{kind === "question" ? "题" : "词"}</i></button>)}</div>
    </aside>
    <section className="developer-main">
      <div className="page-heading compact"><div><p className="eyebrow">HOST CONTENT WORKBENCH</p><h1>广播主机内容管理</h1><p>题目只填写正文、分类和顺序；词条只强制清单与定制页面两个文件。</p></div><a className="secondary-button" href="docs/DEVELOPER_GUIDE.md" download><Download size={16} /> 开发指南</a></div>
      <details className="agent-developer-panel"><summary>共享数据与 Agent 接入</summary><p>批注、回复、私人助手对话和答卷保存在 <code>service-data/ceptlens.sqlite</code>，不放进题目包或词条包。升级前请停止服务，备份并迁移整个 <code>service-data/</code> 文件夹。</p><p>模型配置放在主机 <code>agent-runtime/config.json</code>，API Key 通过主机环境变量提供，前端不保存密钥。专用提示词、只读工具、MCP 与 Skill 对接入口为 <code>agent-runtime/extension.mjs</code>。</p><a className="secondary-button" href="docs/COLLABORATION_AND_AGENT.md" download><Download size={16} /> 下载接口与部署指南</a></details>
      {hostError && <div className="lab-message error" role="alert">{hostError}</div>}{hostStatus?.publishing && <p role="status" className="practice-notice">主机正在发布内容，请等待完成。</p>}<section className="host-status-panel"><div><KeyRound size={18} /><label><span>内容管理口令</span><input type="password" value={token} onChange={(event) => rememberToken(event.target.value)} placeholder="查看广播主机启动终端" /></label></div><div className="host-metrics"><span>{hostStatus ? "服务已连接" : "服务未连接"}</span><span><b>{hostStatus?.questionCount ?? questions.length}</b> 题目包</span><span><b>{hostStatus?.termCount ?? terms.length}</b> 词条教学包</span><span className={hostStatus?.missingTermCount ? "warning" : ""}><b>{hostStatus?.missingTermCount ?? "—"}</b> 待补词条</span></div></section>
      {kind === "question" ? <>
        <div className="developer-toolbar"><button className="secondary-button" onClick={() => { setSelectedId(""); setEditor(JSON.stringify(questionChoiceTemplate, null, 2)); }}><PackagePlus size={16} /> 新建选择题</button><button className="secondary-button" onClick={() => { setSelectedId(""); setEditor(JSON.stringify(questionSubjectiveTemplate, null, 2)); }}><PackagePlus size={16} /> 新建问答题</button><button className="secondary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={() => inputRef.current?.click()}><Upload size={16} /> 导入题目/题库</button><input ref={inputRef} type="file" hidden accept="application/json,.json" onChange={(event) => importFile(event.target.files?.[0])} /><a className="secondary-button" href="api/content/questions/export"><Download size={16} /> 导出题库</a><span className="toolbar-spacer" />{selected && <button className="danger-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={remove}><Trash2 size={16} /> 删除</button>}<button className="primary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={saveQuestion}><Save size={16} /> {busy ? "校验并发布中…" : "保存到广播主机"}</button></div>
        <div className="editor-shell"><div className="editor-title"><FileJson2 size={16} /><span>{selectedId || "question.template.json"}</span><small>词条链接会自动登记：[[term:id|文本]]</small></div><textarea aria-label="题目 JSON 编辑器" disabled={busy} className="json-editor" spellCheck={false} value={editor} onChange={(event) => { setEditor(event.target.value); setResult(null); }} /></div>
        <div className="template-links"><button onClick={() => downloadQuestionTemplate("choice")}>下载选择题模板</button><button onClick={() => downloadQuestionTemplate("subjective")}>下载问答题模板</button></div>
      </> : <>
        <div className="developer-toolbar"><button className="secondary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={() => inputRef.current?.click()}><Upload size={16} /> 导入/更新词条教学包</button><input ref={inputRef} type="file" hidden accept="application/zip,.zip" onChange={(event) => importFile(event.target.files?.[0])} /><a className="secondary-button" href="api/content/templates/term"><Download size={16} /> 下载教学包模板</a><a className="secondary-button" href="api/content/terms/export"><Download size={16} /> 导出完整词条库</a><span className="toolbar-spacer" />{selectedTerm && <><a className="secondary-button" href={`api/content/terms/${selectedTerm.id}/export`}><Download size={16} /> 导出当前包</a><button className="danger-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={remove}><Trash2 size={16} /> 删除</button></>}</div>
        {selectedTerm ? <section className="term-package-inspector"><div><FileArchive size={34} /><span><b>{selectedTerm.title}</b><small>{selectedTerm.id} · SDK {selectedTerm.sdkVersion}</small></span></div><p><RichText text={selectedTerm.summary} terms={terms} /></p><h3>精简教学包</h3><ul><li><code>manifest.json</code>：标题、定义、核心结论和可选前置</li><li><code>view.tsx</code>：完全自由设计的教学正文、图与交互</li><li><code>styles.module.css</code>、<code>assets/</code>、专属组件：确有需要时再添加</li><li>自动测试保留在开发源码中；“导出当前包”会生成不含测试文件的运行时 ZIP。</li></ul></section> : <section className="term-package-empty"><FileArchive /><h2>选择已有教学包，或直接导入新的 ZIP</h2><p>只强制 manifest.json 与 view.tsx；同 ID 表示更新，构建失败时自动保留旧版本。</p></section>}
      </>}
      {result && <div role={result.ok ? "status" : "alert"} className={`validation-result ${result.ok ? "success" : "error"}`}><div>{result.ok ? <CheckCircle2 /> : <XCircle />}<strong>{result.ok ? "发布完成" : "发布失败"}</strong></div><ul>{result.messages.map((message) => <li key={message}>{message}</li>)}</ul></div>}
      <footer className="developer-footer"><span><AlertTriangle size={14} /> 词条包包含可执行教学组件，只允许导入经过代码审查的内部包；机械依赖与缺口清单由平台自动生成。</span></footer>
    </section>
  </div>;
}
