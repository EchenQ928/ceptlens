# Independent Content Lab

The production site and Content Lab are separate projects:

- The production site serves learning, assessment, shared discussions, assistant features, and publishing.
- `content-lab/` handles local question and term package authoring, preview, technical checks, and export.

The Lab does not contain production accounts, assessment data, discussions, assistant credentials, service databases, or publishing tokens. Each collaborator has an independent draft directory.

## Workflow

```text
develop and preview in the Lab
  -> run checks and export a package
  -> open the production Content Manager
  -> import with an authorized content token
```

The Lab runs at `http://127.0.0.1:8766/`. The production Content Manager is at `/#/developer`. A matching ID updates an existing package; a new ID creates one. The production host remains the authority for final validation and publication.

Both projects use `schemaVersion: 3.0`, `sdkVersion: 1.x`, and the same teaching SDK contract. Daily content development does not require editing the production source. Upgrade the shared SDK only when the public package API or protocol changes.

The old embedded Lab directory is not part of the production project. Preserve any legacy draft directory separately, then migrate selected packages by export/import rather than copying a second application source tree.

See [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) and the Lab's [`LAB_GUIDE.md`](../../content-lab/public/docs/LAB_GUIDE.md).
