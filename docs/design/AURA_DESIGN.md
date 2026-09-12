# Aura design direction

## Context and goals

The owner's September 12 references establish atmospheric product presentation, precise typography, subtle glass edges, and fluid controls. The follow-up explicitly requests the same dark visual language throughout the platform: flowing gradients, Gaussian blur, micro-grain, hairline edges, soft glow and restrained motion. Home introduces CeptLens; learning surfaces prioritize reading. This branch is `codex/ui-aura`; the earlier `codex/ui-lens` design is preserved separately.

## Research and open-source foundations

- [Cruip Open](https://github.com/cruip/open-react-template): a comparable open-source SaaS landing page. Studied the hierarchy of atmospheric hero, focused call to action, and product feature cards. No template source or imagery copied.
- [Magic UI Interactive Hover Button](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/interactive-hover-button.tsx): MIT source inspected. Adapted its expanding fill and translating label pattern into `FlowLink`, retaining semantic router links and keyboard focus feedback. License reproduced in `THIRD_PARTY_NOTICES.md`.
- [Magic UI Typing Animation](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/typing-animation.tsx): studied its visibility-gated character timer. CeptLens uses a smaller one-shot implementation with reserved text dimensions, a complete screen-reader label, reduced-motion support, and cleanup.
- [Aceternity signup form](https://ui.aceternity.com/components/signup-form): researched focus-responsive inputs. Our implementation uses CSS focus-within, caret color, border and halo transitions, preserving native input behavior and autofill. No component code copied.
- [Motion](https://github.com/motiondivision/motion) and [useSpring](https://motion.dev/docs/react-use-spring): existing dependency supplies damped pointer response, entrance transitions, and question/drawer state changes.
- [Premium skill](https://github.com/bergside/awesome-design-skills/tree/main/skills/premium): hierarchy, consistent spacing, concise labels, and explicit accessible states. Noto Sans SC remains self-hosted for Chinese readability.

The supplied Overflow, bird, Grok, and SoundCore screenshots are visual references, not evidence that their original sites or artwork are open source. No logos, claims, customer counts, or proprietary artwork from them are incorporated.

## Tokens and components

- [RedSun](https://ovo-redsun.webflow.io/), Pro fico Academy and Grabient references inform the diffuse cyan/violet/warm light, fine boundaries and low visual noise. RedSun's public page was inspected; its interactive browser preview timed out. No template source or proprietary assets copied.
- The installed Glassmorphism skill supplies semantic surfaces, explicit states and legibility constraints; the owner's dark palette takes precedence over its default light palette.
- `src/styles/aura-dark.css` is the final theme layer. Canvas `#090b13`, opaque reading surface `#131722`, elevated surface `#181e2c`, text `#eff1f8`, secondary text `#acb7cd`, fine boundaries `#2a3244`. Link blue `#9baeff` and filled-action blue `#536dd5` are separate to preserve text contrast.
- Legacy plain white surface declarations now use `--surface-0`, including shared teaching visuals and authoring controls. Future teaching packages should use these tokens rather than fixed white backgrounds. Existing opaque bitmap assets are never inverted.
- Home, learning catalog, question/answer panels, term library, teaching article/visuals, assessment, login, account and companion controls share these foundations. Cyan, violet and muted warm accents establish hierarchy; green and rose identify answer feedback.
- Body and teaching copy 16–18 px; controls 14–15 px; small editorial labels are secondary only.
- Controls 46–50 px high; cards 16–20 px radius; restrained 1 px borders.
- Home: layered CSS light field, concise introduction, real links to three modes, actual library counts. Card illustrations communicate question selection, timed assessment, and concept relationships.
- Search: focus halo, responsive search glyph, visible entered-text state. No moving placeholder or automatic edits to the learner's text.
- Buttons: fill/label choreography for the main entry; consistent press, sheen, focus and disabled states elsewhere.
- Account entry: atmospheric two-column desktop composition, single-column form on phones. Existing authentication and visitor logic retained.
- Assistant: animated waiting dots only while a real request is pending. No simulated streaming of completed answers.

## Accessibility and motion

Semantic links/buttons retain names. Duplicated visual button labels are aria-hidden. Typing exposes the full sentence to assistive technology without character-by-character announcements. It runs once, reserves its final dimensions, and immediately shows full text under reduced motion. Background motion has an explicit pause control and stops when offscreen or the document is hidden. Inputs remain native, including IME, keyboard submission, password autocomplete and focus.

Do not delay question/answer content behind typing effects; do not add decorative motion to reading text; do not repurpose status colors as decorations. Reduced-motion preferences disable CSS animations and transitions.

The new gradient field uses a 24-second alternating cycle with 2% drift and no JavaScript render loop. Study backgrounds and grain remain static. Question travel is limited to 18 px on entry and 12 px on exit, with no scale change; answer selection uses a fading halo instead of a bounce. Hover lift is capped at 2 px on overview cards and removed from reading controls. Native focus, disabled and error states remain explicit.

Acceptance checks: verify text contrast on selected/correct/wrong options and the new K/V cache cell; verify animation pause freezes the gradient; check no horizontal page overflow at 390 px; check question changes clear the answer panel. Account and authoring styles inherit the same tokens; privileged account actions are not part of visual QA.

## Preview and QA

Run the existing content host on 8765, then in this worktree:

```powershell
$env:CEPTLENS_DATA_DIR='D:\Desktop\CeptLens\service-data'
npm run dev:ui -- --port 8772
```

Content is read from the current published snapshot, not copied into Git. Accounts, authored packages, assessments and logs stay with the existing host. No deployment is part of this design preview.

Review desktop (1440 px) and phone (390 px), Chinese and English, pause/play, CTA hover/keyboard focus, sign-in/visitor entry, searches, question selection/reveal/next, term navigation, assessment introduction, and assistant input. Run `npm run check`, a snapshot build, and inspect browser errors.
