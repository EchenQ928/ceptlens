# Accounts and publishing permissions

New visits open `/sign-in`. Learners can sign in, create an email/password account, or continue as a visitor. Authenticated sessions skip this entry page. Visitor entry is remembered for the browser session. The existing server database, accounts, discussions, and learning records are retained.

Every registration creates a learner account. A client-supplied role is ignored. A developer role grants content publishing, including question and term uploads, updates, recoverable deletion, and snapshot restore. The server checks the signed session on every mutation, so hiding or changing the navigation cannot grant access. Developers retain normal per-user isolation for progress, exams, and private assistant history.

## Grant the first developer

1. Sign up or sign in on the public website.
2. Open **Your account** and copy its Account ID.
3. As the repository/server owner, run GitHub Actions → **Owner tools** on `main`, with this request:

```json
{"operation":"grant-developer","userId":"ACCOUNT-UUID-FROM-PROFILE"}
```

The workflow uses the existing production deployment SSH credentials. It changes only the selected registered account's role and records an audit event. It cannot register an account, set a password, or select a role based on a self-asserted email address. Refresh the website; Content Manager becomes available without a token. Use `revoke-developer` to remove access immediately.

There is no public HTTP endpoint to grant developer roles. Database credentials, upload tokens, and SSH keys are not returned to the browser. Legacy token authentication remains available for existing automation and administrator recovery.

## Owner-assisted question publication

Normal authors use the website. For an owner-assisted batch upload, the same Owner tools workflow accepts `publish-questions`, a `bundleGzip` (base64-encoded gzip of a question bundle), and the uncompressed bundle's `sha256`. It passes that data over SSH to the active release's `scripts/owner-operation.mjs`. The script verifies size and checksum, then calls the existing server-local upload API using the server's own token. The API performs its normal validation, build, snapshot and activation steps. The content is an operational payload, never committed into the platform source tree. Workflow inputs are visible to repository operators; use the website for unpublished content that must not be included in action inputs.
