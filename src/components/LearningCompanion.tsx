import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageSquare, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useContent } from "../hooks/useContent";
import { anchorRange, indexText, selectionAnchor } from "../domain/textAnchors";
import { learningRequest, type Discussion, type TextReference } from "../infrastructure/learningClient";
import { useLearningSession } from "./LearningSession";
import { SidePanel } from "./SidePanel";
import { AssistantPanel } from "./AssistantPanel";
import { DiscussionPanel } from "./DiscussionPanel";

type Panel = "discussions" | "assistant" | "profile" | null;
type HighlightsAPI = { registry: Map<string, unknown>; create: new (...ranges: Range[]) => unknown };
function highlightAPI(): HighlightsAPI | null {
  const api = globalThis as unknown as { CSS?: { highlights?: Map<string, unknown> }; Highlight?: new (...ranges: Range[]) => unknown };
  return api.CSS?.highlights && api.Highlight ? { registry: api.CSS.highlights, create: api.Highlight } : null;
}
export function LearningCompanion() {
  const location = useLocation(); const { questions, terms } = useContent();
  const { session, error: sessionError, rename } = useLearningSession();
  const [panel, setPanel] = useState<Panel>(null); const [reference, setReference] = useState<TextReference | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; ref: TextReference } | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]); const [selectedId, setSelectedId] = useState(""); const [error, setError] = useState("");
  const [name, setName] = useState(""); const [profileBusy, setProfileBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); const rangeMap = useRef(new Map<string, Range>());
  const disabled = !!session?.activeExam || location.pathname.startsWith("/exam");
  useEffect(() => { document.documentElement.classList.toggle("companion-open", !!panel); return () => document.documentElement.classList.remove("companion-open"); }, [panel]);
  const page = useMemo(() => {
    const q = questions.find(q => location.pathname === `/learn/questions/${q.id}`);
    if (q) return { resource: `question:${q.id}`, title: q.taxonomy.primaryConcept, selector: ".question-panel" };
    const term = terms.find(t => location.pathname === `/terms/${t.id}`);
    return term ? { resource: `term:${term.id}`, title: term.title, selector: ".term-article" } : null;
  }, [location.pathname, questions, terms]);
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
    const update = async () => { try { const r = await learningRequest<{ discussions: Discussion[] }>(`discussions?resource=${encodeURIComponent(resource)}`); if (live) { setDiscussions(r.discussions); setError(""); } } catch (e) { if (live) setError(e instanceof Error ? e.message : "共享讨论暂不可用"); } };
    void update(); const timer = window.setInterval(update, 5000); return () => { live = false; clearInterval(timer); };
  }, [resource, disabled, session?.user.id]);
  useEffect(() => {
    const openProfile = () => { setName(session?.user.name ?? ""); setPanel("profile"); setMenu(null); };
    window.addEventListener("ceptlens-profile", openProfile); return () => window.removeEventListener("ceptlens-profile", openProfile);
  }, [session?.user.name]);
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
      if (anchor.quote.length > 2400) { setError("选区过长，请选择 2400 字以内的一段文本。"); setMenu(null); return; }
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
    {session?.activeExam && !location.pathname.startsWith("/exam") && <div className="active-exam-banner">考核进行中，批注与助手已禁用。<Link to={`/exam?attempt=${session.activeExam}`}>返回答卷</Link></div>}
    {!disabled && <div className="companion-dock">{page && <button className="discussion-launch" onClick={() => open("discussions")} aria-label={`本页共享讨论 ${discussions.length} 条`}><MessageSquare size={19} /><span>讨论</span><b>{discussions.length}</b></button>}<button className="assistant-launch" onClick={() => open("assistant", page ? { ...page, quote: "", prefix: "", suffix: "", start: 0 } : null)} aria-label="打开学习助手"><Bot size={23} /><span>学习助手</span></button></div>}
    {menu && !disabled && <div className="selection-menu" ref={menuRef} role="toolbar" aria-label="选区操作" style={{ left: menu.x, top: menu.y }} onMouseDown={e => e.preventDefault()}><button onClick={() => open("discussions", menu.ref)}><MessageSquare size={16} /> 批注</button><button onClick={() => open("assistant", menu.ref)}><Bot size={17} /> 问助手</button></div>}
    {panel === "discussions" && page && !disabled && <SidePanel title="共享讨论" subtitle={page.title} close={() => setPanel(null)}>{(error || sessionError) && <p role="alert" className="service-error">{error || sessionError}</p>}<DiscussionPanel key={page.resource} discussions={discussions} reference={reference} selectedId={selectedId} onSelect={setSelectedId} locate={locate} refresh={refresh} saved={() => setReference(null)} /></SidePanel>}
    {panel === "assistant" && !disabled && <SidePanel title="学习助手" subtitle="解释概念 · 拆解问题 · 继续追问" close={() => setPanel(null)}><AssistantPanel reference={reference} clearReference={() => setReference(null)} /></SidePanel>}
    {panel === "profile" && <SidePanel title="我的讨论身份" close={() => setPanel(null)}><form className="drawer-body identity-form" onSubmit={async e => { e.preventDefault(); setProfileBusy(true); try { await rename(name); setPanel(null); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "保存失败"); } finally { setProfileBusy(false); } }}><UserRound size={32} /><label>显示名<input autoFocus value={name} maxLength={40} placeholder="让同事知道你是谁" onChange={e => setName(e.target.value)} /></label><p>显示名会出现在共享批注和答卷中。当前按浏览器识别身份，尚未接入公司账号；显示名不是经过认证的实名。</p><p>请在个人浏览器使用。清除网站数据或更换设备后，原身份和私人记录暂不能恢复。</p>{(error || sessionError) && <p className="service-error" role="alert">{error || sessionError}</p>}<button className="primary-button" disabled={profileBusy || !name.trim()}>保存显示名</button></form></SidePanel>}
  </>;
}
