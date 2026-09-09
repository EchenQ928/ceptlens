import type { TextReference } from "../domain/textReference";
export type { TextReference } from "../domain/textReference";
export interface UserIdentity { id: string; name: string }
export interface AgentStatus { enabled: boolean; model: string | null; message: string }
export interface SessionInfo { user: UserIdentity; activeExam: string | null; agent: AgentStatus }
export interface DiscussionMessage { id: string; author: UserIdentity; body: string; createdAt: number; editedAt?: number }
export interface Discussion { id: string; owner: string; resource: string; reference: TextReference; status: "open" | "resolved"; createdAt: number; updatedAt: number; messages: DiscussionMessage[] }
export interface ChatMessage { id: string; role: "user" | "assistant"; content: string; reference?: TextReference | null; createdAt: number; replyTo?: string; status?: "ready" | "unavailable" | "error" }
export function uniqueId() { return Array.from(crypto.getRandomValues(new Uint8Array(24)), v => v.toString(16).padStart(2, "0")).join(""); }
let identity = "";
function token() {
  if (identity) return identity;
  identity = localStorage.getItem("ceptlens.identity.v1") || uniqueId();
  localStorage.setItem("ceptlens.identity.v1", identity);
  return identity;
}
export async function learningRequest<T>(path: string, data?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/${path}`, { method: data === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", "X-CeptLens-Identity": token() }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) }); }
  catch { throw new Error("未连接到服务主机，内容尚未保存。请检查网络后重试。"); }
  let result;
  try { result = await response.json(); } catch { throw new Error("共享服务未启动，请使用 start-lan 或 start-local 启动完整网站。"); }
  if (!response.ok || !result.ok) throw new Error(result.error || "操作未完成，请重试。");
  return result as T;
}
