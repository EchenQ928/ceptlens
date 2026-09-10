# CeptLens partner onboarding

This guide is for the second developer joining CeptLens from a separate Windows computer.

The GitHub repository is the source of truth for code. The production server is `https://ceptlens.com/`. The local production host and the independent Content Lab are separate applications.

## 1. Install Windows tools

Install Git for Windows, Node.js 22.18.0 or newer, and a code editor. Optional: install GitHub Desktop and the Alibaba Cloud Workbench CLI.

```powershell
git --version
node --version
npm --version
```

The Node.js version must be `v22.18.0` or newer. Reopen PowerShell after installing Node.js if the command is not found.

## 2. Sign in to GitHub

The project currently uses the shared GitHub account `EchenQ928`. Sign in to <https://github.com/> with that account and complete its normal two-factor authentication.

Repository URL:

```text
https://github.com/EchenQ928/ceptlens.git
```

Clone over HTTPS from PowerShell. Git Credential Manager will open a browser sign-in flow when Git needs credentials:

```powershell
cd $HOME
git clone https://github.com/EchenQ928/ceptlens.git
cd .\ceptlens
```

If Git asks for a password, use the browser sign-in or a GitHub token generated through GitHub's account settings. Never put a token in the project folder or commit it.

GitHub Desktop can also clone the repository. Store the checkout outside OneDrive or another synchronized folder.

## 3. Install and verify CeptLens

From the repository root:

```powershell
npm run setup
npm run check:all
```

`npm run setup` installs the locked dependencies for the production project and independent Content Lab and creates a local `.env` from `.env.example`. The local `.env` is ignored by Git.

Start the production application and backend:

```powershell
npm start
```

Open <http://127.0.0.1:8765/>. The Content Manager is at <http://127.0.0.1:8765/#/developer>. The first backend startup creates a local content-admin token under `.ceptlens-runtime`; keep that token on this computer.

In a second PowerShell window, start the independent Content Lab:

```powershell
npm --prefix content-lab start
```

Open <http://127.0.0.1:8766/>. The Lab never connects to production data or publishes directly.

Stop either process with `Ctrl+C`.

## 4. Daily Git workflow

Do not work directly on `main`. Update it before each task, then create a short-lived branch:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/describe-the-change
```

Use commit prefixes `feat`, `fix`, `docs`, `content`, or `refactor`.

Before pushing:

```powershell
npm run check:all
git status
git add .
git commit -m "content: describe the change"
git push --set-upstream origin feature/describe-the-change
```

Open a Pull Request from the branch to `main`. Explain behavior changes, checks run, content changes, and deployment impact. The project owner reviews and merges it after the checks pass.

Because both developers currently use one GitHub account, GitHub cannot record two independent identities or count the author as another reviewer. The long-term arrangement should be two separate GitHub accounts with the partner added to the repository as a collaborator. Until then, use Pull Requests for discussion and have the non-author perform the final review from the shared account where practical.

## 5. Access the Aliyun server

The shared Alibaba Cloud account can open the ECS console. The CeptLens server is:

```text
Region: cn-hangzhou
Instance ID: i-bp10fwx8sy6i95miy9nr
Public IP: 112.124.67.145
Public site: https://ceptlens.com/
```

### Browser Workbench

1. Sign in to the shared Alibaba Cloud account.
2. Open **Elastic Compute Service** in region `cn-hangzhou`.
3. Open instance `i-bp10fwx8sy6i95miy9nr`.
4. Choose **Connect** or **Workbench**.
5. Log in as `ceptlens-partner` using the private SSH key and its passphrase supplied separately by the project owner.

The login name is `ceptlens-partner`, not the Alibaba Cloud account name. The server accepts SSH keys and does not accept SSH passwords.

The server's ED25519 host-key fingerprint is:

```text
SHA256:7KbtSzfFnlBZGY6ESngUp7fX4NZiPBhOPaF717phfXI
```

The owner can also supply a prepared `known_hosts` file. Keep it at `$HOME\.ssh\known_hosts`.

### Windows SSH fallback

Save the private key supplied by the project owner as:

```text
C:\Users\<WindowsUser>\.ssh\ceptlens-partner
```

Then run PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh" | Out-Null
icacls "$HOME\.ssh\ceptlens-partner" /inheritance:r | Out-Null
icacls "$HOME\.ssh\ceptlens-partner" /grant:r "$env:USERNAME:F" | Out-Null
ssh -i "$HOME\.ssh\ceptlens-partner" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$HOME\.ssh\known_hosts" ceptlens-partner@112.124.67.145
```

When prompted, enter the private-key passphrase. Accept the host key only when it matches the fingerprint above. Do not disable host-key checking.

After login, verify the account without changing anything:

```bash
whoami
hostname
sudo -n systemctl is-active ceptlens
readlink -f /srv/ceptlens/current
curl -fsS http://127.0.0.1:8765/api/content/status
```

The account has administrator rights because deployment, rollback, logs, and service maintenance require them. Treat every command as production-impacting and record server changes in a project issue or Pull Request.

## 6. Deployment

After a reviewed change is merged into `main`, GitHub Actions runs the checks, creates an archive from the exact commit, uploads it to Aliyun, activates it, and runs health checks. The deployment workflow uses protected GitHub environment secrets; they are not in the repository.

Do not copy `node_modules`, `.env`, SQLite files, `.ceptlens-runtime`, or production `service-data` into the repository or release archive. Production content and database state stay on the server.

Check the live service with:

```powershell
curl.exe -fsS https://ceptlens.com/api/content/status
```

The response should report `ok: true`, 34 questions, 27 term packages, and the current release version.

## 7. Content work

Questions are in `content-libraries/questions/`. Term teaching packages are in `content-libraries/terms/`. Keep both `en-US` and `zh-CN` content complete. Follow `public/docs/DEVELOPER_GUIDE.md` for the package format.

The Content Manager at `/#/developer` imports and exports content. The local Content Lab validates and previews packages before they are uploaded to the production Content Manager. It does not need production tokens or the production database.

## 8. Keep private

Never commit or upload `.env`, production environment files, API keys, model credentials, GitHub tokens, Alibaba Cloud AccessKeys, `.ceptlens-runtime`, service data, SQLite databases, build output, private user data, backups, the private server key, or its passphrase.

If a credential may have been exposed, stop using it and rotate it immediately through the relevant provider.

## 9. Useful commands

```powershell
npm run check:all
npm run check
npm run test:services
npm --prefix content-lab run check
npm --prefix content-lab run test:imports
git status
git branch --all
git pull --ff-only
```

When a command fails, keep the first error, the command used, the Node.js version, and the Git commit SHA.
