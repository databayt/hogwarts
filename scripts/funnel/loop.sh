#!/usr/bin/env bash
# The funnel loop heartbeat — every 30 minutes, read back what the waves did.
#
#   bash scripts/funnel/loop.sh --tick        one pass (what launchd calls)
#   bash scripts/funnel/loop.sh --install     arm launchd (com.databayt.funnel-loop)
#   bash scripts/funnel/loop.sh --uninstall
#   bash scripts/funnel/loop.sh --status      armed? last stamps, today's log tail
#   bash scripts/funnel/loop.sh --pause       kill switch on
#   bash scripts/funnel/loop.sh --resume      kill switch off
#
# Every tick (0 tokens):   inbox --apply        hotmail replies → WARM / opt-out
#                          delivery --apply     Resend delivered / bounced
#                          sync-chatbot --apply prod chatbot leads → Twenty WARM
# Once a day:              crm:funnel-gates     the census kun's funnel-yield diffs
# Friday ≥17:00, weekly:   learn --propose --post   one claude -p session (Max pool)
#
# IT NEVER SENDS TO A SCHOOL. A wave is `crm:funnel-tick … --apply`, typed by
# a person; `crm:funnel-next-wave` prints the lines. This loop only reads the
# outcomes back and proposes.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
STATE="$REPO/scripts/crm/.data/funnel-loop"
LOG_DIR="$HOME/.claude/logs"
LOCK="$HOME/.claude/.funnel-loop.lock"
PAUSE="$STATE/.paused"
PLIST_LABEL="com.databayt.funnel-loop"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"
MODE="${1:---tick}"

mkdir -p "$STATE" "$LOG_DIR"
LOG_FILE="$LOG_DIR/funnel-loop-$(date +%F).log"
log() { echo "[$(date '+%H:%M:%S')] $*" >> "$LOG_FILE"; }

TODAY="$(date +%F)"
HOUR=$((10#$(date +%H)))
DOW="$(date +%u)"
WEEK="$(date +%G-W%V)"
done_stamp() { [ "$(cat "$STATE/$1.stamp" 2>/dev/null)" = "$2" ]; }
stamp() { echo "$2" > "$STATE/$1.stamp"; }

run() {  # run <name> <cmd...> — logs, never aborts the tick
    local name="$1"; shift
    log "▶ $name"
    ( cd "$REPO" && "$@" ) >> "$LOG_FILE" 2>&1
    local rc=$?
    log "◀ $name exit $rc"
    return $rc
}

render_plist() {
    cat <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>$PLIST_LABEL</string>
	<key>ProgramArguments</key>
	<array>
		<string>/bin/bash</string>
		<string>$REPO/scripts/funnel/loop.sh</string>
		<string>--tick</string>
	</array>
	<key>WorkingDirectory</key>
	<string>$REPO</string>
	<key>StartInterval</key>
	<integer>1800</integer>
	<key>RunAtLoad</key>
	<true/>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PATH</key>
		<string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin</string>
		<key>DISABLE_AUTOUPDATER</key>
		<string>1</string>
	</dict>
	<key>StandardOutPath</key>
	<string>$LOG_DIR/funnel-loop-launchd.out</string>
	<key>StandardErrorPath</key>
	<string>$LOG_DIR/funnel-loop-launchd.err</string>
</dict>
</plist>
PLIST
}

case "$MODE" in
  --install)
    render_plist > "$PLIST_PATH"
    launchctl bootout "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null
    launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" && echo "armed: $PLIST_LABEL (every 30 min)"
    exit 0 ;;
  --uninstall)
    launchctl bootout "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null; rm -f "$PLIST_PATH"; echo "disarmed"; exit 0 ;;
  --pause)  touch "$PAUSE"; echo "funnel loop PAUSED ($PAUSE)"; exit 0 ;;
  --resume) rm -f "$PAUSE"; echo "funnel loop resumed"; exit 0 ;;
  --status)
    launchctl list | grep -q "$PLIST_LABEL" && echo "armed: $PLIST_LABEL" || echo "NOT armed"
    [ -f "$PAUSE" ] && echo "PAUSED"
    for s in "$STATE"/*.stamp; do [ -f "$s" ] && echo "  $(basename "$s" .stamp): $(cat "$s")"; done
    echo "--- $LOG_FILE"; tail -20 "$LOG_FILE" 2>/dev/null
    exit 0 ;;
esac

[ -f "$PAUSE" ] && { log "paused — skipping tick"; exit 0; }
if ! mkdir "$LOCK" 2>/dev/null; then
  # A lock older than 40 min is a crashed tick, not a running one.
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +40 2>/dev/null)" ]; then rm -rf "$LOCK"; mkdir "$LOCK"; else log "previous tick still running"; exit 0; fi
fi
trap 'rm -rf "$LOCK"' EXIT

# Twenty on :3100 (NEVER 3000 — that is hogwarts' dev server) with the
# Keychain token; prod Neon for the chatbot sync. A locked Keychain (the
# session can be locked overnight) makes these empty — the steps then fail
# loudly in the log rather than pretend.
export TWENTY_API_URL=http://localhost:3100
export TWENTY_API_KEY="$(security find-generic-password -s databayt-twenty -a hogwarts -w 2>/dev/null)"
PROD_DB="$(security find-generic-password -s cf-hogwarts-DATABASE_URL -w 2>/dev/null)"

if ! curl -s -m 10 -o /dev/null -w '%{http_code}' "$TWENTY_API_URL/healthz" | grep -q 200; then
  log "Twenty down on :3100 — nothing to write to; skipping tick"; exit 0
fi

# Hours: the inbox reads replies 07:00–23:00 — schools write in the day, and
# a reply that waits until morning loses nothing a night-time read would win.
if [ "$HOUR" -ge 7 ] && [ "$HOUR" -le 23 ]; then
  run inbox pnpm exec tsx scripts/funnel/inbox.ts --apply
fi
run delivery pnpm exec tsx scripts/funnel/delivery.ts --apply
[ -n "$PROD_DB" ] && run sync-chatbot env DATABASE_URL="$PROD_DB" pnpm exec tsx scripts/funnel/sync-chatbot.ts --apply

if ! done_stamp gates "$TODAY" && [ "$HOUR" -ge 6 ]; then
  run gates env DATABASE_URL="$PROD_DB" pnpm exec tsx scripts/funnel/gates.ts && stamp gates "$TODAY"
fi

if [ "$DOW" = "5" ] && [ "$HOUR" -ge 17 ] && ! done_stamp learn "$WEEK"; then
  run learn pnpm exec tsx scripts/funnel/learn.ts --propose --post && stamp learn "$WEEK"
fi
exit 0
