import type { TextReference } from "./textReference";
export function indexText(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; start: number; end: number }[] = []; let text = "";
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement?.closest("script,style,textarea,[data-annotation-ignore],.katex-mathml")) continue;
    nodes.push({ node, start: text.length, end: text.length + node.length }); text += node.data;
  }
  return { nodes, text };
}
export function selectionAnchor(root: HTMLElement, selection: Selection | null): Omit<TextReference, "resource" | "title"> | null {
  if (!selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const index = indexText(root); let start = -1; let end = -1;
  for (const slot of index.nodes) {
    if (!range.intersectsNode(slot.node) || range.comparePoint(slot.node, slot.node.length) < 0 || range.comparePoint(slot.node, 0) > 0) continue;
    const a = slot.node === range.startContainer ? range.startOffset : 0;
    const b = slot.node === range.endContainer ? range.endOffset : slot.node.length;
    if (b <= a) continue;
    if (start < 0) start = slot.start + a;
    end = slot.start + b;
  }
  if (start < 0 || end <= start) return null;
  while (/\s/.test(index.text[start] ?? "") && start < end) start++;
  while (/\s/.test(index.text[end - 1] ?? "") && end > start) end--;
  if (start === end) return null;
  return { quote: index.text.slice(start, end), start, prefix: index.text.slice(Math.max(0, start - 80), start), suffix: index.text.slice(end, end + 80) };
}
export function findAnchor(text: string, ref: Pick<TextReference, "quote" | "prefix" | "suffix" | "start">): number | null {
  if (!ref.quote) return null;
  const candidates: { at: number; score: number }[] = [];
  for (let at = text.indexOf(ref.quote); at >= 0; at = text.indexOf(ref.quote, at + 1)) {
    const before = text.slice(Math.max(0, at - ref.prefix.length), at);
    const after = text.slice(at + ref.quote.length, at + ref.quote.length + ref.suffix.length);
    candidates.push({ at, score: (ref.prefix && before === ref.prefix ? 1 : 0) + (ref.suffix && after === ref.suffix ? 1 : 0) });
  }
  if (candidates.length === 1) return candidates[0].at;
  candidates.sort((a, b) => b.score - a.score);
  // A changed/ambiguous quote must not silently jump to the wrong paragraph.
  return candidates.length > 1 && candidates[0].score > candidates[1].score ? candidates[0].at : null;
}
export function anchorRange(root: HTMLElement, ref: TextReference): Range | null {
  const index = indexText(root); const at = findAnchor(index.text, ref); if (at === null) return null;
  const first = index.nodes.find(n => n.start <= at && at < n.end);
  const last = index.nodes.find(n => n.start < at + ref.quote.length && at + ref.quote.length <= n.end);
  if (!first || !last) return null;
  const range = document.createRange(); range.setStart(first.node, at - first.start); range.setEnd(last.node, at + ref.quote.length - last.start); return range;
}
