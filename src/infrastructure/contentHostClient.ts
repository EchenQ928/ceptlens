export interface ContentHostStatus {
  version: string;
  publicUrl: string;
  questionCount: number;
  termCount: number;
  missingTermCount: number;
  publishing: boolean;
  persistentRoot: string;
  contentRevision?: string;
  contentHash?: string;
  packageFormat: string;
  environment: "lab" | "production";
}

async function decode(response: Response) {
  const value = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }));
  if (!response.ok || !value.ok) throw new Error(value.error ?? `HTTP ${response.status}`);
  return value;
}

export interface ContentRevision { revision: string; reason: string; createdAt: string; questionCount: number; termCount: number; }
async function importFiles(kind: "questions" | "terms", files: File[], token: string) {
  if (!files.length) throw new Error("Select at least one file.");
  const body = new FormData();
  for (const file of files) body.append("files", file, file.name);
  return decode(await fetch(`api/content/${kind}/import-files`, {
    method: "POST", headers: { "X-Content-Admin-Token": token }, body,
  }));
}
export const contentHostClient = {
  importQuestionFiles: (files: File[], token: string) => importFiles("questions", files, token),
  importTermPackages: (files: File[], token: string) => importFiles("terms", files, token),
  async history(): Promise<ContentRevision[]> { return (await decode(await fetch("api/content/history", { cache: "no-store" }))).revisions; },
  async restore(revision: string, token: string) {
    return decode(await fetch("api/content/restore", { method: "POST", headers: { "X-Content-Admin-Token": token, "Content-Type": "application/json" }, body: JSON.stringify({ revision }) }));
  },
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
