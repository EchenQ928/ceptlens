# Deployment

The production beta runs on a Linux ECS host with Nginx and systemd. Node serves the application and API on loopback; Nginx provides the public HTTPS origin. Production content and service data must stay on local server storage, not in an iCloud-synchronized directory.

GitHub Actions runs `npm run setup` and `npm run check:all` for the deployment workflow. A release archive is created from the exact Git commit, uploaded to `/srv/ceptlens/releases/`, and activated by `/usr/local/bin/ceptlens-deploy-v3`.

The workflow also transfers the npm package cache populated by the validated build. It archives only `_cacache`, excluding npm configuration, credentials and logs, and verifies a fresh offline installation from those exact archives before uploading. The server runs `npm ci --offline` with that isolated cache and still checks package integrity against the lockfile. A missing or corrupt package fails before activation; the old site continues serving. Manual releases without a cache archive retain the online installation path.

## GitHub production secrets

Configure these secrets in the repository's `production` environment:

| Secret | Purpose |
| --- | --- |
| `CEPTLENS_DEPLOY_HOST` | ECS host name or address |
| `CEPTLENS_DEPLOY_USER` | Least-privilege deployment user |
| `CEPTLENS_DEPLOY_KEY` | Dedicated SSH private key |

The matching public key belongs in the deployment user's `~/.ssh/authorized_keys`. This key is not a GitHub token and is not an Alibaba Cloud AccessKey.

## Server baseline

1. Install Node.js 22.18.0 or newer and verify the version used by `sudo` and systemd.
2. Create the `ceptlens` service user and `/srv/ceptlens/releases/`. Keep `/var/lib/ceptlens` owned by the service user.
3. Install `deploy/ceptlens-deploy.sh` as `/usr/local/bin/ceptlens-deploy-v2` with mode `755`. Allow the deployment user to run it through `sudo`.
4. Install `deploy/ceptlens.service.example` as `/etc/systemd/system/ceptlens.service`, then run `systemctl daemon-reload` and `systemctl enable ceptlens`.
5. Create `/etc/ceptlens/ceptlens.env` with mode `600`:

```ini
NODE_ENV=production
CEPTLENS_DATA_DIR=/var/lib/ceptlens
CEPTLENS_PUBLIC_ORIGIN=https://ceptlens.com
CEPTLENS_AI_DISABLED=1
```

Set `CEPTLENS_CONTENT_TOKEN` to a random value in the production environment. Keep model keys and deployment credentials outside Git.

6. After the first successful release, install `deploy/nginx.conf.example`, replace the certificate and domain paths, run `nginx -t`, and reload Nginx.

`CEPTLENS_PUBLIC_ORIGIN` must be the exact HTTPS origin without a trailing slash. It is used for same-origin validation and must not be bypassed by removing the request `Origin`.

## Release and rollback

The deploy script:

- Rejects archives whose filename does not match the 40-character commit SHA.
- Installs each release in its own version directory.
- Runs locked dependency installation and a production build as `ceptlens`.
- Switches the `current` symlink only after the release is ready.
- Restarts systemd and checks the homepage, content status API, and service state.
- Restores the previous release when activation or health checks fail.

The service database stays in `/var/lib/ceptlens` across code releases. Keep old release directories until the new release has been verified and the database has been backed up.

## Manual verification

```bash
curl -fsS https://ceptlens.com/api/content/status
systemctl is-active ceptlens
readlink -f /srv/ceptlens/current
```

The status response should report the current version, 34 questions, 27 term packages, and the `term-teaching-package-v3` package format for the restored library.
