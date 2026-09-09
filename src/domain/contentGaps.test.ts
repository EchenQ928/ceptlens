import { describe, expect, it } from "vitest";
import type { QuestionPackage, TermPackage } from "./content";
import { collectPendingTerms } from "./contentGaps";

describe("pending term catalog", () => {
  it("aggregates authored missing dependencies without duplicating their sources", () => {
    const questions = [{
      id: "q1",
      taxonomy: { primaryConcept: "注意力" },
      ordering: { order: 1 },
      termDependencies: [{ id: "qkv", title: "QKV", reason: "题目需要" }]
    }] as QuestionPackage[];
    const terms = [{
      id: "attention",
      title: "注意力",
      termDependencies: [{ id: "qkv", title: "QKV", reason: "词条需要" }],
      prerequisites: []
    }] as unknown as TermPackage[];

    expect(collectPendingTerms(questions, terms)).toMatchObject([{
      id: "qkv",
      title: "QKV",
      questionCount: 1,
      termCount: 1
    }]);
  });

  it("does not list an installed teaching package as pending", () => {
    const terms = [{ id: "qkv", title: "QKV", termDependencies: [], prerequisites: [] }] as unknown as TermPackage[];
    const questions = [{
      id: "q1",
      taxonomy: { primaryConcept: "注意力" },
      ordering: { order: 1 },
      termDependencies: [{ id: "qkv", title: "QKV", reason: "题目需要" }]
    }] as QuestionPackage[];
    expect(collectPendingTerms(questions, terms)).toEqual([]);
  });
});
