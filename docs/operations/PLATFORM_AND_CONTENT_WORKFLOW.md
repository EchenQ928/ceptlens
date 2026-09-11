# Working workflow: platform code and persistent content

Updated 2026-09-11. The immediate scope is file ownership, storage, publishing, and upgrades. Source privacy, repository history cleanup, new author roles, and track redesign are deferred.

## Where files belong

| Files | Location | How they change |
|---|---|---|
| Platform source, SDK, Content Lab runtime, templates, tests | GitHub and the developer checkout | Git commits and platform deployment |
| Initial/example question and term library | Git checkout `content-libraries/` | Used only to seed a new server/local store; later deployments do not resynchronize it |
| Author drafts and package tests | Independent Content Lab workspace `content-libraries/` | Author edits locally and exports JSON/ZIP |
| Published questions/terms and their history | `<CEPTLENS_DATA_DIR>/content-store/` | Content Manager imports, updates, deletes, or restores |
| Accounts, sessions, progress, discussions, exams | `<CEPTLENS_DATA_DIR>/ceptlens.sqlite` | Application APIs; content operations do not replace this DB |
| Production credentials/configuration | The service's systemd environment/configuration | Server configuration |
| Production service logs | systemd journal (`journalctl -u ceptlens`) | Service output; not Git |
| Local development logs | `.ceptlens-runtime/` | Local launch scripts; ignored by Git |

`CEPTLENS_CONTENT_DIR` can override the content-store location. Use absolute paths on the production server. Its existing `CEPTLENS_DATA_DIR=/var/lib/ceptlens` yields `/var/lib/ceptlens/content-store` by default.

```text
/var/lib/ceptlens/
  ceptlens.sqlite                  accounts and learning records
  content-store/
    current.json                  selected complete snapshot
    snapshots/<revision>/
      manifest.json               hashes, counts, time, previous revision
      content-libraries/          saved question and term source files
      dist/                       matching compiled learner website
    runtime/                      stable admin token and upload staging
    work/                         disposable candidate build workspaces
    publication.lock              excludes overlapping publishers/deployments
    deploy-backups/<release-id>/  prior selection, local DB recovery copy
```

Snapshots preserve extracted package files, including custom components/assets. The original ZIP container is not separately archived; export reconstructs a package from the saved files. Snapshots are retained; monitor disk use and back them up before any manual pruning. Source-export behavior is unchanged.

## Everyday author workflow

1. Work in a standalone Content Lab directory, separate from the platform Git checkout.
2. Edit the question JSON or term package, preview it, and use the Lab's validation/export flow.
3. Open the website's Content Manager and upload the JSON/ZIP with the existing content-management token.
4. The server copies the current library into a candidate, applies the upload, validates/tests/builds it, and activates a new snapshot only after success. Other learners keep the previous published site while the candidate builds.
5. On success, the Content Manager refreshes with the published library. Invalid imports keep the previous content and frontend.
6. Under **Content storage and revisions**, see the actual storage location and restore a previous library if needed. Restore creates a new snapshot and retains newer snapshots. Account and learning records remain unchanged.

No Git commit is needed for uploading a teaching package. Updating the platform does not copy Git's sample library over uploaded content. The existing shared author token and question-order contract remain in place for now; colleagues should coordinate question ordering until tracks are introduced.

## This computer

The standalone Lab has been created at `D:/Desktop/CeptLens-Content-Lab`.

```powershell
cd D:/Desktop/CeptLens-Content-Lab
npm start
```

To update the Lab runtime after pulling platform changes, run from the platform checkout:

```powershell
npm run lab:workspace -- D:/Desktop/CeptLens-Content-Lab --update
cd D:/Desktop/CeptLens-Content-Lab
npm ci
npm start
```

The updater preserves `content-libraries/`, local runtime data, and installed dependencies. It replaces only managed Lab application files; restart the Lab after an update. Back up drafts normally. To create a colleague's workspace, omit `--update` and choose a new empty directory. A workspace does not need a Git remote.

For platform development, use `npm start` for the full service. It automatically creates/rebuilds the persistent snapshot when platform build inputs change. Restart after code changes. `npm run dev` remains a frontend-only development view using Git's initial/example content; it does not publish uploads.

## Platform deployment

GitHub Actions checks the platform, uploads its Git archive, installs the versioned deployment coordinator, and invokes it on the server.

The coordinator reads storage paths from the running service, so an installation does not need the example environment-file path. The existing service must be running, with an absolute `CEPTLENS_DATA_DIR`, when starting a deployment.

The coordinator:

1. Extracts a fresh platform release and installs locked dependencies.
2. Acquires the same filesystem publication lock used by Content Manager.
3. On the first migration, pauses the legacy service, preserves its actual library, and seeds from it. It must not assume Git contains server-only uploads. Later deployments can keep serving while the new candidate builds.
4. Builds the new platform against the existing server content. Both frontend and backend use the resulting snapshot.
5. Stops the service briefly, saves a consistent local copy of the SQLite file family, switches the code release, and starts the prepared snapshot.
6. Checks the exact selected content revision and HTTP health. A failed deployment restores the previous code/content selection without replacing user records. Failed releases/snapshots remain available for inspection.

The GitHub deployment credential was verified to have the server permissions required to install the coordinator. The old v2 helper is retained; the updated workflow uses v3. A same-commit retry creates a separate release directory rather than overwriting an existing release.

Content-only restores use the current platform to rebuild the selected older content. They do not restore the entire server or downgrade the database. Deployments likewise never restore a DB merely to roll back code.

## Recovery and backup

Back up the **whole persistent data directory**, including snapshots and `current.json`, plus the actual systemd service configuration/environment through a protected channel. Keep a copy on another machine/storage service. Deployment recovery copies on the same disk are not disaster recovery.

For a filesystem backup of SQLite, stop the service during the copy or use a consistent SQLite backup tool. Do not copy only a live `.sqlite` file and assume it includes pending WAL writes. Preserve file ownership and permissions on restore. Logs follow the journal's separate retention policy; archive them separately if needed.

If a process crashes during publication, the previous complete snapshot remains selected until the atomic pointer switch. An abandoned `publication.lock` intentionally blocks further writers. Inspect its recorded PID, confirm no publisher/deployment is still running, and only then remove that single lock file. Do not automatically remove a lock based only on its age.

The first migration pauses the legacy service because it does not understand the new writer lock. The migration keeps a copy of its actual content library and leaves the previous release available. No automatic Git cleanup, content deletion, or source-access changes are part of this implementation.

## Verification

`npm run check:all` includes the existing application/Lab checks plus `npm run test:content-workflow`. The latter uses temporary local data, real HTTP imports, and real frontend builds:

- Upload a question and a term absent from Git.
- Confirm the uploaded question appears in the compiled learner application.
- Start a fresh platform release containing only Git's original library against the same persistent store.
- Verify uploaded content hashes/counts, account/session, and saved progress survive.
- Reject an invalid import without changing the active revision.
- Restore an older content snapshot without removing the account.

Unit tests also cover stale-host rejection, publication/deployment lock exclusion, failed builds, legacy-library seeding, revision retention, and preservation of author drafts during a Lab update.
