# Frosted Spectrum / 磨砂光谱

## Direction and material

This iteration lives on `codex/ui-spectral`, based on public release `d67a417`.
`codex/ui-aura` remains the preceding design and rollback reference. This document
supersedes the material and ambient-animation sections of `AURA_DESIGN.md`.

The owner chose the dark frosted material in example A, rejected B's loss of text
legibility, and chose C's liquid movement for controls rather than reading windows.
The subsequent review explicitly requested stronger transmitted colour and highlights.
The resulting material is intentionally more transparent than the first conservative
preview. Header branding, navigation, catalog, copy and teaching structure are retained.

`src/styles/spectral.css` is the final theme layer:

| Token | Purpose / value |
| --- | --- |
| `--spectral-ink` | Deep blue-black canvas, `#070c15` |
| `--spectral-panel` | Reading/form windows: 48% dark tint, diagonal specular veil, local blue reflection |
| `--spectral-glass` | Catalog/context windows: 34% dark tint with a brighter upper-left reflection |
| `--spectral-frost` | Background-only blur 20px, saturation 150%, brightness 104%; 14px/135% on phones |
| `--spectral-relief` | Bright upper lip, fine side reflection, darker lower rim, soft external shadow |
| `--spectral-inset` | 62% dark tint for nested answer options |
| `--ink-950` / `--ink-500` | Primary `#edf2fa`, secondary `#bdc9db` |

Translucency applies to backgrounds, never an ancestor's `opacity` or a filter over
text. Options, answer explanations and code/teaching surfaces provide local support
where content is dense. Status colours retain their meanings. The background's
brightest ribbons are biased toward the upper and outer edges of the workspace.
Do not put another blur on every nested answer or table cell.

Unsupported backdrop filtering, increased-contrast preferences and reduced-transparency
preferences use solid dark windows. This is a surface fallback, independent of WebGL.
Do not assume contrast is constant on arbitrary user-supplied photos; this material
is designed for the controlled CeptLens spectral field.

## Rendering and motion

- `SpectralBackdrop` owns one ambient Canvas per page. The shell chooses a preset
  for learning, concepts, assessment or account; Home and sign-in own their backdrop.
- `createSpectralRenderer` is lazy loaded and uses exactly `@paper-design/shaders@0.0.80`.
  `spectralShader.ts` is an original GLSL composition: layered curved ribbons,
  narrow luminous lips, diffusion and stable screen-space grain.
- Home's continuous period is 16 seconds. Workspace presets slow that clock down;
  assessment is dimmer and slower. Route uniforms blend over 600ms.
- Desktop mouse influence is limited to ±2% and damped. Text never follows the pointer.
- A matching exported WebP poster appears immediately, before GPU initialization.
- `ProductIcon` provides 13 original SVG silhouettes on a 32px optical grid. SVG masks
  constrain a one-shot 650ms reflection to each glyph on hover/keyboard focus.
- Home CTA orbs and the assistant glyph use 480–520ms shape/scale settling.
  These are CSS/SVG optical cues, not physical lens refraction of page text.
- Buttons and input edges respond in about 200–240ms. Existing Motion transitions
  handle navigation, question changes, selections, disclosures and drawers.
- The one-shot Home typing line has reserved dimensions, a full accessible label,
  and is omitted on phones. Teaching text is presented immediately.

## Performance and accessibility

The controller caps drawing at 60fps on desktop and 30fps on phones. The starting
pixel budgets are 2,000,000 and 480,000 respectively. A sustained three-second slow
window reduces those budgets to 850,000 / 240,000; sustained slowness after that
selects the poster. Quality decisions use the rendered-frame cadence, not an
unconditional React update on every frame.

Focus mode hides the learning rails and freezes the current environmental frame.
The pause control, hidden document and offscreen detection stop continuous drawing
without discarding the current frame. Reduced motion skips WebGL and shows the
poster. Initialization errors and actual WebGL context loss also select the poster.
Reduced motion disables optical sweeps and shape settling; state feedback remains clear.

Native inputs, labels, IME handling and keyboard order are retained. Focus outlines
remain visible. Correct/wrong/selected states use text and shape as well as colour.
Noto Sans SC remains self-hosted. A complete cross-browser accessibility audit is
outside the completed local checks below; do not describe these checks as certification.

## Visual board and local preview

Run the existing content host on port 8765, then in this worktree:

```powershell
$env:CEPTLENS_DATA_DIR='D:\Desktop\CeptLens\service-data'
npm run dev:ui -- --port 8773
```

- Home: `http://127.0.0.1:8773/#/`
- Learning: `http://127.0.0.1:8773/#/learn`
- Development-only art board: `http://127.0.0.1:8773/#/__spectral`
- Frozen real frame: `http://127.0.0.1:8773/?spectralFrame=0#/__spectral`
- Poster-only review: `http://127.0.0.1:8773/?spectralPoster=1#/`

The art board shows all icon sizes and controls. It exports the actual rendered
Canvas as WebP, records a 16-second WebM, and can deliberately lose the WebGL
context to verify fallback. These debugging routes/parameters are DEV-only.
The export controls are not shipped in the production route tree.

`public/spectral/{home,workspace,auth}.webp` were exported from this renderer. Together
they occupy about 355KiB; each route uses its corresponding poster. The shader chunk
is approximately 20KB minified / 6.4KB gzip. The 16-second local review recording is
kept in ignored `.ceptlens-runtime/spectral-loop.webm`, not the production bundle.

## Validation record — 2026-09-12

- `npm run check`: content validation, 45 test files / 170 tests, TypeScript and Vite
  build passed. The existing large-main-chunk warning remains.
- Lifecycle tests cover reduced motion, pause/resume, visibility/offscreen changes,
  context loss and initialization failure.
- The browser art-board context-loss control was exercised: the renderer disposed
  its Canvas, stopped drawing and displayed the matching static poster.
- Actual browser layout checked at 1440px and 1920px desktop and 390px phone widths.
  No horizontal page overflow in the checked Home/question views. Phone quality was
  tested after reload so its initial pixel budget matches the device.
- Desktop Home/question cadence observed at about 60fps; phone about 30fps. These are
  measurements on the current local browser, not guarantees for other hardware.
- Checked catalog selection, previous/next questions, answer reveal, focus/restore,
  term navigation and its step controls, sign-in/visitor entry, assessment introduction,
  Chinese field input and keyboard focus. Native OS IME composition was not automated.
- Authenticated administrative actions and assessment submission were not exercised
  for visual QA; their existing data and service contracts are unchanged.

Acceptance for future edits: inspect the brightest frame as well as the dark frame;
keep text sharper than the backdrop; check long Chinese labels, formulas, code,
correct/wrong answers and keyboard outlines; preserve the no-motion/no-WebGL path.

## External references and provenance

- **A — selected material:** [Motiq Glass Refraction Panel](https://motiq.dev/components/glass-refraction-panel).
  Reference for tint, diffuse transmission and local specular feedback. No source copied.
- **B — transparency comparison:** [rdev Liquid Glass React](https://github.com/rdev/liquid-glass-react)
  and [demo](https://liquid-glass.maxrovensky.com/). Its bright photographic demo informed
  the decision to retain dark support behind teaching content. Not added as a dependency.
- **C — motion reference:** [Liquid Glass Studio](https://github.com/iyinchao/liquid-glass-studio)
  and [demo](https://liquid-glass.iyinchao.cn/). Inspired small control deformations and
  travelling highlights; no shader/source copied from it.
- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials),
  [Fluent Materials](https://fluent2.microsoft.design/material), and
  [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
  informed luminosity support and separation of background filtering from foreground text.
- [Paper Shaders](https://github.com/paper-design/shaders) supplies `ShaderMount` under
  Apache 2.0. Its license and notice are retained in `public/spectral/` and covered by
  `THIRD_PARTY_NOTICES.md`. The CeptLens shader and optical icons are original source.
- Installed `glassmorphism` / `gradient` design skills informed semantic surfaces and
  hierarchy. Additional open-source guidance reviewed:
  [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
  and [Impeccable animation guidance](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/animate.md).
  These additional references were not installed or treated as a required workflow.

The supplied screenshots remain references. No third-party logos, product copy,
photography or generated imitation screenshots are included in the platform.
Source changes are versioned in Git; accounts, logs and published teaching packages
remain under the existing server/content workflow. This iteration does not deploy.
