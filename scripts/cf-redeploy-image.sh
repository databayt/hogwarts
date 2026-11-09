#!/usr/bin/env bash
# Upload the Worker again WITHOUT a build: the container keeps the image it runs NOW, referenced by
# its registry digest, so nothing is compiled, no Docker runs and almost no memory is used.
#
#   scripts/cf-redeploy-image.sh [ref]            # Worker code = cf/ at <ref> (default HEAD)
#   scripts/cf-redeploy-image.sh [ref] --dry-run  # bundle + validate only
#
# Why it exists: new Worker secrets reach the app only after an Upload deployment plus a container
# restart (see infra/livekit/switch.sh). The normal Upload, scripts/deploy-cloudflare.sh deploy,
# re-deploys whatever sits in $CF_BUILD_DIR, and on 2026-11-09 that folder was half-built (a build
# killed for memory). Without this, neither the LiveKit Cloud rollback nor a key rotation could run.
# Everything except the image line is the repo's own wrangler.jsonc.
set -euo pipefail
cd "$(dirname "$0")/.."
REF=HEAD; DRY=""
for a in "$@"; do [[ "$a" == "--dry-run" ]] && DRY="--dry-run" || REF="$a"; done

WR="$PWD/node_modules/.bin/wrangler"   # called by path: the kit folder has no package.json
APP=$("$WR" containers list 2>/dev/null | grep "hogwarts-hogwartscontainer" \
  | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
[[ -n "$APP" ]] || { echo "no hogwarts container application found"; exit 2; }
IMAGE=$("$WR" containers info "$APP" 2>/dev/null | grep -oE '"image": "registry\.cloudflare\.com/[^"]+@sha256:[0-9a-f]{64}"' \
  | head -1 | cut -d'"' -f4)
[[ -n "$IMAGE" ]] || { echo "could not read the live image of $APP"; exit 2; }

KIT="$HOME/.cache/cf-build/hogwarts-redeploy"
rm -rf "$KIT"; mkdir -p "$KIT/cf"
git show "$REF:cf/worker.js" > "$KIT/cf/worker.js"
git show "$REF:cf/crons.json" > "$KIT/cf/crons.json"
ln -s "$PWD/node_modules" "$KIT/node_modules"
# The one change: the image by digest instead of ./Dockerfile.
git show "$REF:wrangler.jsonc" | sed "s#\"image\": \"./Dockerfile\"#\"image\": \"$IMAGE\"#" > "$KIT/wrangler.jsonc"
grep -q "@sha256:" "$KIT/wrangler.jsonc" || { echo "image line not replaced in wrangler.jsonc"; exit 3; }

echo "==> Worker cf/ @ $(git rev-parse --short "$REF"), image ${IMAGE##*@} (unchanged)${DRY:+ — dry run}"
LOG="$KIT.log"
if (cd "$KIT" && "$WR" deploy $DRY) > "$LOG" 2>&1; then rc=0; else rc=$?; fi
grep -E "Current Version ID|No changes|Modified application|Total Upload|dry-run|ERROR|✘" "$LOG" | sed 's/^/    /'
[[ $rc == 0 ]] || echo "    wrangler failed (rc=$rc) — full log: $LOG"
exit $rc
