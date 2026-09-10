#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 1 ]]; then
  SHA="$1"
  ARCHIVE_NAME="ceptlens-$SHA.tar.gz"
elif [[ $# -eq 2 ]]; then
  ARCHIVE_NAME="$1"
  SHA="$2"
else
  echo "Usage: $0 <40-character-git-sha>" >&2
  echo "   or: $0 <archive-name> <40-character-git-sha>" >&2
  exit 64
fi

if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid commit sha: $SHA" >&2
  exit 64
fi
if [[ "$ARCHIVE_NAME" != "ceptlens-$SHA.tar.gz" ]]; then
  echo "Archive name does not match commit sha: $ARCHIVE_NAME" >&2
  exit 64
fi

BASE_DIR="/srv/ceptlens"
ARCHIVE="$BASE_DIR/releases/$ARCHIVE_NAME"
RELEASE_DIR="$BASE_DIR/releases/$SHA"
CURRENT_LINK="$BASE_DIR/current"
HEALTH_PORT="${CEPTLENS_HEALTH_PORT:-8765}"

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

install -d -o ceptlens -g ceptlens "$RELEASE_DIR"
tar -xzf "$ARCHIVE" --no-same-owner -C "$RELEASE_DIR"
chown -R ceptlens:ceptlens "$RELEASE_DIR"
cd "$RELEASE_DIR"

runuser -u ceptlens -- npm ci --include=dev --no-audit --no-fund
runuser -u ceptlens -- npm run build

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
systemctl restart ceptlens

curl -fsS "http://127.0.0.1:$HEALTH_PORT/api/content/status" >/dev/null
curl -fsSI "http://127.0.0.1:$HEALTH_PORT/" >/dev/null

echo "CeptLens deployed: $SHA"
