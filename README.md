# CeptLens

CeptLens is an open-source bilingual learning platform for understanding AI model engineering through interactive term pages, practice questions, and assessments. The English interface and content are the default; Chinese remains available through the language switcher.

The repository contains the production learning platform and a separate local Content Lab for developing and previewing question and term packages. The Content Lab never connects to production data or publishes directly.

## Local setup

Requires Node.js 22.18.0 or newer:

```bash
npm ci
npm run check
npm run dev
```

Open http://127.0.0.1:8765/.

For production deployment, see [`public/docs/DEPLOYMENT.md`](public/docs/DEPLOYMENT.md).

## Project layout

- `src/`: frontend application and learning workflows
- `server/`: content, discussion, assistant, account, and assessment services
- `content-libraries/`: published questions and term teaching packages
- `content-lab/`: independent package authoring and preview workspace
- `public/docs/`: architecture, content development, and deployment documentation
- `agent-runtime/`: local model configuration templates; real credentials stay outside Git
- `docs/`: operational notes and historical records

## Content model

Questions are JSON packages. Term pages are executable teaching packages with a required `manifest.json` and `view.tsx`; custom visuals, formulas, code, and interactions remain inside each package. Explicit links such as `[[term:self-attention|self-attention]]` create the dependency index and missing-package report automatically.

The production Content Manager is available at `/#/developer`. The local Content Lab runs independently on port `8766`; see [`content-lab/README.md`](content-lab/README.md).

## Current scope

This is an early beta, not a high-assurance examination system. The assistant is disabled by default. Real user data, production SQLite databases, API keys, and deployment credentials are never part of the public repository.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Behavior and security reporting details are in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) and [`SECURITY.md`](SECURITY.md).
