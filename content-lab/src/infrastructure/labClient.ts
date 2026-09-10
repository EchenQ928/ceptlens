import { unzipSync } from "fflate";

const API_PREFIX = typeof window !== "undefined" && window.location.pathname.startsWith("/lab/") ? "/lab/api" : "/api";

export type Upload = { file: File; kind: "terms" | "questions"; items: { id: string; title: string }[] };
export async function describeUpload(file: File, kind: Upload["kind"]): Promise<Upload> {
  if (file.size > 25 * 1024 * 1024) throw new Error("教学包不能超过 25 MB。");
  let data;
  if (kind === "terms") {
    let size = 0; let count = 0;
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter(entry) {
      size += entry.originalSize;
      if (++count > 5000 || size > 100 * 1024 * 1024) throw new Error("解压后不能超过 100 MB 或 5000 个文件。");
      if (/(^|\/)manifest\.json$/.test(entry.name) && entry.originalSize > 65536) throw new Error("教学包清单过大。");
      return /(^|\/)manifest\.json$/.test(entry.name);
    } });
    const manifests = Object.values(entries);
    if (manifests.length !== 1) throw new Error("请一次导入一个词条 ZIP，且只包含一个 manifest.json。");
    data = JSON.parse(new TextDecoder().decode(manifests[0]));
  } else data = JSON.parse(await file.text());
  const rows = kind === "questions" && data.kind === "question-bundle" ? data.questions : [data];
  if (!Array.isArray(rows) || !rows.length || rows.some(row => row.schemaVersion !== "3.0" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(row.id ?? ""))) throw new Error("请选择 3.0 格式的完整内容包。");
  return { file, kind, items: rows.map(row => ({ id: row.id, title: row.title ?? row.taxonomy?.primaryConcept ?? row.id })) };
}

async function checked(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `请求失败（${response.status}），请确认实验室终端仍在运行。`);
  }
  return response;
}
async function mutate(path: string, init: RequestInit) {
  let key = sessionStorage.getItem("ceptlens-lab-developer-key");
  if (!key) {
    key = window.prompt("请输入独立实验室开发者密钥");
    if (!key) throw new Error("需要开发者密钥才能执行实验室操作。");
    sessionStorage.setItem("ceptlens-lab-developer-key", key);
  }
  const session = await (await checked(await fetch(`${API_PREFIX}/lab/session`, { method: "POST", headers: { "X-Lab-Developer-Key": key }, cache: "no-store" }))).json();
  const target = path.startsWith("/api/") ? `${API_PREFIX}${path.slice(4)}` : path;
  return (await checked(await fetch(target, { ...init, headers: { ...init.headers, "X-Content-Admin-Token": session.token } }))).json();
}
export const labClient = {
  import: (upload: Upload) => mutate(`/api/content/${upload.kind}/import`, { method: "POST", headers: { "Content-Type": upload.kind === "terms" ? "application/zip" : "application/json" }, body: upload.file }),
  check: () => mutate("/api/lab/check", { method: "POST" }),
  remove: (kind: Upload["kind"], id: string) => mutate(`/api/content/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  async download(path: string, filename: string) {
    const target = path.startsWith("/api/") ? `${API_PREFIX}${path.slice(4)}` : path;
    const response = await checked(await fetch(target, { cache: "no-store" }));
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
