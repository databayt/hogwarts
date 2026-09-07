#!/usr/bin/env bash
# Build and deploy hogwarts to Cloudflare Workers — the PILOT lane that runs
# beside Vercel. Nothing here touches vercel.json, .vercel/, DNS, or the
# Vercel deploy (scripts/deploy-hobby.sh); the two lanes are independent.
#
#   scripts/deploy-cloudflare.sh <env-file> [--no-deploy]
#
# <env-file> is a dotenv holding the BUILD-time values (NEXT_PUBLIC_* are
# inlined by `next build`, so they must match the runtime secrets pushed by
# scripts/cf-secrets.sh). Runtime secrets are NOT uploaded here.
#
# The build runs from a copy, never in the repo, so .next/ stays untouched for
# the Vercel lane. CF_SOURCE=head (default) exports a clean `git archive HEAD`;
# CF_SOURCE=<ref> exports that commit (pin the pilot to what balqalam.com runs);
# CF_SOURCE=worktree rsyncs the working tree instead — what the hobby lane
# ships today, and the only option while HEAD references files a session
# forgot to `git add`; CF_OVERLAY="a.ts b.ts" copies named working-tree files
# over the export (2026-09-07: HEAD needs src/lib/platform-notification.ts).
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=${1:?dotenv with build-time values}; shift || true
DEPLOY=1; [[ "${1:-}" == "--no-deploy" ]] && DEPLOY=0
ENV_FILE=$(cd "$(dirname "$ENV_FILE")" && pwd)/$(basename "$ENV_FILE")
BUILD_DIR=${CF_BUILD_DIR:-${TMPDIR:-/tmp}/hogwarts-cf-build}

SOURCE=${CF_SOURCE:-head}
rm -rf "$BUILD_DIR"; mkdir -p "$BUILD_DIR"
if [[ "$SOURCE" == "worktree" ]]; then
  echo "==> copying the WORKING TREE ($(git rev-parse --short HEAD) + uncommitted changes) to $BUILD_DIR"
  rsync -a --exclude node_modules --exclude .next --exclude .open-next --exclude .vercel \
    --exclude .git --exclude coverage --exclude playwright-report --exclude test-results ./ "$BUILD_DIR/" \
    || { rc=$?; [[ $rc == 23 || $rc == 24 ]] && echo "    (rsync $rc: files changed under us — another session is editing; continuing)" || exit $rc; }
else
  REF=$SOURCE; [[ "$REF" == "head" ]] && REF=HEAD
  echo "==> exporting $REF ($(git rev-parse --short "$REF")) to $BUILD_DIR"
  git archive "$REF" | tar -x -C "$BUILD_DIR"
  # CF_OVERLAY: working-tree files to copy on top of the export (space-separated).
  # Used while HEAD imports a module a session forgot to `git add`.
  for f in ${CF_OVERLAY:-}; do mkdir -p "$BUILD_DIR/$(dirname "$f")"; cp "$f" "$BUILD_DIR/$f"; echo "    overlay: $f"; done
fi
cp .env "$BUILD_DIR/.env"                       # prisma.config.ts loads it
cd "$BUILD_DIR"

echo "==> installing (frozen lockfile, offline store first)"
pnpm install --frozen-lockfile --prefer-offline --silent
node scripts/fetch-thmanyah.mjs                 # woff2 are gitignored, fetch-only license

echo "==> building with $ENV_FILE"
set -a; . "$ENV_FILE"; set +a
export NODE_OPTIONS='--max-old-space-size=8192' NEXT_TELEMETRY_DISABLED=1
pnpm exec opennextjs-cloudflare build

SIZE=$(gzip -c .open-next/worker.js | wc -c | tr -d ' ')
echo "==> worker.js gzip: $((SIZE / 1024)) KiB (limits: 3 MiB free, 10 MiB paid — the bundled handler chunks count too; wrangler reports the real total)"

if [[ $DEPLOY -eq 1 ]]; then
  echo "==> deploying"
  pnpm exec opennextjs-cloudflare deploy
else
  echo "==> --no-deploy: dry run"
  pnpm exec wrangler deploy --dry-run --outdir "$BUILD_DIR/.wrangler-dry"
fi
echo "==> done"
