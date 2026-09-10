#!/usr/bin/env bash
set -Eeuo pipefail

archive=${1:?archive required}
version=${2:?commit SHA required}
[[ "$version" =~ ^[0-9a-f]{40}$ && "$archive" == "ceptlens-$version.tar.gz" ]] || exit 2
base=/srv/ceptlens
release="$base/releases/$version"
previous=$(readlink -f "$base/current" || true)
exec 9>/run/lock/ceptlens-deploy.lock
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 18)) process.exit(1)'
[[ ! -e "$release" ]] || { echo 'Release already exists; use a new commit' >&2; exit 1; }
install -d -o ceptlens -g ceptlens "$release"
tar -xzf "$base/releases/$archive" --no-same-owner -C "$release"
chown -R ceptlens:ceptlens "$release"
cd "$release"
runuser -u ceptlens -- npm ci --include=dev --no-audit --no-fund
runuser -u ceptlens -- npm run build

healthy() {
  curl -fsS --max-time 5 http://127.0.0.1:8765/api/content/status | node -e '
    let text = ""; process.stdin.on("data", chunk => text += chunk);
    process.stdin.on("end", () => { const data = JSON.parse(text); if (!data.ok || !data.questionCount || !data.termCount) process.exit(1); });'
}
rollback() {
  trap - ERR
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$base/current.next"
    mv -Tf "$base/current.next" "$base/current"
    systemctl restart ceptlens
  else
    systemctl stop ceptlens || true
  fi
  echo 'Deployment failed; previous release restored when available' >&2
  exit 1
}
trap rollback ERR
ln -sfn "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
systemctl restart ceptlens
ready=0
for attempt in {1..30}; do
  if healthy >/dev/null 2>&1 && curl -fsS --max-time 5 http://127.0.0.1:8765/ >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]]
systemctl is-active --quiet ceptlens
trap - ERR
printf 'Activated release %s\n' "$version"
