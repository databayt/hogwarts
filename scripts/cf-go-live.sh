#!/usr/bin/env bash
# First deploy of the container lane, in the only safe order:
#   deploy (creates the Worker + container app; no instance starts until a request)
#   → secrets (envVars are read when the container STARTS, so they must exist first)
#   → first request on workers.dev (boots the container against the prod DB)
# Re-run `deploy` alone for later releases; re-run secrets only on rotation.
#
#   scripts/cf-go-live.sh <prod-dotenv>
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=${1:?prod dotenv}
BUILD_DIR=${CF_BUILD_DIR:-${TMPDIR:-/tmp}/hogwarts-cf-build}
[[ -f "$BUILD_DIR/.next/standalone/server.js" ]] || { echo "ABORT: run scripts/deploy-cloudflare.sh <env> build first"; exit 1; }
scripts/deploy-cloudflare.sh "$ENV_FILE" deploy
scripts/cf-secrets.sh "$ENV_FILE"
echo "==> first request (container boot + prod DB)"
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 https://hogwarts.osmanabdout.workers.dev/api/health || true)
  [[ "$code" == "200" ]] && break; sleep 5
done
echo "    /api/health → $code after ${i}×5s"
for p in /en /en/login "/en/s/demo/dashboard"; do printf "    %-22s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 60 "https://hogwarts.osmanabdout.workers.dev$p")"; done
echo "==> next: enable routes in wrangler.jsonc, deploy, then scripts/cf-cutover.sh on demo.balqalam.com"
