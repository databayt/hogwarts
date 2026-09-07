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
# The build runs from a clean `git archive HEAD` export, not the working tree:
# other sessions' uncommitted schema edits would otherwise get baked into the
# Prisma client and surface as "column does not exist" 500s that look like
# Cloudflare bugs. It also keeps .next/ in the repo untouched for the Vercel lane.
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=${1:?dotenv with build-time values}; shift || true
DEPLOY=1; [[ "${1:-}" == "--no-deploy" ]] && DEPLOY=0
ENV_FILE=$(cd "$(dirname "$ENV_FILE")" && pwd)/$(basename "$ENV_FILE")
BUILD_DIR=${CF_BUILD_DIR:-${TMPDIR:-/tmp}/hogwarts-cf-build}

echo "==> exporting HEAD ($(git rev-parse --short HEAD)) to $BUILD_DIR"
rm -rf "$BUILD_DIR"; mkdir -p "$BUILD_DIR"
git archive HEAD | tar -x -C "$BUILD_DIR"
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
