# Authoring UI and platform preview

Content Manager and Content Lab use the Frosted Spectrum / liquid-glass presentation. The design was developed on `codex/ui-authoring`, based on `codex/ui-liquid-motion` at `698bfb7`, and selected as the `main` development baseline on 2026-09-12. Future work starts from the latest `main`; the earlier design branches remain comparison and rollback references. GitHub's Deploy workflow publishes the integrated platform revision to production.

## Content Manager

The asset catalog, history disclosure, connection panel, editor frame, and term inspector share the platform material. Question/package tabs use the moving glass selection. Catalog typography is larger; the header has a stable vertical hierarchy. Mobile actions retain text labels. JSON validation scrolls its error into view without moving keyboard focus.

## Content Lab

The authoring shell surrounds a real iframe viewport. Desktop preview uses available width; the phone preview uses a 390px viewport so package media queries behave normally. Expand preview gives the content the browser area. Escape collapses it, including from inside the preview. Practice and Read modes use the platform's question renderer. Pausing the background preserves answer input; changing the viewport restores the paused state after the frame loads.

The platform and Lab share exact copies of `QuestionPanel`, `TermReader`, `RichText`, the teaching SDK, ProductIcon, glass renderer, motion controls, fonts, and ordered platform styles. Preview disables progress writes and omits learner-account controls. Package CSS and teaching interactions remain package-owned. The Lab's controls are styled only in `content-lab/src/styles/lab.css`.

`npm run ui:sync` refreshes the standalone presentation bundle. `npm run ui:check` detects source drift; it runs in `check:all` and before creating/updating an external Lab workspace. Hashes in `content-lab/platform-ui.json` normalize text line endings for Windows and other platforms. A standalone Lab requires no parent checkout or production API to render content.

Update an existing authoring workspace with `npm run lab:workspace -- <directory> --update`, install its dependencies, then build/restart it. This uses the existing managed-workspace updater, which preserves `content-libraries/`. Both local workspaces were updated: Content Lab at port 8766 and KV Terms Lab at port 8776. The latter retains its three installed term drafts.

Preview parity is with the platform source revision bundled in this branch. Deploy the corresponding platform revision before comparing against the public site; a production site on an older release can look different.

## Verification

- Platform: `npm run check` (46 files / 173 tests and production build).
- Lab: `npm --prefix content-lab run check` (13 files / 50 tests and production build).
- `npm run test:content-workflow`: isolated HTTP upload, developer permissions, restored content, account preservation across release, and immediate role revocation passed.
- `npm --prefix content-lab run test:imports`: isolated import, replacement, failed-build preservation, checked export, and restart persistence passed.
- Browser: manager at 390/1440/1920px, question/package switching, inspector, invalid JSON and visible errors; Lab desktop and 390px content viewports, single-choice answer feedback, Chinese free-text input, Read mode, term step interaction, package selection, pause/resize, Escape, and import/remove cancellation.
- Bilingual titles previously crashed the import confirmation (an object reached React as a child). They are now resolved to the selected locale before display, covered by a regression test.
- Platform RichText and Lab preserve authored line breaks, including CRLF and blank lines. The release integration retains main's question-display behavior: Learn and Lab show the authored answer; rubrics and scoring remain in Assess.

The inherited main-bundle size warnings remain (platform about 1.1 MB, Lab about 0.89 MB before gzip). The shader stays in a separate lazy chunk (~22 KB); no second environment canvas is added to the Lab shell.

During QA, the existing local KV Cache draft showed literal `cdot` in its capacity formula: its JSX string attribute contains double backslashes. That is a package-source issue, outside this UI change; its files were preserved. The preview deliberately shows it as the platform renderer would, rather than concealing it.
