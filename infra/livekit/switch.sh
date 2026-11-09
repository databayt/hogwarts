#!/usr/bin/env bash
# Point production at a LiveKit server, then restart the container so it reads the new env.
#
#   infra/livekit/switch.sh selfhost     # our Hetzner server (live.balqalam.com)
#   infra/livekit/switch.sh cloud        # back to LiveKit Cloud (the fallback)
#   … --no-restart                       # push the Worker secrets only
#
# Values come from Keychain (livekit-selfhost-* / livekit-cloud-*), never the terminal.
# Worker secrets OVERRIDE the image's baked env.json (cf/entry.cjs fills only unset names),
# so `cloud` deletes the overrides that `selfhost` adds and the baked Cloud values return.
# Switch with no class running: a webhook signed by the other server's key is refused.
set -euo pipefail
cd "$(dirname "$0")/../.."
TARGET=${1:?selfhost|cloud}; RESTART=true; [[ "${2:-}" == "--no-restart" ]] && RESTART=false
kc() { security find-generic-password -s "$1" -w; }
OUT=$(mktemp -t lk-switch.XXXXXX); trap 'rm -f "$OUT"' EXIT; chmod 600 "$OUT"

case "$TARGET" in
  selfhost)
    LK_KEY=$(kc livekit-selfhost-LIVEKIT_API_KEY) LK_SECRET=$(kc livekit-selfhost-LIVEKIT_API_SECRET) python3 -c '
import json, os
print(json.dumps({
  "LIVEKIT_HOST": "https://live.balqalam.com",
  "LIVEKIT_WS_URL": "wss://live.balqalam.com",
  "LIVEKIT_API_KEY": os.environ["LK_KEY"],
  "LIVEKIT_API_SECRET": os.environ["LK_SECRET"],
  # No egress service on our server: an empty bucket turns recording off honestly.
  "LIVEKIT_RECORDING_BUCKET": "",
  # The meter on /live/settings + the 80% guard: our box is bandwidth-bound, not minute-capped.
  "LIVEKIT_TIER_WEBRTC_MINUTES": "2000000",
  "LIVEKIT_TIER_CONCURRENT": "300",
}))' > "$OUT"
    pnpm exec wrangler secret bulk "$OUT"
    ;;
  cloud)
    LK_KEY=$(kc livekit-cloud-LIVEKIT_API_KEY) LK_SECRET=$(kc livekit-cloud-LIVEKIT_API_SECRET) python3 -c '
import json, os
print(json.dumps({"LIVEKIT_API_KEY": os.environ["LK_KEY"], "LIVEKIT_API_SECRET": os.environ["LK_SECRET"]}))' > "$OUT"
    pnpm exec wrangler secret bulk "$OUT"
    for n in LIVEKIT_HOST LIVEKIT_WS_URL LIVEKIT_RECORDING_BUCKET LIVEKIT_TIER_WEBRTC_MINUTES LIVEKIT_TIER_CONCURRENT; do
      pnpm exec wrangler secret delete "$n" --force >/dev/null 2>&1 && echo "    removed override $n" || true
    done
    ;;
  *) echo "target must be selfhost|cloud"; exit 2 ;;
esac

$RESTART || { echo "==> secrets pushed; restart the container to apply"; exit 0; }
# Restart = stop the container from its Durable Object; the next request starts a fresh one from
# the CURRENT secrets (cf/worker.js POST /__ops/container/restart, cron-secret only). A redeploy is
# NOT enough: an image rollout re-launches the container with the env it was first started with —
# on 2026-11-09 the uptime reset and every browser still dialled LiveKit Cloud.
echo "==> restarting the container so it reads the new secrets"
code=$(printf 'Authorization: Bearer %s\n' "$(kc cf-hogwarts-CRON_SECRET)" \
  | curl -s -o /dev/null -w '%{http_code}' -X POST -H @- https://balqalam.com/__ops/container/restart)
[[ "$code" == "200" ]] || { echo "    ops route answered $code (is cf/worker.js deployed with it?)"; exit 5; }
for _ in $(seq 1 30); do
  u=$(curl -s https://balqalam.com/api/health | grep -oE '"uptime":[0-9]+' | cut -d: -f2)
  [[ -n "$u" && "$u" -lt 120 ]] && { echo "==> container back (uptime ${u}s). Check the host a browser dials: scratchpad wsprobe or the room's server log."; exit 0; }
  sleep 10
done
echo "    the container did not come back within 5 min — check https://balqalam.com/api/health"; exit 6
