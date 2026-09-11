#!/usr/bin/env bash
set -Eeuo pipefail
archive=${1:?archive required}
version=${2:?commit SHA required}
[[ "$version" =~ ^[0-9a-f]{40}$ && "$archive" == "ceptlens-$version.tar.gz" ]] || exit 2
base=/srv/ceptlens
release=""
previous=$(readlink -f "$base/current" || true)
exec 9>/run/lock/ceptlens-deploy.lock
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 18)) process.exit(1)'
release=$(mktemp -d "$base/releases/$version-XXXXXX")
install -d -o ceptlens -g ceptlens "$release"
tar -xzf "$base/releases/$archive" --no-same-owner -C "$release"
chown -R ceptlens:ceptlens "$release"
cd "$release"
runuser -u ceptlens -- npm ci --include=dev --no-audit --no-fund
# Inspect the actual service, including Node --env-file arguments. Only storage
# paths leave the inspector process; production secrets never enter build logs.
locations=$(node scripts/inspect-storage.mjs --lines --require-absolute)
data=$(printf '%s\n' "$locations" | head -n 1)
store=$(printf '%s\n' "$locations" | tail -n 1)
[[ "$data" == /* && "$store" == /* && "$store" != / ]] || exit 2
install -d -o ceptlens -g ceptlens "$store"
runuser -u ceptlens -- node --input-type=module -e '
  import { openSync, writeFileSync, closeSync } from "node:fs";
  const fd = openSync(process.argv[1], "wx", 0o600);
  writeFileSync(fd, JSON.stringify({pid: Number(process.argv[2]), kind: "deployment", startedAt: new Date().toISOString()})); closeSync(fd);
' "$store/publication.lock" "$$"
trap 'rm -f -- "$store/publication.lock"' EXIT
backup="$store/deploy-backups/$(basename "$release")"
install -d -o ceptlens -g ceptlens "$backup"
had_content=0
if [[ -f "$store/current.json" ]]; then
  cp -p "$store/current.json" "$backup/current.json"
  had_content=1
fi
rollback() {
  trap - ERR
  if [[ "$had_content" == 1 ]]; then
    cp -p "$backup/current.json" "$store/current.rollback"
    mv -f "$store/current.rollback" "$store/current.json"
  else
    rm -f -- "$store/current.json"
  fi
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$base/current.next"
    mv -Tf "$base/current.next" "$base/current"
    systemctl restart ceptlens
  else
    systemctl stop ceptlens || true
  fi
  echo 'Deployment failed; previous code/content selection restored. User database was not replaced.' >&2
  exit 1
}
trap rollback ERR
if [[ -n "$previous" && -f "$previous/.ceptlens-runtime/content-admin-token.txt" && ! -f "$store/runtime/content-admin-token.txt" ]]; then
  install -d -o ceptlens -g ceptlens "$store/runtime"
  install -o ceptlens -g ceptlens -m 0600 "$previous/.ceptlens-runtime/content-admin-token.txt" "$store/runtime/content-admin-token.txt"
fi
if [[ "$had_content" == 0 && -n "$previous" && -d "$previous/content-libraries" ]]; then
  # The legacy host does not know the new writer lock. Pause it for a consistent
  # first migration; later upgrades keep serving while the candidate builds.
  systemctl stop ceptlens
  cp -a "$previous/content-libraries" "$backup/legacy-content-libraries"
fi
seed="$release/content-libraries"
if [[ -n "$previous" && -d "$previous/content-libraries" ]]; then seed="$previous/content-libraries"; fi
runuser -u ceptlens -- env CEPTLENS_DATA_DIR="$data" CEPTLENS_CONTENT_DIR="$store" node scripts/prepare-content.mjs --lock-held --seed "$seed"
expected=$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).revision' "$store/current.json")
# Stop only after a successful build. This local DB recovery copy is consistent;
# encrypted off-host backups remain a separate operator responsibility.
systemctl stop ceptlens
for file in "$data"/ceptlens.sqlite*; do [[ ! -f "$file" ]] || cp -p "$file" "$backup/"; done
ln -sfn "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
systemctl start ceptlens
ready=0
for attempt in {1..30}; do
  if curl -fsS --max-time 5 http://127.0.0.1:8765/api/content/status | node -e '
    let text = ""; process.stdin.on("data", chunk => text += chunk);
    process.stdin.on("end", () => { const x = JSON.parse(text); if (!x.ok || x.contentRevision !== process.argv[1]) process.exit(1); });' "$expected"; then
    if curl -fsS --max-time 5 http://127.0.0.1:8765/ >/dev/null; then ready=1; break; fi
  fi
  sleep 1
done
[[ "$ready" == 1 ]]
systemctl is-active --quiet ceptlens
trap - ERR
printf 'Activated platform %s with content %s\n' "$version" "$expected"
