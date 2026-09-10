#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 64
fi

SHA="$1"
if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid commit sha: $SHA" >&2
  exit 64
fi

BASE_DIR="/srv/ceptlens"
ARCHIVE="$BASE_DIR/releases/ceptlens-$SHA.tar.gz"
RELEASE_DIR="$BASE_DIR/releases/$SHA"
CURRENT_LINK="$BASE_DIR/current"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Missing archive: $ARCHIVE" >&2
  exit 66
fi

if [[ -d "$RELEASE_DIR" ]]; then
  active_target="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
  if [[ "$active_target" == "$RELEASE_DIR" ]]; then
    echo "Release $SHA is already active."
    exit 0
  fi
  echo "Release directory already exists but is not active: $RELEASE_DIR" >&2
  exit 73
fi

mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
cd "$RELEASE_DIR"

npm ci --include=dev --no-audit --no-fund
npm run build

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
systemctl restart ceptlens

curl -fsS http://127.0.0.1:4173/api/content/status >/dev/null
curl -fsSI http://127.0.0.1:4173/ >/dev/null

echo "CeptLens deployed: $SHA"
