import { useEffect, useState } from "react";
import { CheckCircle2, CornerDownRight, MessageSquare, Send } from "lucide-react";
import { learningRequest, uniqueId, type Discussion, type TextReference } from "../infrastructure/learningClient";
import { useLearningSession } from "./LearningSession";

const date = (value: number) => new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
export function DiscussionPanel({ discussions, reference, selectedId, onSelect, locate, refresh, saved }: {
  discussions: Discussion[]; reference: TextReference | null; selectedId: string; onSelect: (id: string) => void;
  locate: (d: Discussion) => boolean; refresh: () => Promise<void>; saved: () => void;
}) {
  const { session } = useLearningSession();
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
    catch (e) { setError(e instanceof Error ? e.message : "保存失败，草稿已保留。"); }
    finally { setBusy(false); }
  }
  return <>
    <div className="drawer-body discussion-body">
      <p className="privacy-line"><MessageSquare size={15} /> 所有人可见 · 以 {session?.user.name ?? "访客"} 发布</p>
      {reference && <section className="new-discussion"><h3>新批注</h3><blockquote>{reference.quote}</blockquote>
        <textarea autoFocus aria-label="批注内容" rows={5} maxLength={4000} placeholder="写下理解、补充，或你想请教的问题…" value={draft} onChange={e => { setDraft(e.target.value); sessionStorage.setItem(draftKey, e.target.value); }} />
        <button className="primary-button" disabled={busy || !draft.trim() || !session} onClick={() => void mutate("discussions", { id: requestKey, reference, body: draft }, () => { sessionStorage.removeItem(draftKey); setDraft(""); setRequestKey(uniqueId()); onSelect(requestKey); saved(); })}><Send size={16} />{busy ? "保存中…" : "保存共享批注"}</button>
      </section>}
      {error && <p role="alert" className="service-error">{error}</p>}
      {current ? <button className="secondary-button" onClick={() => onSelect("")}>返回本页讨论（{discussions.length}）</button> : <div className="discussion-filter"><b>本页讨论 · {discussions.length}</b><button className={scope === "open" ? "active" : ""} aria-pressed={scope === "open"} onClick={() => setScope(s => s === "all" ? "open" : "all")}>只看未解决</button></div>}
      {!discussions.length && <div className="companion-empty"><MessageSquare size={28} /><h3>还没有讨论</h3><p>选中正文后右键添加批注，或使用选区旁的“批注”按钮。</p></div>}
      {!current && discussions.filter(d => scope !== "open" || d.status === "open").map(d => <button key={d.id} className={`discussion-summary ${selectedId === d.id ? "active" : ""}`} onClick={() => { onSelect(d.id); setLocationError(locate(d) ? "" : "原文暂未显示或已变化，仍可查看摘录与讨论。"); }}>
        <span className="discussion-summary-meta">{d.status === "resolved" ? <span className="resolved-label"><CheckCircle2 size={14} /> 已解决</span> : <span>未解决</span>}<small>{d.messages.length - 1} 条回复</small></span>
        <q>{d.reference.quote}</q><strong>{d.messages[0].body}</strong><span className="discussion-summary-meta">{d.messages[0].author.name}<small>{date(d.updatedAt)}</small></span>
      </button>)}
      {current && <section className="discussion-detail" aria-label="讨论详情">
        <div className="discussion-filter"><h3>讨论串</h3>{current.owner === session?.user.id && <button disabled={busy} onClick={() => void mutate(`discussions/${current.id}`, { action: current.status === "open" ? "resolve" : "reopen" }, () => {})}>{current.status === "open" ? "标记已解决" : "重新打开"}</button>}</div>
        <button className="quote-jump" onClick={() => setLocationError(locate(current) ? "" : "原文暂未显示或已变化，仍可查看摘录与讨论。")}>定位原文 <CornerDownRight size={14} /></button>
        <blockquote>{current.reference.quote}</blockquote>{locationError && <p className="status-note">{locationError}</p>}
        {current.messages.map(m => <article className="discussion-message" key={m.id}><header><b>{m.author.name}</b><time>{date(m.createdAt)}{m.editedAt ? " · 已修改" : ""}</time></header>
          {editing?.id === m.id ? <><textarea aria-label="修改批注" rows={4} maxLength={4000} value={editing.text} onChange={e => setEditing({ id: m.id, text: e.target.value })} /><div className="inline-actions"><button className="primary-button" disabled={busy || !editing.text.trim()} onClick={() => void mutate(`discussions/${current.id}`, { action: "edit", messageId: m.id, body: editing.text }, () => setEditing(null))}>保存修改</button><button className="secondary-button" onClick={() => setEditing(null)}>取消</button></div></> : <p>{m.body}</p>}
          {m.author.id === session?.user.id && !editing && <div className="message-actions"><button onClick={() => setEditing({ id: m.id, text: m.body })}>修改</button><button disabled={busy} onClick={() => { if (window.confirm("撤回这条内容？讨论串和其他人的回复会保留。")) void mutate(`discussions/${current.id}`, { action: "withdraw", messageId: m.id }, () => {}); }}>撤回</button></div>}
        </article>)}
        <label className="reply-label">回复讨论<textarea aria-label="回复内容" rows={3} maxLength={4000} value={reply} placeholder="补充解释，或继续追问…" onChange={e => { setReply(e.target.value); sessionStorage.setItem(`ceptlens.reply-draft:${selectedId}`, e.target.value); }} /></label>
        <button className="primary-button" disabled={busy || !reply.trim()} onClick={() => void mutate(`discussions/${current.id}`, { action: "reply", id: replyKey, body: reply }, () => { setReply(""); setReplyKey(uniqueId()); sessionStorage.removeItem(`ceptlens.reply-draft:${selectedId}`); })}><Send size={16} /> 发布回复</button>
      </section>}
    </div><footer className="drawer-footnote">批注已保存到广播主机，其他用户通常在 5 秒内看到更新。</footer>
  </>;
}
