# Featured questions and CeptChecks

Editors can select a question, its CeptCheck, or both. The bilingual badges are “Featured question / 精选题目” and “Featured CeptCheck / 精选 CeptCheck”. These are editorial recommendations; they do not indicate difficulty, priority, or a learner's personal favorites.

Add optional boolean metadata to the author JSON:

```json
{
  "featured": true,
  "ceptCheck": {
    "stem": { "en-US": "Your check question", "zh-CN": "你的检查问题" },
    "featured": true
  }
}
```

This fragment shows the fields, not a complete question package. For a selected CeptCheck only, omit the top-level `featured` field. To remove a selection, remove its field or set it to `false`. A featured CeptCheck still requires its question text.

The question library and Content Lab have separate filters for featured questions and featured CeptChecks. A question selected in both categories appears under both filters. Filtering preserves the existing question order and never changes prerequisites.

Workflow: edit the author package, validate and preview in Content Lab, export, then upload through the platform's existing content management flow. The optional fields survive schema validation and question export. Deploy a platform version that supports this metadata before uploading newly marked packages to an older server.

Select sparingly, based on the quality of the reasoning a question invites. A useful candidate lets learners connect familiar ideas, discover a non-obvious consequence, or distinguish two superficially similar computations. A longer or harder question is not automatically a better candidate.
