#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
node server/prepare-runtime.mjs
npm start
