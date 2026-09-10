# CeptLens

CeptLens is an English-first bilingual learning platform for AI model engineering concepts. It is built for developers who want to understand model architecture, training behavior, and deployment tradeoffs through short lessons and objective questions.

The interface and developer documentation are written in English. Learning content is stored with English and Chinese fields so the product can switch language without changing source code.

## What Is Included

- A React and Vite single-page app.
- A compact bilingual concept library in `content-libraries/library.json`.
- Local progress tracking through browser storage.
- A small Node static host with `/api/content/status` for production health checks.
- Content validation, unit tests, production build, and service smoke tests.

## Quick Start

```bash
npm install
npm run check
npm run dev
```

Open `http://127.0.0.1:5173`.

## Project Layout

```text
content-libraries/   Bilingual lessons and questions
src/                 Frontend application
server/              Production static host
scripts/             Validation and smoke-test scripts
docs/operations/     Deployment notes
deploy/              Example server deployment files
```

## Content Model

The product uses one source of truth: `content-libraries/library.json`.

Each term and question keeps localized values as:

```json
{
  "en": "English copy",
  "zh": "中文内容"
}
```

Term links use this format inside localized text:

```text
[[term:transformer|Transformer]]
```

Run `npm run validate` after editing content. The validator checks duplicate identifiers, answer keys, broken term links, and minimum bilingual coverage.

## Production Host

Build and serve locally:

```bash
npm run build
CEPTLENS_PUBLIC_ORIGIN=https://ceptlens.com npm run host
```

The host exposes:

- `/` for the app.
- `/api/content/status` for health checks and content counts.

## License

MIT
