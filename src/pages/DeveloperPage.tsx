import { AlertTriangle, CheckCircle2, Download, FileArchive, FileJson2, KeyRound, PackagePlus, Save, Trash2, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import questionChoiceTemplate from "../../content-libraries/templates/question-choice.template.json";
import questionSubjectiveTemplate from "../../content-libraries/templates/question-subjective.template.json";
import { Link } from "react-router-dom";
import { useLearningSession } from "../components/LearningSession";
import { RichText } from "../components/RichText";
import { LiquidSelection } from "../components/LiquidSelection";
import { textForLocale, type TermPackage } from "../domain/content";
import { uiText, useLocale } from "../i18n";
import { toQuestionSource } from "../domain/schemas";
import { useContent } from "../hooks/useContent";
import { contentHostClient, type ContentHostStatus, type ContentRevision } from "../infrastructure/contentHostClient";

type Kind = "question" | "term";

export function DeveloperPage() {
  const { session } = useLearningSession();
  const isDeveloper = session?.authenticated && session.user.role === "developer";
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("question");
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState(() => JSON.stringify(questionChoiceTemplate, null, 2));
  const [token, setToken] = useState(() => sessionStorage.getItem("ceptlens.content-token") ?? "");
  const [hostStatus, setHostStatus] = useState<ContentHostStatus | null>(null);
  const [history, setHistory] = useState<ContentRevision[]>([]);
  const [busy, setBusy] = useState(false);
  const [hostError, setHostError] = useState("");
  const [result, setResult] = useState<{ ok: boolean; messages: string[] } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (result) resultRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" }); }, [result]);
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const items = kind === "question" ? questions : terms;
  const selected = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    const refresh = () => contentHostClient.status().then(value => { setHostStatus(value); setHostError(""); }).catch(() => { setHostStatus(null); setHostError(t("内容服务未连接。请使用 npm run host 启动完整服务；仅运行前端预览无法保存内容。", "The content service is unavailable. Run npm run host; a frontend-only preview cannot save content.")); });
    void refresh(); const timer = window.setInterval(refresh, 5000); return () => window.clearInterval(timer);
  }, [locale]);

  useEffect(() => { void contentHostClient.history().then(setHistory).catch(() => setHistory([])); }, [hostStatus?.contentRevision]);

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
    setResult({ ok: true, messages: [message, t("页面将刷新并载入广播主机上的新内容库。", "The page will reload with the updated content library from the service host.")] });
    window.setTimeout(() => window.location.reload(), 1200);
  }

  async function runMutation(action: () => Promise<{ message?: string }>) {
    if (!hostStatus || hostStatus.publishing || busy) return setResult({ ok: false, messages: [t("内容服务未连接或正在发布，请稍后重试。", "The content service is unavailable or publishing. Try again shortly.")] });
    if (!isDeveloper && !token.trim()) return setResult({ ok: false, messages: [t("请输入广播主机终端显示的内容管理口令。", "Enter the content-management token shown in the service host terminal.")] });
    setBusy(true);
    setResult(null);
    try {
      const outcome = await action();
      reloadAfterPublish(outcome.message ?? t("内容已发布。", "Content published."));
    } catch (error) {
      setResult({ ok: false, messages: [error instanceof Error ? error.message : String(error)] });
    } finally { setBusy(false); }
  }

  async function saveQuestion() {
    try { JSON.parse(editor); } catch (error) { return setResult({ ok: false, messages: [`${t("JSON 解析失败", "JSON parse failed")}: ${error instanceof Error ? error.message : String(error)}`] }); }
    await runMutation(() => contentHostClient.importQuestions(editor, token));
  }

  async function importFile(file?: File) {
    if (!file) return;
    await runMutation(() => kind === "question" ? contentHostClient.importQuestions(file, token) : contentHostClient.importTermPackage(file, token));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove() {
    if (!selected || !window.confirm(`${t("确认从广播主机删除", "Delete")} ${selected.id}? ${t("如果其他题目仍把它设为前置，系统会列出断链并回滚。", "If other questions still use it as a prerequisite, the service will report the broken links and roll back.")}`)) return;
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
  if (!isDeveloper && !token) return <div className="page"><section className="panel developer-access-card"><KeyRound size={32}/><h1>{t("开发者工作台","Developer workspace")}</h1><p>{t("发布内容需要开发者账户。登录后即可上传题目和词条，无需输入内容管理口令。","Sign in with a developer account to publish questions and lessons. No content-management token is needed.")}</p><Link className="primary-button" to={session?.authenticated?"/account":"/sign-in?next=/developer"}>{session?.authenticated?t("查看账户权限","View account access"):t("登录","Sign in")}</Link><details><summary>{t("管理员维护入口","Administrator recovery access")}</summary><label>{t("内容管理口令","Content-management token")}<input type="password" value={token} onChange={e=>rememberToken(e.target.value)}/></label></details></section></div>;
  return <div className="developer-layout">
    <aside className="developer-list">
      <div className="developer-list-head"><h2>{t("内容资产", "Content assets")}</h2><LiquidSelection className="kind-tabs" value={kind} label={t("内容类型", "Content type")}><button disabled={busy} aria-pressed={kind === "question"} className={kind === "question" ? "active" : ""} onClick={() => selectKind("question")}>{t("题目", "Questions")} {questions.length}</button><button disabled={busy} aria-pressed={kind === "term"} className={kind === "term" ? "active" : ""} onClick={() => selectKind("term")}>{t("词条包", "Term packages")} {terms.length}</button></LiquidSelection></div>
      <div className="content-item-list">{items.map((item) => <button key={item.id} className={selectedId === item.id ? "active" : ""} onClick={() => loadItem(item.id)}>{kind === "question" ? <FileJson2 size={15} /> : <FileArchive size={15} />}<span><b>{kind === "question" ? textForLocale(questions.find((question) => question.id === item.id)?.taxonomy.primaryConcept, locale) : textForLocale(terms.find((term) => term.id === item.id)?.title, locale)}</b><small>{item.id}</small></span><i className="content-status published">{kind === "question" ? uiText(locale, "题", "Q") : uiText(locale, "词", "Term")}</i></button>)}</div>
    </aside>
    <section className="developer-main">
      <div className="page-heading compact"><div><h1>{t("内容管理", "Content manager")}</h1><p>{t("管理题目与教学包，查看发布记录。", "Manage questions, teaching packages, and publication history.")}</p></div><a className="secondary-button" href="docs/DEVELOPER_GUIDE.md" download><Download size={16} /> {t("开发指南", "Developer guide")}</a></div>
      <details className="agent-developer-panel"><summary>{t("内容存储与版本记录", "Content storage and revisions")}</summary>
        <p>{t("上传的内容独立保存在服务器中，平台代码更新会保留内容、账户和学习记录。", "Uploaded content is stored independently on the server. Platform updates preserve content, accounts, and learning records.")}</p>
        <p>{t("内容目录", "Content directory")}: <code>{hostStatus?.persistentRoot ?? "—"}</code></p>
        <p>{t("当前版本", "Current revision")}: <code>{hostStatus?.contentRevision ?? "—"}</code></p>
        <ul>{history.slice(0, 10).map(revision => <li key={revision.revision}>
          <time>{new Date(revision.createdAt).toLocaleString(locale)}</time> · {revision.questionCount} {t("题目", "questions")} · {revision.termCount} {t("词条", "terms")}
          {revision.revision === hostStatus?.contentRevision ? <span> · {t("当前", "Current")}</span> : <button className="secondary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={() => {
            if (window.confirm(t("恢复这份内容快照？系统会创建新版本，账户和学习记录保持不变。", "Restore this content snapshot? A new revision will be created; accounts and learning records will be preserved."))) void runMutation(() => contentHostClient.restore(revision.revision, token));
          }}>{t("恢复内容", "Restore content")}</button>}
        </li>)}</ul>
      </details>
      {hostError && <div className="lab-message error" role="alert">{hostError}</div>}{hostStatus?.publishing && <p role="status" className="practice-notice">{t("主机正在发布内容，请等待完成。", "The host is publishing content. Please wait.")}</p>}<section className="host-status-panel"><div><KeyRound size={18} />{isDeveloper ? <span className="account-role">{t("开发者权限已启用","Developer access enabled")}</span> : <label><span>{t("内容管理口令", "Content-management token")}</span><input type="password" value={token} onChange={(event) => rememberToken(event.target.value)} placeholder={t("查看广播主机启动终端", "See the service host terminal")} /></label>}</div><div className="host-metrics"><span>{hostStatus ? t("服务已连接", "Service connected") : t("服务未连接", "Service unavailable")}</span><span><b>{hostStatus?.questionCount ?? questions.length}</b> {t("题目包", "question packages")}</span><span><b>{hostStatus?.termCount ?? terms.length}</b> {t("词条教学包", "term packages")}</span><span className={hostStatus?.missingTermCount ? "warning" : ""}><b>{hostStatus?.missingTermCount ?? "—"}</b> {t("待补词条", "pending terms")}</span></div></section>
      {kind === "question" ? <>
        <div className="developer-toolbar"><button className="secondary-button" onClick={() => { setSelectedId(""); setEditor(JSON.stringify(questionChoiceTemplate, null, 2)); }}><PackagePlus size={16} /> {t("新建选择题", "New multiple-choice question")}</button><button className="secondary-button" onClick={() => { setSelectedId(""); setEditor(JSON.stringify(questionSubjectiveTemplate, null, 2)); }}><PackagePlus size={16} /> {t("新建问答题", "New short-answer question")}</button><button className="secondary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={() => inputRef.current?.click()}><Upload size={16} /> {t("导入题目/题库", "Import questions/library")}</button><input ref={inputRef} type="file" hidden accept="application/json,.json" onChange={(event) => importFile(event.target.files?.[0])} /><a className="secondary-button" href="api/content/questions/export"><Download size={16} /> {t("导出题库", "Export library")}</a><span className="toolbar-spacer" />{selected && <button className="danger-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={remove}><Trash2 size={16} /> {t("删除", "Delete")}</button>}<button className="primary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={saveQuestion}><Save size={16} /> {busy ? t("校验并发布中…", "Checking and publishing…") : t("保存到广播主机", "Save to service host")}</button></div>
        <div className="editor-shell"><div className="editor-title"><FileJson2 size={16} /><span>{selectedId || "question.template.json"}</span><small>{t("词条链接会自动登记", "Term links are registered automatically")}: [[term:id|text]]</small></div><textarea aria-label={t("题目 JSON 编辑器", "Question JSON editor")} disabled={busy} className="json-editor" spellCheck={false} value={editor} onChange={(event) => { setEditor(event.target.value); setResult(null); }} /></div>
        <div className="template-links"><button onClick={() => downloadQuestionTemplate("choice")}>{t("下载选择题模板", "Download multiple-choice template")}</button><button onClick={() => downloadQuestionTemplate("subjective")}>{t("下载问答题模板", "Download short-answer template")}</button></div>
      </> : <>
        <div className="developer-toolbar"><button className="secondary-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={() => inputRef.current?.click()}><Upload size={16} /> {t("导入/更新词条教学包", "Import/update term package")}</button><input ref={inputRef} type="file" hidden accept="application/zip,.zip" onChange={(event) => importFile(event.target.files?.[0])} /><a className="secondary-button" href="api/content/templates/term"><Download size={16} /> {t("下载教学包模板", "Download package template")}</a><a className="secondary-button" href="api/content/terms/export"><Download size={16} /> {t("导出完整词条库", "Export term library")}</a><span className="toolbar-spacer" />{selectedTerm && <><a className="secondary-button" href={`api/content/terms/${selectedTerm.id}/export`}><Download size={16} /> {t("导出当前包", "Export package")}</a><button className="danger-button" disabled={busy || !hostStatus || hostStatus.publishing} onClick={remove}><Trash2 size={16} /> {t("删除", "Delete")}</button></>}</div>
        {selectedTerm ? <section className="term-package-inspector"><div><FileArchive size={34} /><span><b>{textForLocale(selectedTerm.title, locale)}</b><small>{selectedTerm.id} · SDK {selectedTerm.sdkVersion}</small></span></div><p><RichText text={selectedTerm.summary} terms={terms} /></p><h3>{uiText(locale, "精简教学包", "Minimal teaching package")}</h3><ul><li><code>manifest.json</code>：{uiText(locale, "标题、定义、核心结论和可选前置", "title, definition, core conclusion, and optional prerequisites")}</li><li><code>view.tsx</code>：{uiText(locale, "完全自由设计的教学正文、图与交互", "the teaching narrative, visuals, and interactions")}</li><li><code>styles.module.css</code>、<code>assets/</code>、{uiText(locale, "专属组件：确有需要时再添加", "custom components only when needed")}</li><li>{uiText(locale, "自动测试保留在开发源码中；“导出当前包”会生成不含测试文件的运行时 ZIP。", "Tests stay in the development source; exporting a package creates a runtime ZIP without test files.")}</li></ul></section> : <section className="term-package-empty"><FileArchive /><h2>{uiText(locale, "选择已有教学包，或直接导入新的 ZIP", "Select a teaching package or import a new ZIP")}</h2><p>{uiText(locale, "只强制 manifest.json 与 view.tsx；同 ID 表示更新，构建失败时自动保留旧版本。", "Only manifest.json and view.tsx are required; an existing ID updates in place, while failed builds keep the previous version.")}</p></section>}
      </>}
      {result && <div ref={resultRef} role={result.ok ? "status" : "alert"} className={`validation-result ${result.ok ? "success" : "error"}`}><div>{result.ok ? <CheckCircle2 /> : <XCircle />}<strong>{result.ok ? t("发布完成", "Publish complete") : t("发布失败", "Publish failed")}</strong></div><ul>{result.messages.map((message) => <li key={message}>{message}</li>)}</ul></div>}
      <footer className="developer-footer"><span><AlertTriangle size={14} /> {t("词条包包含可执行教学组件，只允许导入经过代码审查的内部包；机械依赖与缺口清单由平台自动生成。", "Term packages contain executable teaching components. Import only reviewed packages; dependency and gap reports are generated automatically.")}</span></footer>
    </section>
  </div>;
}
