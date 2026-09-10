# Content Development Guide

CeptLens content is a versioned, bilingual library. The English interface is the default, and every published question or term package should provide both `zh-CN` and `en-US` values.

The production site exposes the Content Manager at `/#/developer`. The independent Content Lab is the preferred place to develop and preview packages; export a checked package from the Lab and import it through the production Content Manager.

## Question packages

Each question is one JSON file under `content-libraries/questions/`:

```json
{
  "schemaVersion": "3.0",
  "id": "unique-question-id",
  "type": "single_choice",
  "stem": {
    "zh-CN": "题干中的 [[term:self-attention|自注意力]]。",
    "en-US": "A question stem with [[term:self-attention|self-attention]]."
  },
  "options": [
    { "key": "A", "text": { "zh-CN": "选项 A", "en-US": "Option A" } },
    { "key": "B", "text": { "zh-CN": "选项 B", "en-US": "Option B" } }
  ],
  "correctAnswer": ["A"],
  "explanation": {
    "zh-CN": "解释为什么答案成立。",
    "en-US": "Explain why the answer is correct."
  },
  "taxonomy": {
    "primaryConcept": { "zh-CN": "主知识点", "en-US": "Primary concept" },
    "modelFamily": "G0 通用/跨模型",
    "learningLevel": "L0 通用基础",
    "engineeringStage": "E0 基础机制与模型计算",
    "priority": "P1"
  },
  "ordering": { "order": 999 }
}
```

Use `multiple_choice` with several `correctAnswer` keys when required. Use `subjective` with `subjectiveAnswer.referenceAnswer` and a `rubric` when the learner must write an explanation. Each rubric item contains `criterion` and `points`; the total score is derived automatically.

The optional `ceptCheck.stem` is a follow-up thinking prompt. `secondaryModelFamilies`, `secondaryEngineeringStages`, `knowledgeTopics`, `taskScenarios`, `optimizationObjectives`, and `runtimeEnvironments` are optional filters. Keep taxonomy values stable because they are used for catalog filtering.

### Explicit term links

Use `[[term:id|display text]]` in stems, options, explanations, reference answers, rubric items, and supported teaching components:

```text
The current Query reads historical [[term:kv-cache|KV Cache]] entries.
```

Only explicit links create term dependencies. Ordinary words are not automatically linked. A missing target package does not block a question; it appears in the term catalog as pending and is recorded in `content-libraries/CONTENT_GAPS.md`.

Do not add `termDependencies` to authored question files. The platform derives it from explicit links.

## Term teaching packages

Each term package is a directory under `content-libraries/terms/<id>/` with at least:

```text
manifest.json
view.tsx
```

The manifest uses `schemaVersion: "3.0"` and `sdkVersion: "1.x"`:

```json
{
  "schemaVersion": "3.0",
  "sdkVersion": "1.x",
  "id": "self-attention",
  "title": {
    "zh-CN": "自注意力",
    "en-US": "Self-attention"
  },
  "aliases": ["Attention"],
  "summary": {
    "zh-CN": "一句话定义。",
    "en-US": "A one-sentence definition."
  },
  "coreConclusion": {
    "zh-CN": "读者必须记住的结论。",
    "en-US": "The conclusion the reader must retain."
  },
  "prerequisites": []
}
```

`view.tsx` is a custom React teaching page. It may include a diagram, formula, code example, animation, or focused interactive experiment. Import shared teaching components from `@term-sdk`; keep package-local imports relative and do not import private modules from the production site or Lab.

The package SDK includes `Paragraph`, `TermText`, `TermSection`, `Formula`, `CodeBlock`, and `VisualFrame`. Use an explicit term link when another concept deserves its own page. Keep tests such as `*.test.tsx` in the development source; the export operation removes them from runtime ZIPs.

The folder name, `manifest.id`, and the exported `termId` in `view.tsx` must match. Do not add hand-maintained dependency lists, navigation lists, review records, or release-state fields.

## Import and publishing

1. Run `npm run validate`, `npm test`, and `npm run build`, or use the Lab's **Check and refresh** action.
2. For questions, import a JSON file or question bundle. For terms, import a complete teaching-package ZIP.
3. Enter the authorized content-management token in the production Content Manager.
4. Import the package. A new ID creates content; an existing ID replaces it after validation.
5. The service validates content, runs package tests, builds a staged release, and publishes only after all checks pass. A failed update keeps the previous content.

The production service writes published content to its local `content-libraries/` directory. Do not edit the production database or content directory through iCloud synchronization.

## HTTP content endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/content/questions/import` | Import one question or a question bundle |
| `DELETE` | `/api/content/questions/:id` | Delete a question |
| `GET` | `/api/content/questions/export` | Export the question library |
| `POST` | `/api/content/terms/import` | Import a term teaching-package ZIP |
| `DELETE` | `/api/content/terms/:id` | Delete a term package |
| `GET` | `/api/content/terms/:id/export` | Export one term package |
| `GET` | `/api/content/terms/export` | Export the complete term library |
| `GET` | `/api/content/templates/term` | Download the minimal term template |

Write endpoints require the content-management token and a same-origin request.

## Independent Content Lab

The Lab runs on `http://127.0.0.1:8766/`. It has its own package directory, lock file, validation process, and local server. It does not include production accounts, assessments, discussions, assistant calls, database files, or publishing credentials.

The workflow is:

```text
develop and preview in the Lab
  -> check and export a package
  -> open the production Content Manager
  -> import with an authorized token
```

See [`INDEPENDENT_LAB.md`](INDEPENDENT_LAB.md) and the Lab's [`LAB_GUIDE.md`](../../content-lab/public/docs/LAB_GUIDE.md) for operational details.

## Verification

From the repository root:

```bash
npm run check
npm run test:services
```

`npm run check` validates all content, runs unit tests, type-checks, and builds the production frontend. The service smoke test uses a temporary database and does not send requests to a real model or modify the production content library.
