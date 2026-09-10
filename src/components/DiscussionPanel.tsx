import { useEffect, useState } from "react";
import { CheckCircle2, CornerDownRight, MessageSquare, Send } from "lucide-react";
import { learningRequest, uniqueId, type Discussion, type TextReference } from "../infrastructure/learningClient";
import { useLearningSession } from "./LearningSession";
import { uiText, useLocale } from "../i18n";

const date = (value: number, locale: "zh-CN" | "en-US") => new Date(value).toLocaleString(locale === "en-US" ? "en-US" : "zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
export function DiscussionPanel({ discussions, reference, selectedId, onSelect, locate, refresh, saved }: {
  discussions: Discussion[]; reference: TextReference | null; selectedId: string; onSelect: (id: string) => void;
  locate: (d: Discussion) => boolean; refresh: () => Promise<void>; saved: () => void;
}) {
  const { session } = useLearningSession();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const [scope, setScope] = useState<"all" | "open">("all");
  const [draft, setDraft] = useState(""); const [requestKey, setRequestKey] = useState(uniqueId);
  const [reply, setReply] = useState(""); const [replyKey, setReplyKey] = useState(uniqueId);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [locationError, setLocationError] = useState("");
  const current = discussions.find(d => d.id === selectedId);
  const draftKey = reference ? `ceptlens.note-draft:${reference.resource}:${reference.start}` : "";
  useEffect(() => { setDraft(draftKey ? sessionStorage.getItem(draftKey) ?? "" : ""); setRequestKey(uniqueId()); }, [draftKey]);
  useEffect(() => { setReply(sessionStorage.getItem(`ceptlens.reply-draft:${selectedId}`) ?? ""); setReplyKey(uniqueId()); setEditing(null); setLocationError(""); }, [selectedId]);
  async function mutate(path: string, payload: unknown, done: () => void) {
    if (busy) return; setBusy(true); setError("");
    try { await learningRequest(path, payload); done(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : t("保存失败，草稿已保留。", "Save failed; your draft was kept.")); }
    finally { setBusy(false); }
  }
  return <>
    <div className="drawer-body discussion-body">
      <p className="privacy-line"><MessageSquare size={15} /> {t("所有人可见", "Visible to everyone")} · {t("以", "posted by")} {session?.user.name ?? t("访客", "guest")}</p>
      {reference && <section className="new-discussion"><h3>{t("新批注", "New annotation")}</h3><blockquote>{reference.quote}</blockquote>
        <textarea autoFocus aria-label={t("批注内容", "Annotation")} rows={5} maxLength={4000} placeholder={t("写下理解、补充，或你想请教的问题…", "Share an interpretation, addition, or question…")} value={draft} onChange={e => { setDraft(e.target.value); sessionStorage.setItem(draftKey, e.target.value); }} />
        <button className="primary-button" disabled={busy || !draft.trim() || !session} onClick={() => void mutate("discussions", { id: requestKey, reference, body: draft }, () => { sessionStorage.removeItem(draftKey); setDraft(""); setRequestKey(uniqueId()); onSelect(requestKey); saved(); })}><Send size={16} />{busy ? t("保存中…", "Saving…") : t("保存共享批注", "Save shared annotation")}</button>
      </section>}
      {error && <p role="alert" className="service-error">{error}</p>}
      {current ? <button className="secondary-button" onClick={() => onSelect("")}>{t("返回本页讨论", "Back to this page's discussions")}（{discussions.length}）</button> : <div className="discussion-filter"><b>{t("本页讨论", "Discussions on this page")} · {discussions.length}</b><button className={scope === "open" ? "active" : ""} aria-pressed={scope === "open"} onClick={() => setScope(s => s === "all" ? "open" : "all")}>{t("只看未解决", "Open only")}</button></div>}
      {!discussions.length && <div className="companion-empty"><MessageSquare size={28} /><h3>{t("还没有讨论", "No discussions yet")}</h3><p>{t("选中正文后右键添加批注，或使用选区旁的“批注”按钮。", "Select text, then right-click or use the nearby annotation action.")}</p></div>}
      {!current && discussions.filter(d => scope !== "open" || d.status === "open").map(d => <button key={d.id} className={`discussion-summary ${selectedId === d.id ? "active" : ""}`} onClick={() => { onSelect(d.id); setLocationError(locate(d) ? "" : "原文暂未显示或已变化，仍可查看摘录与讨论。"); }}>
        <span className="discussion-summary-meta">{d.status === "resolved" ? <span className="resolved-label"><CheckCircle2 size={14} /> {t("已解决", "Resolved")}</span> : <span>{t("未解决", "Open")}</span>}<small>{d.messages.length - 1} {t("条回复", "replies")}</small></span>
        <q>{d.reference.quote}</q><strong>{d.messages[0].body}</strong><span className="discussion-summary-meta">{d.messages[0].author.name}<small>{date(d.updatedAt, locale)}</small></span>
      </button>)}
      {current && <section className="discussion-detail" aria-label={t("讨论详情", "Discussion details")}>
        <div className="discussion-filter"><h3>{t("讨论串", "Thread")}</h3>{current.owner === session?.user.id && <button disabled={busy} onClick={() => void mutate(`discussions/${current.id}`, { action: current.status === "open" ? "resolve" : "reopen" }, () => {})}>{current.status === "open" ? t("标记已解决", "Mark resolved") : t("重新打开", "Reopen")}</button>}</div>
        <button className="quote-jump" onClick={() => setLocationError(locate(current) ? "" : t("原文暂未显示或已变化，仍可查看摘录与讨论。", "The source text is not visible or has changed; the excerpt and discussion are still available."))}>{t("定位原文", "Locate source")} <CornerDownRight size={14} /></button>
        <blockquote>{current.reference.quote}</blockquote>{locationError && <p className="status-note">{locationError}</p>}
        {current.messages.map(m => <article className="discussion-message" key={m.id}><header><b>{m.author.name}</b><time>{date(m.createdAt, locale)}{m.editedAt ? ` · ${t("已修改", "edited")}` : ""}</time></header>
          {editing?.id === m.id ? <><textarea aria-label={t("修改批注", "Edit annotation")} rows={4} maxLength={4000} value={editing.text} onChange={e => setEditing({ id: m.id, text: e.target.value })} /><div className="inline-actions"><button className="primary-button" disabled={busy || !editing.text.trim()} onClick={() => void mutate(`discussions/${current.id}`, { action: "edit", messageId: m.id, body: editing.text }, () => setEditing(null))}>{t("保存修改", "Save changes")}</button><button className="secondary-button" onClick={() => setEditing(null)}>{t("取消", "Cancel")}</button></div></> : <p>{m.body}</p>}
          {m.author.id === session?.user.id && !editing && <div className="message-actions"><button onClick={() => setEditing({ id: m.id, text: m.body })}>{t("修改", "Edit")}</button><button disabled={busy} onClick={() => { if (window.confirm(t("撤回这条内容？讨论串和其他人的回复会保留。", "Withdraw this message? The thread and other replies will remain."))) void mutate(`discussions/${current.id}`, { action: "withdraw", messageId: m.id }, () => {}); }}>{t("撤回", "Withdraw")}</button></div>}
        </article>)}
        <label className="reply-label">{t("回复讨论", "Reply")}<textarea aria-label={t("回复内容", "Reply content")} rows={3} maxLength={4000} value={reply} placeholder={t("补充解释，或继续追问…", "Add an explanation or ask a follow-up…")} onChange={e => { setReply(e.target.value); sessionStorage.setItem(`ceptlens.reply-draft:${selectedId}`, e.target.value); }} /></label>
        <button className="primary-button" disabled={busy || !reply.trim()} onClick={() => void mutate(`discussions/${current.id}`, { action: "reply", id: replyKey, body: reply }, () => { setReply(""); setReplyKey(uniqueId()); sessionStorage.removeItem(`ceptlens.reply-draft:${selectedId}`); })}><Send size={16} /> {t("发布回复", "Post reply")}</button>
      </section>}
    </div><footer className="drawer-footnote">{t("批注已保存到广播主机，其他用户通常在 5 秒内看到更新。", "Annotations are saved to the service host; other users usually see updates within five seconds.")}</footer>
  </>;
}
