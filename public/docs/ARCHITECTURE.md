# Architecture

CeptLens has two independent deliverables:

- The production site provides learning, assessment, discussion, assistant, and content-management workflows.
- `content-lab/` provides local package authoring, preview, validation, and export.

They share the content package contract and teaching SDK, but do not share source paths, processes, tokens, databases, or draft directories.

## Production services

```text
src/                         React application
server/content-host.mjs      static content host and package publishing
server/learning-api.mjs      identity, discussions, assistant, and assessment API
server/community-store.mjs   Node SQLite persistence
server/exam-engine.mjs       paper selection, snapshots, scoring
server/agent-service.mjs     optional model calls and subjective grading
content-libraries/            questions and term packages
service-data/                 local service database
agent-runtime/                host-side model configuration and extension
```

The frontend reads questions and term manifests from `content-libraries/`. Term teaching pages are loaded as custom React modules. Shared discussions and assistant references do not modify teaching packages. Service data and model configuration remain outside the published frontend.

## Content boundaries

Questions use a stable JSON schema because their interaction is predictable: prompt, answer controls, result, and explanation. Term pages remain custom because a concept may need a diagram, formula, code example, animation, or focused experiment.

Authors declare a cross-link once with `[[term:id|label]]`. The platform derives dependencies, navigation links, and missing-package reports. It does not require hand-maintained dependency or navigation files.

## Publishing transaction

The content host stages imports, validates the content, checks package source imports, runs package tests, builds a staged frontend, and replaces the active content only after every step succeeds. Failed imports leave the previous content and build in place. A per-host lock prevents concurrent publishing.

Published content is served from the host's local `content-libraries/` directory. The service database remains in `CEPTLENS_DATA_DIR` across application releases.

## Content endpoints

- `POST /api/content/questions/import`
- `DELETE /api/content/questions/:id`
- `GET /api/content/questions/export`
- `POST /api/content/terms/import`
- `DELETE /api/content/terms/:id`
- `GET /api/content/terms/:id/export`
- `GET /api/content/terms/export`
- `GET /api/content/templates/term`

Write operations require the content-management token and a permitted origin. See [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) for the package contract.
