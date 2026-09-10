import { textForLocale, type QuestionPackage, type TermPackage, type TermViewDefinition } from "../domain/content";
import { hydrateQuestionPackage, hydrateTermPackage } from "../domain/schemas";
import dependencyIndex from "../../content-libraries/.generated/dependencies.json";
import { lazy } from "react";

const questionModules = import.meta.glob("../../content-libraries/questions/*.json", { eager: true, import: "default" });
const termManifestModules = import.meta.glob("../../content-libraries/terms/*/manifest.json", { eager: true, import: "default" });
const termViewModules = import.meta.glob<{ default: TermViewDefinition }>("../../content-libraries/terms/*/view.tsx");

export const baselineQuestions = Object.entries(questionModules).map(([path, value]) => {
  try { return hydrateQuestionPackage(value) as QuestionPackage; }
  catch (error) { throw new Error(`题目包校验失败：${path}\n${error instanceof Error ? error.message : String(error)}`); }
}).sort((a, b) => a.ordering.order - b.ordering.order);

export const baselineTerms = Object.entries(termManifestModules).map(([path, value]) => {
  const id = path.split("/").at(-2) ?? "";
  try { return hydrateTermPackage(value, dependencyIndex.terms[id as keyof typeof dependencyIndex.terms] ?? []) as TermPackage; }
  catch (error) { throw new Error(`词条教学包清单校验失败：${path}\n${error instanceof Error ? error.message : String(error)}`); }
}).sort((a, b) => textForLocale(a.title, "zh-CN").localeCompare(textForLocale(b.title, "zh-CN"), "zh-CN"));

export const termViews = new Map<string, TermViewDefinition>();
for (const [path, load] of Object.entries(termViewModules)) {
  const id = path.split("/").at(-2)!;
  const Component = lazy(async () => {
    const { default: definition } = await load();
    if (definition?.termId !== id || !definition.Component) throw new Error(`词条教学包入口无效：${id}`);
    return { default: definition.Component };
  });
  termViews.set(id, { termId: id, Component });
}

for (const term of baselineTerms) {
  if (!termViews.has(term.id)) throw new Error(`词条 ${term.id} 缺少定制 view.tsx`);
}
