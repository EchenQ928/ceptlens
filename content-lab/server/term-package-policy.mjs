import { parseAst } from "rolldown/parseAst";
import { posix } from "node:path";

const testSourcePattern = /(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/;

export function isTermTestSource(path) {
  return testSourcePattern.test(path);
}

export function allowsTermSourceImport(path, specifier) {
  return specifier === "@term-sdk"
    || specifier === "react"
    || specifier === "lucide-react"
    || (isTermTestSource(path) && ["vitest", "react-dom/client", "katex"].includes(specifier))
    || (specifier.startsWith("./") && !specifier.includes("\\") && !posix.normalize(posix.join(posix.dirname(path), specifier)).startsWith("../"));
}

export function includeInRuntimeTermArchive(path) {
  return !isTermTestSource(path);
}

export function validateSourceImports(path, source) {
  const file = parseAst(source, { lang: path.endsWith(".tsx") ? "tsx" : "ts" }, path);
  function validate(node) {
    if (!node || typeof node.value !== "string" || !allowsTermSourceImport(path, node.value)) throw new Error(`${path} 包含不允许的导入：${node?.value ?? "动态路径"}`);
  }
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source) validate(node.source);
    if (node.type === "ImportExpression") validate(node.source);
    if (node.type === "CallExpression" && node.callee?.name === "require") validate(node.arguments[0]);
    if (node.type === "TSExternalModuleReference") validate(node.expression);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(file);
}

export function normalizeArchivePath(path) {
  const parts = path.replaceAll("\\", "/").split("/");
  if (!path || parts.some(part => !part || part === "." || part === ".." || /[:<>"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) || part === "node_modules")) throw new Error(`教学包包含非法路径：${path}`);
  return parts.join("/");
}
