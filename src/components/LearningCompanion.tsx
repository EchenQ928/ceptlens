import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageSquare, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useContent } from "../hooks/useContent";
import { textForLocale } from "../domain/content";
import { uiText, useLocale } from "../i18n";
import { anchorRange, indexText, selectionAnchor } from "../domain/textAnchors";
import { learningRequest, type Discussion, type TextReference } from "../infrastructure/learningClient";
import { useLearningSession } from "./LearningSession";
import { SidePanel } from "./SidePanel";
import { AssistantPanel } from "./AssistantPanel";
import { DiscussionPanel } from "./DiscussionPanel";
import { AuthPanel } from "./AuthPanel";

type Panel = "discussions" | "assistant" | "profile" | "auth" | null;
type HighlightsAPI = { registry: Map<string, unknown>; create: new (...ranges: Range[]) => unknown };
function highlightAPI(): HighlightsAPI | null {
  const api = globalThis as unknown as { CSS?: { highlights?: Map<string, unknown> }; Highlight?: new (...ranges: Range[]) => unknown };
  return api.CSS?.highlights && api.Highlight ? { registry: api.CSS.highlights, create: api.Highlight } : null;
}
export function LearningCompanion() {
  const location = useLocation(); const { questions, terms } = useContent();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const { session, error: sessionError, rename, refresh: refreshSession } = useLearningSession();
  const [panel, setPanel] = useState<Panel>(null); const [reference, setReference] = useState<TextReference | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; ref: TextReference } | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]); const [selectedId, setSelectedId] = useState(""); const [error, setError] = useState("");
  const [name, setName] = useState(""); const [profileBusy, setProfileBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); const rangeMap = useRef(new Map<string, Range>());
  const disabled = !!session?.activeExam || location.pathname.startsWith("/exam");
  useEffect(() => { document.documentElement.classList.toggle("companion-open", !!panel); return () => document.documentElement.classList.remove("companion-open"); }, [panel]);
  const page = useMemo(() => {
    const q = questions.find(q => location.pathname === `/learn/questions/${q.id}`);
    if (q) return { resource: `question:${q.id}`, title: textForLocale(q.taxonomy.primaryConcept, locale), selector: ".question-panel" };
    const term = terms.find(t => location.pathname === `/terms/${t.id}`);
    return term ? { resource: `term:${term.id}`, title: textForLocale(term.title, locale), selector: ".term-article" } : null;
  }, [location.pathname, questions, terms, locale]);
  const resource = page?.resource;
  const resourceRef = useRef(resource); resourceRef.current = resource;
  const refresh = useCallback(async () => {
    if (!resource || disabled || !session) return;
    const r = await learningRequest<{ discussions: Discussion[] }>(`discussions?resource=${encodeURIComponent(resource)}`);
    if (resourceRef.current === resource) { setDiscussions(r.discussions); setError(""); }
  }, [resource, disabled, session?.user.id]);
  useEffect(() => { setMenu(null); setPanel(null); setReference(null); setDiscussions([]); setSelectedId(""); setError(""); }, [resource, disabled]);
  useEffect(() => {
    if (!resource || disabled || !session) return;
    let live = true;
    const update = async () => { try { const r = await learningRequest<{ discussions: Discussion[] }>(`discussions?resource=${encodeURIComponent(resource)}`); if (live) { setDiscussions(r.discussions); setError(""); } } catch (e) { if (live) setError(e instanceof Error ? e.message : t("共享讨论暂不可用", "Shared discussions are unavailable")); } };
    void update(); const timer = window.setInterval(update, 5000); return () => { live = false; clearInterval(timer); };
  }, [resource, disabled, session?.user.id]);
  useEffect(() => {
    const openProfile = () => { setName(session?.user.name ?? ""); setPanel("profile"); setMenu(null); };
    window.addEventListener("ceptlens-profile", openProfile); return () => window.removeEventListener("ceptlens-profile", openProfile);
  }, [session?.user.name]);
  useEffect(() => { const openAuth = () => { setPanel("auth"); setMenu(null); }; window.addEventListener("ceptlens-auth", openAuth); return () => window.removeEventListener("ceptlens-auth", openAuth); }, []);
  useEffect(() => {
    if (!page || disabled) return;
    const root = document.querySelector<HTMLElement>(page.selector); if (!root) return;
    const paint = () => {
      const map = new Map<string, Range>(); for (const d of discussions) { const range = anchorRange(root, d.reference); if (range) map.set(d.id, range); }
      rangeMap.current = map; const api = highlightAPI();
      if (api) { api.registry.set("ceptlens-notes", new api.create(...map.values())); api.registry.set("ceptlens-note-active", new api.create(...(map.has(selectedId) ? [map.get(selectedId)!] : []))); }
    };
    paint(); const observer = new MutationObserver(paint); observer.observe(root, { childList: true, subtree: true, characterData: true });
    const select = (e: MouseEvent | KeyboardEvent) => {
      if (menuRef.current?.contains(e.target as Node) || (e.target as HTMLElement)?.closest?.(".learning-drawer")) return;
      const selection = window.getSelection(); const anchor = selectionAnchor(root, selection);
      if (!anchor) { if (e.type !== "contextmenu") setMenu(null); return; }
      if (e.type === "contextmenu") e.preventDefault();
      if (anchor.quote.length > 2400) { setError(t("选区过长，请选择 2400 字以内的一段文本。", "The selection is too long. Choose a passage of 2,400 characters or fewer.")); setMenu(null); return; }
      const rect = selection!.getRangeAt(0).getBoundingClientRect();
      const x = e instanceof MouseEvent && e.type === "contextmenu" ? e.clientX : rect.left;
      const y = e instanceof MouseEvent && e.type === "contextmenu" ? e.clientY : rect.bottom + 8;
      setMenu({ x: Math.max(8, Math.min(x, window.innerWidth - 250)), y: Math.max(8, Math.min(y, window.innerHeight - 65)), ref: { ...anchor, resource: page.resource, title: page.title } });
    };
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,input,textarea,select") || !window.getSelection()?.isCollapsed) return;
      for (const [id, range] of rangeMap.current) if ([...range.getClientRects()].some(r => e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom)) { setSelectedId(id); setPanel("discussions"); setReference(null); break; }
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); else if (e.key.startsWith("Arrow") && e.shiftKey) select(e); };
    const scroll = () => setMenu(null);
    document.addEventListener("mouseup", select); document.addEventListener("contextmenu", select); document.addEventListener("keyup", key); root.addEventListener("click", click); window.addEventListener("scroll", scroll, true);
    return () => { observer.disconnect(); document.removeEventListener("mouseup", select); document.removeEventListener("contextmenu", select); document.removeEventListener("keyup", key); root.removeEventListener("click", click); window.removeEventListener("scroll", scroll, true); const api = highlightAPI(); api?.registry.delete("ceptlens-notes"); api?.registry.delete("ceptlens-note-active"); rangeMap.current.clear(); };
  }, [page, disabled, discussions, selectedId]);
  function locate(d: Discussion) { const root = page && document.querySelector<HTMLElement>(page.selector); const range = root && anchorRange(root, d.reference); if (!range) return false; const element = range.startContainer.parentElement; element?.scrollIntoView({ block: "center", behavior: "smooth" }); if (!highlightAPI()) { const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range); } return true; }
  function open(kind: Panel, ref: TextReference | null = null) {
    const root = page && document.querySelector<HTMLElement>(page.selector);
    if (kind === "discussions") setSelectedId("");
    setPanel(kind); setReference(kind === "assistant" && ref && root ? { ...ref, pageText: indexText(root).text.slice(0, 24000) } : ref);
    setMenu(null); window.getSelection()?.removeAllRanges();
  }
  return <>
    {session?.activeExam && !location.pathname.startsWith("/exam") && <div className="active-exam-banner">{t("考核进行中，批注与助手已禁用。", "An assessment is in progress. Annotations and the assistant are disabled.")}<Link to={`/exam?attempt=${session.activeExam}`}>{t("返回答卷", "Return to paper")}</Link></div>}
    {!disabled && <div className="companion-dock">{page && <button className="discussion-launch" onClick={() => open("discussions")} aria-label={`${t("本页共享讨论", "Shared discussions on this page")} ${discussions.length}`}><MessageSquare size={19} /><span>{t("讨论", "Discuss")}</span><b>{discussions.length}</b></button>}<button className="assistant-launch" onClick={() => open("assistant", page ? { ...page, quote: "", prefix: "", suffix: "", start: 0 } : null)} aria-label={t("打开学习助手", "Open learning assistant")}><Bot size={23} /><span>{t("学习助手", "Assistant")}</span></button></div>}
    {menu && !disabled && <div className="selection-menu" ref={menuRef} role="toolbar" aria-label={t("选区操作", "Selection actions")} style={{ left: menu.x, top: menu.y }} onMouseDown={e => e.preventDefault()}><button onClick={() => open("discussions", menu.ref)}><MessageSquare size={16} /> {t("批注", "Annotate")}</button><button onClick={() => open("assistant", menu.ref)}><Bot size={17} /> {t("问助手", "Ask assistant")}</button></div>}
    {panel === "discussions" && page && !disabled && <SidePanel title={t("共享讨论", "Shared discussions")} subtitle={page.title} close={() => setPanel(null)}>{(error || sessionError) && <p role="alert" className="service-error">{error || sessionError}</p>}<DiscussionPanel key={page.resource} discussions={discussions} reference={reference} selectedId={selectedId} onSelect={setSelectedId} locate={locate} refresh={refresh} saved={() => setReference(null)} /></SidePanel>}
    {panel === "assistant" && !disabled && <SidePanel title={t("学习助手", "Learning assistant")} subtitle={t("解释概念 · 拆解问题 · 继续追问", "Explain concepts · break down problems · ask follow-ups")} close={() => setPanel(null)}><AssistantPanel reference={reference} clearReference={() => setReference(null)} /></SidePanel>}
    {panel === "profile" && <SidePanel title={t("我的讨论身份", "My discussion identity")} close={() => setPanel(null)}><form className="drawer-body identity-form" onSubmit={async e => { e.preventDefault(); setProfileBusy(true); try { await rename(name); setPanel(null); setError(""); } catch (e) { setError(e instanceof Error ? e.message : t("保存失败", "Save failed")); } finally { setProfileBusy(false); } }}><UserRound size={32} /><label>{t("显示名", "Display name")}<input autoFocus value={name} maxLength={40} placeholder={t("让同事知道你是谁", "Help colleagues know who you are")} onChange={e => setName(e.target.value)} /></label><p>{t("登录后可跨设备同步学习进度、答卷和助手记录。", "Sign in to sync progress, papers, and assistant history across devices.")}</p>{(error || sessionError) && <p className="service-error" role="alert">{error || sessionError}</p>}<button className="primary-button" disabled={profileBusy || !name.trim()}>{t("保存显示名", "Save display name")}</button></form></SidePanel>}
    {panel === "auth" && <SidePanel title={t("登录 CeptLens", "Sign in to CeptLens")} close={() => setPanel(null)}><AuthPanel close={() => { setPanel(null); void refreshSession(); }} /></SidePanel>}
  </>;
}
