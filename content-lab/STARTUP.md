# Startup and dependency checks

The production site and the independent Content Lab support Node.js 22.18.0 or newer. Both projects use their lock files and validate the actual runtime tools before starting.

## Startup behavior

- Check the installed Node.js version and the native modules required by the build.
- Verify TypeScript, `tsx`, and Vitest can run.
- Install locked dependencies when required, including development tools and platform optional dependencies.
- If npm exits with an error but all required tools are usable, retain a warning and continue.
- Retry once for clear network, file-lock, or cache-integrity failures. Unknown failures stop startup.
- On Windows, the launcher uses UTF-8 output, supports paths containing spaces, and preserves startup logs.

## Failure logs

When startup fails, keep the earliest npm error and inspect:

- `.modelpath-runtime/startup-last.log`
- `.modelpath-runtime/startup-failed.log`
- `.modelpath-runtime/startup-warning.log`

Check logs for internal paths or credentials before sharing them. Never share content-management tokens or API keys.

The checks have been exercised with Node.js 22.18.0 locally. Windows-specific environment failures still need to be diagnosed from the first local error rather than by repeatedly launching the batch file.
