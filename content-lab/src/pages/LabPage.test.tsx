// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LabActions } from "./LabPage";
import { describeUpload, labClient } from "../infrastructure/labClient";
vi.mock("../infrastructure/labClient", () => ({ describeUpload: vi.fn(), labClient: { import: vi.fn(), check: vi.fn(), remove: vi.fn(), download: vi.fn() } }));
let element: HTMLDivElement; let root: Root;
beforeEach(() => { vi.clearAllMocks(); (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true; element = document.createElement("div"); document.body.append(element); root = createRoot(element); });
afterEach(async () => { await act(() => root.unmount()); element.remove(); });
function button(label: string) { return [...element.querySelectorAll("button")].find(b => b.textContent?.includes(label))!; }
async function chooseFile() { const input = element.querySelector("input")!; Object.defineProperty(input, "files", { configurable: true, value: [new File(["test"], "demo.zip")] }); await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); }); }
it("requires confirmation for same-ID replacement and only calls the local import", async () => {
  const reload = vi.fn();
  vi.mocked(describeUpload).mockResolvedValue({ file: new File(["test"], "demo.zip"), kind: "terms", items: [{ id: "demo", title: "示例" }] });
  vi.mocked(labClient.import).mockResolvedValue({ id: "demo" });
  await act(() => root.render(<LabActions kind="terms" selectedId="demo" existingTerms={["demo"]} existingQuestions={[]} reload={reload} />));
  await chooseFile();
  expect(element.textContent).toContain("将替换本机同 ID 草稿"); expect(labClient.import).not.toHaveBeenCalled();
  await act(async () => button("确认导入").click());
  expect(labClient.import).toHaveBeenCalledOnce(); expect(reload).toHaveBeenCalledWith("/terms/demo");
});
it("keeps the import dialog and the current page when validation fails", async () => {
  const reload = vi.fn();
  vi.mocked(describeUpload).mockResolvedValue({ file: new File(["test"], "demo.zip"), kind: "terms", items: [{ id: "demo", title: "示例" }] });
  vi.mocked(labClient.import).mockRejectedValue(new Error("view.tsx 类型错误"));
  await act(() => root.render(<LabActions kind="terms" existingTerms={[]} existingQuestions={[]} reload={reload} />));
  await chooseFile(); await act(async () => button("确认导入").click());
  expect(element.querySelector('[role="dialog"]')?.textContent).toContain("view.tsx 类型错误"); expect(reload).not.toHaveBeenCalled();
});
it("exports a term ZIP and directs the author to upload at the formal site", async () => {
  vi.mocked(labClient.download).mockResolvedValue();
  await act(() => root.render(<LabActions kind="terms" selectedId="demo" existingTerms={["demo"]} existingQuestions={[]} />));
  await act(async () => button("导出当前词条").click());
  expect(labClient.download).toHaveBeenCalledWith("/api/content/terms/demo/export", "demo.term.zip");
  expect(element.textContent).toContain("正式平台的内容管理输入口令后上传");
  expect(element.querySelector('input[type="password"]')).toBeNull();
});
it("keeps removal cancellable and separate from export", async () => {
  await act(() => root.render(<LabActions kind="terms" selectedId="demo" existingTerms={["demo"]} existingQuestions={[]} />));
  await act(() => button("移除本机草稿").click()); expect(labClient.remove).not.toHaveBeenCalled();
  await act(() => button("取消").click()); expect(element.querySelector('[role="dialog"]')).toBeNull();
});
