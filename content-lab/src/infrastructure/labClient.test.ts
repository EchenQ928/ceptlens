import { expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { describeUpload } from "./labClient";
it('resolves bilingual question and term titles before rendering an import dialog', async () => {
  const title = { 'zh-CN':'缓存机制', 'en-US':'Cache mechanics' };
  const file = new File([JSON.stringify({ schemaVersion:'3.0',id:'cache-q',taxonomy:{primaryConcept:title} })],'question.json');
  expect((await describeUpload(file,'questions','en-US')).items[0].title).toBe('Cache mechanics');
  const zip = zipSync({ 'manifest.json':strToU8(JSON.stringify({schemaVersion:'3.0',id:'cache',title})), 'view.tsx':strToU8('code') });
  expect((await describeUpload(new File([zip],'term.zip'),'terms','zh-CN')).items[0].title).toBe('缓存机制');
});
it("reads a teaching-package manifest without requiring the platform source", async () => {
  const zip = zipSync({ "demo/manifest.json": strToU8(JSON.stringify({ schemaVersion: "3.0", id: "demo", title: "示例" })), "demo/view.tsx": strToU8("code") });
  const result = await describeUpload(new File([zip], "demo.zip"), "terms");
  expect(result.items).toEqual([{ id: "demo", title: "示例" }]);
});
it("rejects a whole term-library archive instead of guessing one term", async () => {
  const zip = zipSync({ "one/manifest.json": strToU8("{}"), "two/manifest.json": strToU8("{}") });
  await expect(describeUpload(new File([zip], "library.zip"), "terms")).rejects.toThrow("一次导入一个词条");
});
it("reads a question bundle and rejects malformed input", async () => {
  const file = new File([JSON.stringify({ kind: "question-bundle", questions: [{ schemaVersion: "3.0", id: "q-one", taxonomy: { primaryConcept: "概念" } }] })], "questions.json");
  expect((await describeUpload(file, "questions")).items[0]).toEqual({ id: "q-one", title: "概念" });
  await expect(describeUpload(new File(["{}"], "broken.json"), "questions")).rejects.toThrow("3.0");
});
