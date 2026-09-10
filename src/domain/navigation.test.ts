import { describe, expect, it } from "vitest";
import { appendTrailNode, buildTermTrail, type TermTrailNode } from "./navigation";

const question: TermTrailNode = { kind: "question", id: "q-1", label: "第 1 题", href: "/learn/questions/q-1?mode=practice" };
const attention: TermTrailNode = { kind: "term", id: "self-attention", label: "自注意力", href: "/terms/self-attention" };
const softmax: TermTrailNode = { kind: "term", id: "softmax", label: "Softmax", href: "/terms/softmax" };

describe("term exploration trail", () => {
  it("records question -> term -> nested term in order", () => {
    const first = buildTermTrail([], question, attention);
    expect(buildTermTrail(first, attention, softmax)).toEqual([question, attention, softmax]);
  });

  it("does not duplicate the current node after a route render", () => {
    expect(appendTrailNode([question, attention], attention)).toEqual([question, attention]);
  });

  it("supports returning by truncating to an earlier node", () => {
    const trail = [question, attention, softmax];
    expect(trail.slice(0, 2)).toEqual([question, attention]);
  });
});
