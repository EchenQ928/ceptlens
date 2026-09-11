# Lens UI — interaction and clarity

Desktop comes first. The owner’s direction is concise, polished, vivid, and focused on understanding. A screen should not contain extra copy just to look complete.

## Structure

- A compact top navigation replaces the sidebar. Learn, Assess, and Concepts use short labels and icons; content management remains available to developers. The selected mode moves between destinations.
- Home is a product introduction: one headline, one sentence, three direct destinations, and an interactive KV Cache preview. The preview preserves previous K/V cells while appending new ones. It plays once, supports pause and manual steps, and pauses advancement when the document is hidden. Continue appears only when there is a previous question.
- The home route is visible without signing in. Existing sign-in/visitor entry and account controls still apply when entering other routes. The sign-in page is reduced to its form and visitor entry.
- The question library leads with concept titles and readable excerpts. Secondary metadata is available through filters. Reset appears only when filters are active. Question ordering, featured selections, and the KV Cache track are preserved.
- Study keeps the question prominent, with optional context and Focus. Sequence navigation is a compact disclosure. Blue indicates selection; green/check and explicit feedback indicate correctness. Related concepts are short links, not repeated summaries.
- Concepts show available lessons first. Featured links open actual available lessons; unavailable entries remain accessible through the status filter. Symbols and accents remain consistent for a given concept when searching.
- Assessment uses a warm introductory surface, clear question counts, timer/autosave rules, and a direct start action. Detailed scoring rules expand on demand. Incomplete papers and pending grading still withhold full scores.

## Typography and identity

Noto Sans SC Variable is self-hosted through `@fontsource-variable/noto-sans-sc`, including the upstream OFL license. Unicode-range font subsets load only when needed, without a runtime dependency on an external font service. Controls generally use 14–16 px, learning text 16–18 px, and question stems 23–26 px. Chinese headings use normal letter spacing.

`public/brand/ceptlens-original.png` is the owner’s unmodified artwork. `BrandIcon` frames the symbol with an SVG viewBox; the wordmark remains live text. Tiny slogans and repeated labels have been removed.

## Motion

- Shared navigation selection, page entrances, card hover/lift, and concept reveal on scroll.
- Directional question exit/entry with answer state reset between questions.
- Answer expansion/collapse, selection feedback, and new cache cells.
- Expandable filters and directories, assessment question entry, submission dialog entry, and assistant/discussion drawer entry and exit.
- Form-field entry, focused controls, buttons, and lesson preset responses.

Motion uses `motion/react` and CSS. `MotionConfig` and `useReducedMotion` respect the OS preference; CSS motion is disabled for that preference. Home autoplay is disabled in reduced-motion mode, while manual steps work. Exiting drawers become inert immediately. Study content never animates continuously while a learner reads it.

## Local preview

Run the existing content host on port 8765, then `npm run dev:ui`. Open http://127.0.0.1:8770/.

The preview reads the current local published content snapshot. It does not copy packages into Git or modify the content store. Without a local snapshot, it uses the Git seed library. `CEPTLENS_DATA_DIR` / `CEPTLENS_CONTENT_DIR` can select a different store. Restart the preview after publishing content to select the new snapshot. API calls use the local host on port 8765.

Normal production builds and deployment continue to use the existing persistent-content workflow. Accounts, assessments, logs, and authored packages remain outside this UI change. Runtime directories stay excluded from Vite watching to preserve Windows atomic file operations.

## Review

Check desktop first (1440 px), then phone (390 px), in Chinese and English. Review home playback/pause/manual steps, library filtering, single and multiple selection, answer reveal/reset, next/previous, Focus, question directory, term search and lesson presets, drawer open/close, assessment setup, and sign-in.

Run `npm run check` and build the current content snapshot with the UI preview config. Existing authored-content issues, such as doubled backslashes in a lesson formula, belong to the package workflow rather than platform styling.

This branch is a local design preview; it has not been merged or deployed to the public site.
