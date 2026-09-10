# Deployment Notes

CeptLens can be deployed as a static Vite build served by the small Node host in `server/content-host.mjs`.

## Required Runtime

- Node.js 20 or newer.
- `npm ci --include=dev` during deployment, because the build uses TypeScript and Vite.
- A reverse proxy such as Nginx or another HTTPS terminator in front of the Node process.

## Build

```bash
npm ci --include=dev --no-audit --no-fund
npm run check
```

## Serve

```bash
CEPTLENS_PUBLIC_ORIGIN=https://ceptlens.com \
CEPTLENS_PORT=4173 \
npm run host
```

## Health Check

```bash
curl -fsS http://127.0.0.1:4173/api/content/status
```

Expected fields include `ok`, `version`, `publicUrl`, `questionCount`, and `termCount`.
