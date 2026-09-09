export interface ContentHostStatus {
  version: string;
  publicUrl: string;
  questionCount: number;
  termCount: number;
  missingTermCount: number;
  publishing: boolean;
  persistentRoot: string;
  packageFormat: string;
  environment: "lab" | "production";
}

async function decode(response: Response) {
  const value = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }));
  if (!response.ok || !value.ok) throw new Error(value.error ?? `HTTP ${response.status}`);
  return value;
}

export const contentHostClient = {
  async status(): Promise<ContentHostStatus> {
    const value = await decode(await fetch("api/content/status", { cache: "no-store" }));
    return value as ContentHostStatus;
  },
  async importQuestions(data: Blob | string, token: string) {
    return decode(await fetch("api/content/questions/import", { method: "POST", headers: { "X-Content-Admin-Token": token, "Content-Type": "application/json" }, body: data }));
  },
  async importTermPackage(file: Blob, token: string) {
    return decode(await fetch("api/content/terms/import", { method: "POST", headers: { "X-Content-Admin-Token": token, "Content-Type": "application/zip" }, body: file }));
  },
  async remove(kind: "questions" | "terms", id: string, token: string) {
    return decode(await fetch(`api/content/${kind}/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-Content-Admin-Token": token } }));
  }
};
