# Lens UI direction

A desktop-first visual redesign of CeptLens. The design starts from the owner’s supplied blue lens/lightbulb identity and uses a quieter layout than the reference composition.

## Reading hierarchy

- The home page prioritizes the next real question, followed by the learning loop and available topic collections. All counts and progress come from the content and progress repositories.
- The desktop study view gives the question most of the width, with one compact concept rail. Sequence navigation opens on demand; Focus removes the rail and provides a reading surface up to 900 px wide.
- The question library puts the primary concept first and shows a two-line question excerpt. More detailed filters are disclosed on demand. Track numbering is relative to the sequence, rather than exposing authoring sort keys such as 1001.
- Answer selection uses blue; correct answers use green with a checkmark and explicit feedback. Review feedback invites comparison with the explanation. Color is not the sole feedback signal.
- Linked concepts remain available inside the text. Missing-package badges move out of the question’s reading flow; their names and explanations remain in the contextual disclosure and hover titles.
- The term library starts with available lessons. Pending entries remain accessible through the existing filter.
- Welcome, navigation, assessment, account, and content-management surfaces inherit the same typography, color, and control language.

## Identity and motion

`public/brand/ceptlens-original.png` is the unmodified artwork supplied by the owner. `BrandIcon` frames its icon using an SVG viewBox. The wordmark uses live text for sharp rendering, and the favicon is a small vector adaptation.

The system font stack avoids third-party font requests. Blue marks primary actions, active navigation, concept links, and newly cached data. Warm warning colors remain available for real warnings and content availability.

Motion is brief and tied to interaction: button and card responses, answer reveals, view entry, and newly appended KV cache cells. The hero has a one-time entrance, not a looping distraction. `prefers-reduced-motion` disables these animations and transitions. Keyboard focus indicators and a skip-to-content link are provided.

## Local preview

Run the existing content host on port 8765, then run:

```text
npm run dev:ui
```

Open http://127.0.0.1:8770/.

The UI preview reads the current local published snapshot without copying it into Git or modifying it. With no local snapshot it falls back to the Git seed library. `CEPTLENS_DATA_DIR` / `CEPTLENS_CONTENT_DIR` can select an alternate local store. Restart the preview after publishing content to pick up a newer snapshot. API requests go to the local host on port 8765, so account and assessment actions use that host’s existing local data.

This transform exists only in the development-preview config. The normal production build and persistent-content deployment workflow remain unchanged. Runtime folders are excluded from file watching to avoid Windows handles interfering with atomic snapshot operations.

## Review

Review the welcome page, home, KV Cache library, a single-choice question, a written-response question, and a linked concept. Check both languages, selected/revealed answers, Focus, sequence navigation, filters, and the return-to-question trail.

Desktop is the primary target. Checked at a 1440 px desktop viewport and the app’s default desktop viewport; phone layout checked at 390 px, with a single-column reading surface and bottom navigation.

Existing content issues are separate from this visual redesign: for example, the authored KV Cache lesson still contains doubled backslashes in its capacity formula. No question or term package sources were rewritten in this branch.

This branch is intended for visual review before merging and deploying to the public site.
