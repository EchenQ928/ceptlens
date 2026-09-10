# Contributing to CeptLens

CeptLens is intended to be approachable for developers worldwide. Please keep public code, comments, commit messages, issue discussions, pull request titles, and documentation in English.

Chinese learning content is welcome when it appears as the `zh` value next to the English source. The English version should be treated as the canonical editing copy.

## Development Flow

1. Install dependencies with `npm install`.
2. Make focused changes.
3. Run `npm run check`.
4. Open a pull request that explains the learning or product behavior changed.

## Content Guidelines

- Keep explanations practical for software engineers.
- Prefer concrete model behavior over vague analogies.
- Link terms with `[[term:term-id|label]]` only when the term exists in `content-libraries/library.json`.
- Keep questions objective and make every option plausible enough to test understanding.
- Add both English and Chinese text in the same change.

## Code Guidelines

- Keep modules small and easy to read.
- Prefer browser-native behavior and local state unless a server feature is necessary.
- Avoid adding dependencies for simple formatting or state helpers.
