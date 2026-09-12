# Liquid motion — 2026-09-12

The owner requested a substantial extension of example C's dynamic material:
refraction as pages scroll, fluid mode selection, and responsive buttons/icons.
`codex/ui-liquid-motion` starts from `a183d64`; `codex/ui-spectral-static` preserves
that reviewed static material. The preview continues on port 8773.

## Implementation

1. **Window refraction.** `liquidScene.ts` supplies visible DOM window bounds to
   the existing spectral renderer, with a maximum of 12 surfaces. A rounded-window
   distance field supplies the edge normal. Incident/transmitted angles bend the
   sampled light field; a small RGB separation and view-dependent rim reflection
   establish curved glass thickness. Reading DOM is separate and never captured.
   This applies to learning/catalog, term cards/articles, assessment, contextual
   windows and the sign-in form. No extra per-window Canvas is allocated.
2. **Scroll transmission.** Scroll events invalidate geometry once for the next
   rendered frame. A damped scroll offset changes the background's optical depth;
   scroll velocity briefly changes the edge response and decays after scrolling
   stops. DOM layout, pointer targets, formulas and reading text are not displaced.
   Refracted panes reduce grain in the transmitted field instead of filtering glyphs.
3. **Liquid selection.** `LiquidSelection` puts one moving glass capsule below
   native links/buttons. Separate position and width springs preserve velocity
   during interrupted transitions. Speed elongates and compresses the capsule,
   which returns to its resting proportions. Used in the top navigation, learning
   mode selector and term filter. Labels and hit areas stay at their layout positions.
4. **Controls and icons.** One delegated event controller supplies press deformation,
   release settling and icon follow-through. A pointer-driven highlight responds
   locally to hover. Answer options animate their key; large cards animate their
   symbol, avoiding motion of teaching paragraphs. Keyboard activation receives
   feedback too. There is no fake delay before a real action completes.

The window shader samples the controlled CeptLens spectral field, not arbitrary
DOM screenshots. The pill uses CSS optical layers plus spring deformation; it is
not a physically accurate refraction of HTML text. We have not added the entire
upstream WebGL/WebGPU demo as a runtime dependency.

## Source and license

[Liquid Glass Studio](https://github.com/iyinchao/liquid-glass-studio) was inspected
locally. `fragment-main.glsl`'s curved-edge incident/transmitted-angle calculation
was adapted to CeptLens's analytic background. `App.tsx`'s speed-sensitive spring
shape informed the selection capsule. MIT, Copyright (c) 2024 Charles Yin; license
retained at `public/spectral/LIQUID-GLASS-LICENSE.txt` and referenced in
`THIRD_PARTY_NOTICES.md`. Photographs, videos and demonstration assets are not copied.
Inspected upstream revision: `f7b28c36305a862f5cffed3ddd51511cf1204f56`.

The existing Paper Shaders and Motion dependencies are retained. No new runtime
dependency or external design service is required.

## Motion and performance rules

- Keep at most one environmental Canvas, at the existing 60fps desktop / 30fps
  phone targets and adaptive pixel budgets. The new shader chunk is about 22.3KB
  minified / 7.3KB gzip, roughly 2.4KB / 0.9KB more than the preceding version.
- Window geometry is recalculated on scroll, resize, content changes and a short
  settling interval. Idle pages do not measure every DOM window on every frame.
- Stop rendering when hidden/offscreen. Remove scroll observation with the renderer.
- Paused/focus mode disables refractive-window rendering and retains the current
  background frame with the CSS frosted material; this avoids stale edge geometry
  when a paused page scrolls. Exiting focus restores live refraction.
- Reduced motion shows the poster and uses immediate selection changes. No delegated
  press animation is installed. Reduced transparency retains solid reading surfaces.
- Press feedback handles pointer release outside the control, pointer cancellation,
  window blur and keyboard activation. Repeated input replaces unfinished feedback.
- The main window's refractive lip is 26px; smaller context windows use a slightly
  stronger lip. Do not distort an entire question, move a button target, or add
  oscillating motion to body text.

## Validation

Existing lifecycle and interaction tests are retained. Additional scene tests cover
moving window alignment, exclusion of offscreen/hidden surfaces, the visible-surface
cap, damped scroll and cleanup. Browser review includes continuous mode switches,
term filters, keyboard focus, scrolling, question selection/reveal and focus mode.
Real local cadence and fallback checks are recorded with delivery; these are not
cross-device guarantees. No assessment submissions or production deployment are
part of this design iteration.

- `npm run check`: 46 test files / 173 tests, content validation and production build passed.
  After the last geometry/cleanup refinement, the eight scene/lifecycle tests and
  production build were rerun successfully. Existing main-bundle size warning remains.
- Verified the actual linked GPU program exposes the new glass, viewport and scroll
  uniforms. A stale Vite shader cache was cleared by restarting the local preview.
  Restart the preview when changing its shader interface; do not rely on a retained
  development WebGL context to reflect a new uniform layout.
- Desktop term directory: 12 tracked windows, full quality, about 60fps both before
  and after scrolling. Phone at 390px: about 30fps, no horizontal overflow.
- Verified term filters, native keyboard focus, selecting an answer, revealing it,
  advancing a question, entering/exiting focus and real WebGL context-loss fallback.
