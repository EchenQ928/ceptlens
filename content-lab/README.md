# CeptLens Content Lab

The Content Lab is an independent local workspace for designing, previewing, validating, importing, and exporting CeptLens question and term packages. It is not another production startup mode. It never connects to the production database, account service, model service, or publishing host.

## Start

Requires Node.js 22.18.0 or newer.

```bash
npm ci
npm start
```

Open http://127.0.0.1:8766/. On Windows, `start-lab.bat` performs the same startup checks. On macOS or Linux, `bash start-lab.sh` is also supported.

The first startup validates the installed runtime and package dependencies, validates local content, builds the preview, and then starts the isolated Lab host.

## Daily workflow

1. Import one term ZIP or question JSON package. Replacing an existing ID requires confirmation.
2. Edit files under `content-libraries/`. Term packages require `manifest.json` and `view.tsx`; custom components, styles, assets, formulas, and tests stay inside the package directory.
3. Select **Check and refresh** after saving all files. Validation, package tests, TypeScript, and the production build must pass before export.
4. Export the checked package. Runtime ZIPs exclude package test files.
5. Upload the exported ZIP through the production Content Manager at `/#/developer` using an authorized content-management token. The Lab does not store that token and does not publish directly.

The Lab fixture questions are kept separate from the production library. Missing explicit term links are shown as pending packages; the Lab does not need a copy of the entire production term library.

## Package format

Packages use `schemaVersion: 3.0` and `sdkVersion: 1.x`. Both the production site and the Lab use the same content SDK and package contract, but they have independent source trees and content directories.

See [`public/docs/LAB_GUIDE.md`](public/docs/LAB_GUIDE.md) for the package contract and import rules. The old Chinese startup note has been replaced by [`STARTUP.md`](STARTUP.md).
