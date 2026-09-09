import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { learningRequest, uniqueId, type AgentStatus, type ChatMessage, type TextReference } from "../infrastructure/learningClient";
import { useLearningSession } from "./LearningSession";
import { RichText } from "./RichText";
export function AssistantPanel({ reference, clearReference }: { reference: TextReference | null; clearReference: () => void }) {
  const { session } = useLearningSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]); const [draft, setDraft] = useState(() => sessionStorage.getItem("ceptlens.assistant-draft") ?? "");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [agent, setAgent] = useState<AgentStatus | null>(session?.agent ?? null);
  const [requestKey, setRequestKey] = useState(uniqueId); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { let live = true; void learningRequest<{ messages: ChatMessage[]; agent: AgentStatus }>("assistant/history").then(r => { if (live) { setMessages(r.messages); setAgent(r.agent); } }).catch(e => live && setError(e.message)); return () => { live = false; }; }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy]);
  async function ask(content = draft, attached = reference) {
    if (!content.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const result = await learningRequest<{ messages: ChatMessage[]; agent: AgentStatus }>("assistant/ask", { id: requestKey, content, reference: attached });
      setMessages(result.messages); setAgent(result.agent); setDraft(""); sessionStorage.removeItem("ceptlens.assistant-draft"); setRequestKey(uniqueId());
    } catch (e) { setError(e instanceof Error ? e.message : "问题未发送，草稿已保留。"); }
    finally { setBusy(false); }
  }
  return <>
    <div className="assistant-connection"><span className={agent?.enabled ? "connection-dot connected" : "connection-dot"} />{agent?.enabled ? `已配置 · ${agent.model}` : "暂未接入大模型 API"}</div>
    <div className="drawer-body chat-transcript" aria-label="助手对话">
      {!messages.length && <div className="companion-empty"><Bot size={30} /><h3>哪里还不明白？</h3><p>可以引用一段原文来问，也可以直接输入问题。</p></div>}
      {messages.map(m => <article key={m.id} className={`chat-message ${m.role} ${m.status ?? ""}`}><b>{m.role === "user" ? "你" : "学习助手"}</b>{m.reference?.quote && <blockquote>{m.reference.quote}</blockquote>}<p>{m.role === "assistant" ? <RichText text={m.content} terms={[]} linkTerms={false} /> : m.content}</p>
        {(m.status === "unavailable" || m.status === "error") && <button className="text-link" disabled={busy} onClick={() => { const question = messages.find(item => item.id === m.replyTo); if (question) void ask(question.content, question.reference ?? null); }}>重试这个问题</button>}
      </article>)}
      {busy && <p role="status" className="status-note">正在处理你的问题…</p>}{error && <p role="alert" className="service-error">{error}</p>}<div ref={end} />
    </div>
    <form className="chat-composer" onSubmit={e => { e.preventDefault(); void ask(); }}>
      {reference && <div className="attached-reference"><div><b>引用 · {reference.title}</b><p>{reference.quote || "当前页面内容"}</p></div><button type="button" aria-label="移除引用" onClick={clearReference}><X size={16} /></button></div>}
      <label className="sr-only" htmlFor="assistant-question">向学习助手提问</label><textarea id="assistant-question" maxLength={4000} rows={3} value={draft} placeholder="输入你的问题…" onChange={e => { setDraft(e.target.value); sessionStorage.setItem("ceptlens.assistant-draft", e.target.value); }} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void ask(); } }} />
      <div><small>仅本人可见 · Ctrl / ⌘ + Enter 发送</small><button className="primary-button" disabled={busy || !draft.trim() || !session}><Send size={16} /> 发送</button></div>
    </form><footer className="drawer-footnote">接入 API 后，发送的问题与引用会交给配置的模型服务。回答仅供学习参考。</footer>
  </>;
}
