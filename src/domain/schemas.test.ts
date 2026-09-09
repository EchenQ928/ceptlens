import { describe, expect, it } from "vitest";
import questionChoiceTemplate from "../../content-libraries/templates/question-choice.template.json";
import questionSubjectiveTemplate from "../../content-libraries/templates/question-subjective.template.json";
import termManifestTemplate from "../../content-libraries/templates/term-teaching-package/manifest.json";
import { collectExplicitTermLinks, hydrateQuestionPackage, questionPackageSchema, richTextToPlainText, subjectiveMaxScore, termPackageSchema } from "./schemas";

describe("content package schemas", () => {
  it("accepts both official question templates", () => {
    expect(questionPackageSchema.safeParse(questionChoiceTemplate).success).toBe(true);
    expect(questionPackageSchema.safeParse(questionSubjectiveTemplate).success).toBe(true);
  });
  it("accepts the official term teaching package manifest", () => expect(termPackageSchema.safeParse(termManifestTemplate).success).toBe(true));
  it("rejects single-choice packages with multiple answers", () => {
    const invalid = { ...questionChoiceTemplate, correctAnswer: ["A", "B"] };
    expect(questionPackageSchema.safeParse(invalid).success).toBe(false);
  });
  it("derives subjective max score from the rubric instead of asking authors to repeat it", () => {
    expect(subjectiveMaxScore(hydrateQuestionPackage(questionSubjectiveTemplate))).toBe(10);
  });
  it("rejects obsolete author-maintained metadata", () => {
    const invalid = { ...questionChoiceTemplate, primaryLearningGoal: "重复描述标签" };
    expect(questionPackageSchema.safeParse(invalid).success).toBe(false);
  });
  it("keeps teaching content out of manifest JSON", () => {
    const invalid = { ...termManifestTemplate, sections: [{ id: "body", title: "body", blocks: [] }] };
    expect(termPackageSchema.safeParse(invalid).success).toBe(false);
  });
  it("recognizes only author-declared term link markup", () => {
    expect(collectExplicitTermLinks("Softmax 与 [[term:softmax|显式 Softmax]]")).toEqual(["softmax"]);
  });
  it("shows only readable labels in non-interactive titles", () => {
    expect(richTextToPlainText("[[term:transformer|Transformer]] 的核心机制是什么？"))
      .toBe("Transformer 的核心机制是什么？");
  });
});
