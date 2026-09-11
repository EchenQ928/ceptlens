import { expect, it } from "vitest";
import raw from "../../content-libraries/templates/question-choice.template.json";
import { hydrateQuestionPackage, toQuestionSource } from "./schemas";
import { highlightedTermIds } from "./highlightedTerms";

it("preserves author-owned term selections through export and ignores unreferenced IDs", () => {
  const source = {...raw, stem:"Explore [[term:self-attention|self-attention]].", highlightedTerms:["self-attention","unreferenced"]};
  const question = hydrateQuestionPackage(source);
  expect(highlightedTermIds([question,question])).toEqual(["self-attention"]);
  expect(hydrateQuestionPackage(toQuestionSource(question)).highlightedTerms).toEqual(source.highlightedTerms);
});
it("accepts older packages and rejects duplicate or malformed highlighted IDs", () => {
  expect(highlightedTermIds([hydrateQuestionPackage(raw)])).toEqual([]);
  expect(()=>hydrateQuestionPackage({...raw,highlightedTerms:["kv-cache","kv-cache"]})).toThrow();
  expect(()=>hydrateQuestionPackage({...raw,highlightedTerms:["invalid id"]})).toThrow();
});
