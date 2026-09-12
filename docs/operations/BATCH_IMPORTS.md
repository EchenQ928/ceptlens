# Importing separate content files

Sign in with a developer account and open Content Manager.

- Questions: choose **Import question JSONs** and select several individual `.json` files with Ctrl/Command or Shift. Each question remains a separate source file.
- Terms: choose **Import term ZIPs** and select several individual teaching-package `.zip` files. Each ZIP contains its own `manifest.json` and `view.tsx`.

The browser sends the selected files together. The server stages every package, validates the resulting library, and activates one snapshot. References between packages in the same selection are validated together. If any package fails, none of the selection is published. Fix the reported file and select the files again.

New IDs add content; existing IDs update content. Duplicate IDs within one selection are rejected. Other server content and account records remain unchanged. The limit is 100 selected files and 25 MB total request size; term ZIPs share a 100 MB / 5,000-entry extraction limit.

Legacy single-question JSON, question-bundle JSON, and single-term ZIP endpoints remain supported. The new multipart endpoints are `POST /api/content/questions/import-files` and `POST /api/content/terms/import-files`, with one `files` field per source file. Developer sessions and administrator-token recovery use the existing authorization rules.

## Parallel work with UI changes

Develop features in separate Git worktrees and branches from current `main`. This import change touches only the Content Manager picker/handler, its API client, and server import handling; it does not replace visual styles or page layouts. Review the pull-request diff, incorporate any newer `main` changes, and run checks on the combined version before merging. Deploy the resulting main commit. Never deploy an older feature checkout over another developer's release.
