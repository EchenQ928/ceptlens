# Contributing

Use Node.js 22.18.0 or newer. From the repository root:

```bash
npm ci
npm run check
npm run test:services
```

Questions live in `content-libraries/questions/`. Term teaching packages live in `content-libraries/terms/`. Follow [`public/docs/DEVELOPER_GUIDE.md`](public/docs/DEVELOPER_GUIDE.md) and keep both `zh-CN` and `en-US` content complete.

Create a short-lived branch from `main`. Use one of these commit prefixes: `feat`, `fix`, `docs`, `content`, or `refactor`. Pull requests should describe behavior changes, verification results, and any data migration or deployment impact.

Do not commit API keys, `.env` files, real user data, SQLite databases, company-internal material, runtime tokens, or `node_modules/`.

Use the repository issue and pull request templates. Changes involving accounts, learning records, or model calls must explain migration, privacy, and rollback implications. Report security issues privately as described in [`SECURITY.md`](SECURITY.md).
