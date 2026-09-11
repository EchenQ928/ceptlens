# Content Lab Guide

The Lab is a local package workspace. The production site owns shared content, learning, assessments, discussions, assistant calls, and publication. The two sites do not share processes, databases, tokens, or source directories.

## Local workflow

1. Start the Lab at `http://127.0.0.1:8766/`.
2. Select **Terms** or **Questions**.
3. Import a package, edit the files under `content-libraries/`, and save all changes.
4. Select **Check and refresh**.
5. Preview the result and select **Export**.
6. Open the production Content Manager at `/#/developer` and import the exported package with an authorized token.

The Lab never stores the production token and never publishes directly. A matching ID replaces a local or production package after validation; a new ID creates one.

## Term package structure

```text
<term-id>/
  manifest.json
  view.tsx
  explorer.tsx          optional custom interaction
  styles.module.css     optional local styles
  assets/               optional images or data
  *.test.tsx            optional development tests
```

The folder name, `manifest.id`, and exported `termId` must match. The smallest manifest is:

```json
{
  "schemaVersion": "3.0",
  "sdkVersion": "1.x",
  "id": "example-term",
  "title": {
    "zh-CN": "词条名称",
    "en-US": "Term name"
  },
  "summary": {
    "zh-CN": "一句话定义。",
    "en-US": "A one-sentence definition."
  },
  "coreConclusion": {
    "zh-CN": "核心结论。",
    "en-US": "The core conclusion."
  }
}
```

Use `aliases` for search terms and `prerequisites` for actual reading prerequisites. Do not add hand-written navigation, dependency, review, or release-state metadata.

`view.tsx` is a custom React page. Import shared components from `@term-sdk`: `Paragraph`, `TermText`, `TermSection`, `Formula`, `CodeBlock`, and `VisualFrame`. Package-local imports must use `./`; do not import private modules from the production site or Lab.

## Explicit links

Use `[[term:id|display label]]` inside `Paragraph`, `TermText`, manifest rich text, and other supported rich-text fields:

```text
See [[term:another-term|another concept]] for the prerequisite.
```

Only explicit links create dependencies. Missing target packages appear as pending entries and are written to the generated gap report. They do not block a question or package import.

## Question packages

Switch to **Questions** to import a single JSON file or a `question-bundle`. Question files keep `schemaVersion`, `id`, `type`, `stem`, answer content, `taxonomy`, and `ordering`. Use `single_choice`, `multiple_choice`, or `subjective`.

Keep the `zh-CN` and `en-US` values aligned. For subjective questions, use `subjectiveAnswer.referenceAnswer`, `rubric`, and optional `gradingInstruction`. The preview can show answers but does not create assessment records.

`ordering.order` must be unique. A question prerequisite must exist and have a smaller order. Do not add `termDependencies`; explicit links are the source of truth.

## Featured content

Use optional `featured: true` at the question's top level to mark a **Featured question / 精选题目**. Use `ceptCheck.featured: true` to mark only its **Featured CeptCheck / 精选 CeptCheck**. These selections are independent. Omit the field or set it to `false` to remove the mark.

The Questions library has separate filters for each selection. Badges appear in the list and beside the selected question or CeptCheck. This metadata travels with question exports; use a platform version that supports featured content when uploading it. Keep selections occasional and based on the insight or reasoning the content encourages.

## Import safety

Import validation runs in a temporary copy and includes format checks, package source-import checks, tests, TypeScript, and a production build. A failed operation does not replace the current draft. Concurrent file edits cancel the operation instead of overwriting them.

Teaching packages are executable source. The validation process is not a malicious-code sandbox. Import only packages from trusted contributors.

## Export

**Export term** and **Export question package** use the latest checked snapshot. Term runtime ZIPs retain the page, visuals, styles, and assets but exclude `*.test.*` and `*.spec.*` files. Upload exports to the production Content Manager; do not place the production token in a package or repository.

## Checks

```bash
npm run check
npm run test:imports
```

The first command validates content, runs the Lab test suite, type-checks, and builds the Lab. The second command exercises import, same-ID replacement, failed-build preservation, export filtering, and restart persistence in a temporary copy.


## Priority concept collection

Add optional `highlightedTerms: ["term-id"]` to a question to prioritize concepts for authoring. Include a matching explicit `[[term:term-id|label]]` reference in the question. The formal term library collects these selections into Concepts in focus; missing lessons remain upcoming. These selections travel with question uploads.
