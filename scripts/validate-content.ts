import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { collectExplicitTermLinkDetails, formatZodErrors, questionPackageSchema, questionRichText, termPackageSchema } from "../src/domain/schemas";
import type { TermDependency } from "../src/domain/content";
import { validateSourceImports } from "../server/term-package-policy.mjs";

const root = resolve(import.meta.dirname, "..");
const questionDirectory = resolve(root, "content-libraries/questions");
const termDirectory = resolve(root, "content-libraries/terms");
const generatedDirectory = resolve(root, "content-libraries/.generated");
const errors: string[] = [];
await mkdir(questionDirectory, { recursive: true });
await mkdir(termDirectory, { recursive: true });

async function filesBelow(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(path));
    else result.push(path);
  }
  return result;
}

const questionFiles = (await readdir(questionDirectory)).filter((file) => file.endsWith(".json"));
const questions: Array<ReturnType<typeof questionPackageSchema.parse>> = [];
const questionDependencies: Record<string, TermDependency[]> = {};
for (const file of questionFiles) {
  const value = JSON.parse(await readFile(resolve(questionDirectory, file), "utf8"));
  const parsed = questionPackageSchema.safeParse(value);
  if (!parsed.success) errors.push(...formatZodErrors(parsed.error).map((error) => `${file}: ${error}`));
  else {
    questions.push(parsed.data);
    questionDependencies[parsed.data.id] = collectExplicitTermLinkDetails(questionRichText(parsed.data)).map((dependency) => ({
      ...dependency,
      reason: `题目“${parsed.data.taxonomy.primaryConcept}”中显式引用。`
    }));
  }
}

const termFolders = (await readdir(termDirectory, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
const terms: Array<ReturnType<typeof termPackageSchema.parse>> = [];
const termSourceById = new Map<string, string>();
for (const folder of termFolders) {
  const packageRoot = resolve(termDirectory, folder);
  for (const file of ["manifest.json", "view.tsx"]) {
    try { await access(resolve(packageRoot, file)); } catch { errors.push(`${folder}: 教学包缺少 ${file}`); }
  }
  try {
    const value = JSON.parse(await readFile(resolve(packageRoot, "manifest.json"), "utf8"));
    const parsed = termPackageSchema.safeParse(value);
    if (!parsed.success) errors.push(...formatZodErrors(parsed.error).map((error) => `${folder}/manifest.json: ${error}`));
    else {
      terms.push(parsed.data);
      if (parsed.data.id !== folder) errors.push(`${folder}: 文件夹名必须与 manifest.id (${parsed.data.id}) 一致`);
    }

    const sourceFiles = (await filesBelow(packageRoot)).filter((file) => [".ts", ".tsx"].includes(extname(file)));
    const sources = await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")));
    const combinedSource = sources.join("\n");
    termSourceById.set(folder, combinedSource);
    const viewSource = await readFile(resolve(packageRoot, "view.tsx"), "utf8");
    if (!new RegExp(`termId:\\s*["']${folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(viewSource)) errors.push(`${folder}/view.tsx: 导出的 termId 必须与文件夹一致`);
    sources.forEach((source, index) => {
      try { validateSourceImports(sourceFiles[index].slice(packageRoot.length + 1).replaceAll("\\", "/"), source); }
      catch (error) { errors.push(`${folder}: ${error instanceof Error ? error.message : String(error)}`); }
    });
  } catch (error) {
    errors.push(`${folder}: 无法读取教学包：${error instanceof Error ? error.message : String(error)}`);
  }
}

const duplicate = <T>(values: T[]) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
for (const value of duplicate(questions.map((item) => item.id))) errors.push(`重复题目 ID：${value}`);
for (const value of duplicate(terms.map((item) => item.id))) errors.push(`重复词条 ID：${value}`);
for (const value of duplicate(questions.map((item) => item.ordering.order))) errors.push(`重复题目顺序：${value}`);

const questionIds = new Set(questions.map((question) => question.id));
const orderByQuestionId = new Map(questions.map((question) => [question.id, question.ordering.order]));
for (const question of questions) {
  for (const prerequisiteId of question.ordering.prerequisites) {
    if (!questionIds.has(prerequisiteId)) errors.push(`${question.id}: 前置题目不存在 ${prerequisiteId}`);
    else if ((orderByQuestionId.get(prerequisiteId) ?? Infinity) >= question.ordering.order) errors.push(`${question.id}: 前置题目 ${prerequisiteId} 必须排在当前题之前`);
  }
}

const termIds = new Set(terms.map((term) => term.id));
const termTitleById = new Map(terms.map((term) => [term.id, term.title]));
const termDependencies: Record<string, TermDependency[]> = {};
for (const term of terms) {
  const linked = collectExplicitTermLinkDetails(`${term.summary}\n${term.coreConclusion}\n${termSourceById.get(term.id) ?? ""}`);
  const dependencies = new Map(linked.map((dependency) => [dependency.id, { ...dependency, reason: `词条“${term.title}”正文中显式引用。` }]));
  for (const prerequisiteId of term.prerequisites) if (!dependencies.has(prerequisiteId)) dependencies.set(prerequisiteId, {
    id: prerequisiteId,
    title: termTitleById.get(prerequisiteId) ?? prerequisiteId,
    reason: `词条“${term.title}”将其声明为阅读前置。`
  });
  if (dependencies.has(term.id)) errors.push(`${term.id}: 词条不能链接自身`);
  termDependencies[term.id] = [...dependencies.values()];
}

const missingConsumers = new Map<string, { title: string; reasons: Set<string>; consumers: Set<string> }>();
const recordMissing = (dependency: TermDependency, consumer: string) => {
  if (termIds.has(dependency.id)) return;
  const current = missingConsumers.get(dependency.id) ?? { title: dependency.title, reasons: new Set(), consumers: new Set() };
  current.reasons.add(dependency.reason);
  current.consumers.add(consumer);
  missingConsumers.set(dependency.id, current);
};
for (const question of questions) for (const dependency of questionDependencies[question.id] ?? []) recordMissing(dependency, `题目 ${question.ordering.order} · ${question.id}`);
for (const term of terms) for (const dependency of termDependencies[term.id] ?? []) recordMissing(dependency, `词条 ${term.title} · ${term.id}`);

const gapRows = [...missingConsumers.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([termId, value]) => `| ${termId} | ${value.title} | ${[...value.consumers].join("；")} | ${[...value.reasons].join("；")} |`);
const gapReport = `# 待导入词条教学包\n\n本文件由内容校验自动生成。正文中的显式链接是唯一依赖来源，作者不需要另填依赖清单。\n\n| 词条 ID | 名称 | 依赖来源 | 补充原因 |\n|---|---|---|---|\n${gapRows.length ? gapRows.join("\n") : "| — | 当前无缺口 | — | — |"}\n`;

await mkdir(generatedDirectory, { recursive: true });
await writeFile(resolve(generatedDirectory, "dependencies.json"), `${JSON.stringify({ schemaVersion: "1.0", terms: termDependencies }, null, 2)}\n`);
await writeFile(resolve(root, "content-libraries/CONTENT_GAPS.md"), gapReport);

if (errors.length) {
  console.error(`内容校验失败（${errors.length} 项）：\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

const p0Count = questions.filter((question) => question.taxonomy.priority === "P0").length;
console.log(`内容校验通过：${questions.length} 道题（P0 ${p0Count} 道）、${terms.length} 个定制词条教学包。`);
console.log(`显式词条依赖缺口：${missingConsumers.size} 个；依赖索引与缺口清单已自动生成。`);
