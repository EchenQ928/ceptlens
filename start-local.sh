#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "需要 Node.js 22.18.0 或更高版本。"
  exit 1
fi
node server/prepare-runtime.mjs
if [ ! -f dist/index.html ]; then
  npm run check
fi
node server/content-host.mjs --host 127.0.0.1 --port 8765
