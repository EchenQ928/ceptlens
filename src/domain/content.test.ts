import { describe, expect, it } from "vitest";
import { library, orderedQuestions, stripRichText, termLinks, validateLibraryData } from "./content";

describe("content library", () => {
  it("contains the expected bilingual learning corpus", () => {
    expect(library.terms).toHaveLength(27);
    expect(library.questions).toHaveLength(34);
    expect(library.terms.every((term) => term.title.en && term.title.zh)).toBe(true);
    expect(library.questions.every((question) => question.prompt.en && question.prompt.zh)).toBe(true);
  });

  it("keeps question order contiguous", () => {
    expect(orderedQuestions.map((question) => question.order)).toEqual(
      Array.from({ length: 34 }, (_, index) => index + 1)
    );
  });

  it("parses and strips explicit term links", () => {
    const text = "Read [[term:transformer|Transformer]] next.";
    expect(termLinks(text)).toEqual([{ id: "transformer", label: "Transformer" }]);
    expect(stripRichText(text)).toBe("Read Transformer next.");
  });

  it("rejects duplicate question identifiers", () => {
    const duplicate = {
      ...library,
      questions: [...library.questions, library.questions[0]]
    };
    expect(() => validateLibraryData(duplicate)).toThrow("Duplicate question id");
  });
});
