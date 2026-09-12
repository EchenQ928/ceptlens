# Question display checks

Learn mode displays the authored answer, including its line breaks, blank lines,
bold text, formulas and explicit term links. Subjective questions show
`subjectiveAnswer.referenceAnswer`. Choice questions show `explanation` and the
correct option keys. Rubrics, point allocations and grading instructions belong
in Assess; they are not rendered in either Learn mode or its preview.

CeptChecks and featured markers follow the package fields. An absent CeptCheck
must remain absent. Platform releases must not rewrite the content packages.

## Repeatable content audit

`src/components/QuestionDisplay.test.tsx` uses the portable templates by default.
To audit a published question-bundle export, set `CEPTLENS_QUESTION_AUDIT_FILE`
to its absolute path and run:

```sh
npx vitest run src/components/QuestionDisplay.test.tsx
```

The audit checks every question in English and Chinese, in practice and quick
Learn modes, comparing rendered text and breaks with the package. It also checks
formula errors, answer keys, optional CeptChecks, featured markers, and retention
of subjective rubrics in Assess review. Keep the export outside Git.

## KV Cache verification, 2026-09-12

- All 28 live KV Cache packages matched the approved publication export.
- All 56 language-specific Learn pages were opened in the browser against the
  corrected platform and published local content. Answer breaks matched the
  packages; no formula errors, grading panels or content-container overflow were found.
- Screenshot review covered an English subjective answer and Chinese subjective
  and calculation answers. Practice reveal was checked separately.
- Q10 remains a featured question; Q13 retains its featured CeptCheck. The 13
  approved CeptChecks remain present, and the other 15 questions have none.
