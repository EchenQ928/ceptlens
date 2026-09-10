# Security Policy

CeptLens is in beta. Never include passwords, API keys, deployment private keys, real user data, database files, or complete production logs in public issues.

## Reporting a vulnerability

Please use GitHub [Private vulnerability reporting](https://github.com/EchenQ928/ceptlens/security/advisories/new). Include the affected version or commit, reproduction steps, impact, and a suggested fix. If private reporting is unavailable, open an issue with only a non-sensitive placeholder and do not disclose exploitation details.

We will acknowledge reports, assess their impact, and publish a fix notice when appropriate. Give maintainers reasonable time to address a vulnerability before public disclosure.

## Runtime security baseline

- Production must use HTTPS, an independent data directory, and an environment file with mode `600`.
- Keep secrets on the server or in GitHub Secrets; never commit them.
- Use a dedicated SSH key and least-privilege deployment account. Revoke and rotate credentials after exposure.
- The AI assistant is disabled by default. When enabled, set usage limits and do not send private learning data to an unapproved model provider.
- Back up the production database outside the application host and rehearse restoration regularly.
