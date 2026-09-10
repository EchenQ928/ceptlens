import rawLibrary from "../content-libraries/library.json";
import { validateLibraryData } from "../src/domain/content";

const library = validateLibraryData(rawLibrary);
const missingEnglish = [
  ...library.terms.flatMap((term) => [
    ...(term.title.en ? [] : [`term:${term.id}:title.en`]),
    ...(term.summary.en ? [] : [`term:${term.id}:summary.en`]),
    ...(term.coreIdea.en ? [] : [`term:${term.id}:coreIdea.en`])
  ]),
  ...library.questions.flatMap((question) => (question.prompt.en ? [] : [`question:${question.id}:prompt.en`]))
];

if (missingEnglish.length > 0) {
  throw new Error(`Missing English content:\n${missingEnglish.join("\n")}`);
}

console.log(
  `Validated CeptLens ${library.version}: ${library.terms.length} bilingual terms, ${library.questions.length} bilingual questions.`
);
