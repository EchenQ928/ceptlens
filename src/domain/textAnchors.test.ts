// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { anchorRange, findAnchor, indexText, selectionAnchor } from "./textAnchors";
afterEach(() => { document.body.innerHTML = ""; window.getSelection()?.removeAllRanges(); });
it("captures a selection across inline links without changing the teaching DOM", () => {
  document.body.innerHTML = '<article><button data-annotation-ignore>按钮</button><p>神经<a>网络</a>是函数。</p></article>';
  const root = document.querySelector("article")!; const p = root.querySelector("p")!;
  const range = document.createRange(); range.setStart(p.firstChild!, 0); range.setEnd(p.lastChild!, 3);
  const selection = window.getSelection()!; selection.addRange(range);
  const ref = selectionAnchor(root, selection)!;
  expect(ref.quote).toBe("神经网络是函数"); expect(ref.start).toBe(0);
  expect(anchorRange(root, { ...ref, resource: "term:test", title: "测试" })?.toString()).toBe(ref.quote);
  expect(root.querySelector("a")).not.toBeNull(); expect(indexText(root).text).not.toContain("按钮");
});
it("finds relocated quotes and refuses ambiguous or deleted quotes", () => {
  const ref = { quote: "网络", prefix: "神经", suffix: "是函数", start: 2 };
  expect(findAnchor("新增：神经网络是函数", ref)).toBe(5);
  expect(findAnchor("网络与网络", { ...ref, prefix: "", suffix: "" })).toBeNull();
  expect(findAnchor("已经删除", ref)).toBeNull();
});
it("never captures selections from outside the content root", () => {
  document.body.innerHTML = '<p>侧栏</p><article>正文</article>';
  const r = document.createRange(); r.selectNodeContents(document.querySelector("p")!); window.getSelection()!.addRange(r);
  expect(selectionAnchor(document.querySelector("article")!, window.getSelection())).toBeNull();
});
