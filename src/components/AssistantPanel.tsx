import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { learningRequest, uniqueId, type AgentStatus, type ChatMessage, type TextReference } from "../infrastructure/learningClient";
import { useLearningSession } from "./LearningSession";
import { RichText } from "./RichText";
import { uiText, useLocale } from "../i18n";
export function AssistantPanel({ reference, clearReference }: { reference: TextReference | null; clearReference: () => void }) {
  const { session } = useLearningSession();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
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
    } catch (e) { setError(e instanceof Error ? e.message : t("问题未发送，草稿已保留。", "The question was not sent; your draft was kept.")); }
    finally { setBusy(false); }
  }
  return <>
    <div className="assistant-connection"><span className={agent?.enabled ? "connection-dot connected" : "connection-dot"} />{agent?.enabled ? `${t("已配置", "Configured")} · ${agent.model}` : t("暂未接入大模型 API", "No model API configured")}</div>
    <div className="drawer-body chat-transcript" aria-label={t("助手对话", "Assistant conversation")}>
      {!messages.length && <div className="companion-empty"><Bot size={30} /><h3>{t("哪里还不明白？", "What is unclear?")}</h3><p>{t("可以引用一段原文来问，也可以直接输入问题。", "Quote a passage or type a question directly.")}</p></div>}
      {messages.map(m => <article key={m.id} className={`chat-message ${m.role} ${m.status ?? ""}`}><b>{m.role === "user" ? t("你", "You") : t("学习助手", "Learning assistant")}</b>{m.reference?.quote && <blockquote>{m.reference.quote}</blockquote>}<p>{m.role === "assistant" ? <RichText text={m.content} terms={[]} linkTerms={false} /> : m.content}</p>
        {(m.status === "unavailable" || m.status === "error") && <button className="text-link" disabled={busy} onClick={() => { const question = messages.find(item => item.id === m.replyTo); if (question) void ask(question.content, question.reference ?? null); }}>{t("重试这个问题", "Retry this question")}</button>}
      </article>)}
      {busy && <p role="status" className="status-note">{t("正在处理你的问题…", "Processing your question…")}</p>}{error && <p role="alert" className="service-error">{error}</p>}<div ref={end} />
    </div>
    <form className="chat-composer" onSubmit={e => { e.preventDefault(); void ask(); }}>
      {reference && <div className="attached-reference"><div><b>{t("引用", "Quote")} · {reference.title}</b><p>{reference.quote || t("当前页面内容", "Current page content")}</p></div><button type="button" aria-label={t("移除引用", "Remove quote")} onClick={clearReference}><X size={16} /></button></div>}
      <label className="sr-only" htmlFor="assistant-question">{t("向学习助手提问", "Ask the learning assistant")}</label><textarea id="assistant-question" maxLength={4000} rows={3} value={draft} placeholder={t("输入你的问题…", "Type your question…")} onChange={e => { setDraft(e.target.value); sessionStorage.setItem("ceptlens.assistant-draft", e.target.value); }} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void ask(); } }} />
      <div><small>{t("仅本人可见 · Ctrl / ⌘ + Enter 发送", "Visible only to you · press Ctrl / ⌘ + Enter to send")}</small><button className="primary-button" disabled={busy || !draft.trim() || !session}><Send size={16} /> {t("发送", "Send")}</button></div>
    </form><footer className="drawer-footnote">{t("接入 API 后，发送的问题与引用会交给配置的模型服务。回答仅供学习参考。", "After an API is configured, questions and quotes are sent to the selected model service. Answers are for learning reference only.")}</footer>
  </>;
}
