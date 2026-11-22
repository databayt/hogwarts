#!/usr/bin/env bash
# Move the production database next to the app (N. Virginia → Frankfurt).
#
# The container runs in Frankfurt; while Postgres sat in us-east-1 every query
# paid a ~94 ms round trip (performance/reports/baseline-2026-09-19, #490).
# This copies both databases (`neondb`, `evolution`) into a Neon project in
# aws-eu-central-1 with a dump/restore — at <1 GB that is minutes, and it
# leaves the old project untouched as the fallback.
#
#   scripts/db/move-region.sh prepare    # save the new project's URLs (needs `neon auth`)
#   scripts/db/move-region.sh rehearse   # copy with NO freeze, compare, time it
#                                        #   DBS=evolution … rehearse  copies one database only
#                                        #   REMOTE=root@server …      the copy runs on that server
#   scripts/db/move-region.sh cutover    # freeze → copy → compare → secrets → deploy → restart → verify
#   scripts/db/move-region.sh rollback   # old secrets back → deploy → restart → unfreeze
#   scripts/db/move-region.sh freeze-test # lock every table → a write through the pooler must wait → release; no copy
#   scripts/db/move-region.sh verify     # health + database round trip of the live site
#
# Secrets: the OLD urls come from the Keychain (cf-hogwarts-*), the NEW ones
# from $MOVE_DIR/eu.env (0600, outside the repo). Nothing is printed or logged.
#
# REMOTE=user@server [REMOTE_KEY=~/.ssh/key]: the copy and the comparison run on
# that server, inside a throwaway `postgres:17` container; everything else stays
# here. The copy is bound by the link, not by Postgres: from the Mac in Kigali
# it took 32 minutes (2026-11-21), which is far too long to hold writes. The
# URLs reach the container on stdin, into its environment — never a file or an
# argument on the server.
#
# cutover / rollback need:  CF_BUILD_DIR  a build made by deploy-cloudflare.sh
#                           PROD_ENV      the production dotenv it was built with
set -euo pipefail
SELF=$(cd "$(dirname "$0")" && pwd)/$(basename "$0")
cd "$(dirname "$0")/../.."

MOVE_DIR=${MOVE_DIR:-$HOME/.cache/hogwarts-db-move}
EU_ENV=$MOVE_DIR/eu.env
EU_PROJECT=${EU_PROJECT:-restless-breeze-34992259}
PG=${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}
JOBS=${JOBS:-4}
DBS=${DBS:-neondb evolution}
SITE=${SITE:-https://balqalam.com}
REMOTE=${REMOTE:-}
REMOTE_SSH=(ssh -o BatchMode=yes -o ServerAliveInterval=30 ${REMOTE_KEY:+-i "$REMOTE_KEY"})
REMOTE_IMAGE=postgres:17
MODE=${1:?prepare|rehearse|cutover|rollback|verify}

mkdir -p "$MOVE_DIR"; chmod 700 "$MOVE_DIR"; umask 077
say() { printf '==> %s\n' "$*"; }
die() { printf 'xx  %s\n' "$*" >&2; exit 1; }
host_of() { sed -E 's#^[a-z]+://[^@]+@([^/:?]+).*#\1#' <<<"$1"; }
kc() { security find-generic-password -s "$1" -w 2>/dev/null || die "Keychain item $1 is missing"; }
elapsed() { local s=$1; printf '%dm%02ds' $(( (SECONDS - s) / 60 )) $(( (SECONDS - s) % 60 )); }

# Prisma-only parameters (`schema`, `connection_limit`, …) are refused by libpq
# ("invalid URI query parameter"), so pg_dump and psql get the URL without them.
libpq_url() {
  local base=${1%%\?*} q=
  [[ $1 == *\?* ]] && q=${1#*\?}
  q=$(sed -E 's/(^|&)(schema|connection_limit|pool_timeout|pgbouncer|socket_timeout|statement_cache_size)=[^&]*//g; s/^&//' <<<"$q")
  printf '%s%s' "$base" "${q:+?$q}"
}
# The new URL with the old one's parameters. Only user, password and host may
# change for the app: the WhatsApp bridge finds its tables through
# `schema=evolution_api`, and would start on an empty `public` without it.
with_params_of() {
  local base=${1%%\?*} q=
  [[ $2 == *\?* ]] || { printf '%s' "$1"; return; }
  q=${2#*\?}
  [[ $q != *options=* ]] || die "the old URL pins an endpoint in its parameters — carry them by hand"
  printf '%s%s' "$base" "${q:+?$q}"
}

# Read KEY=VALUE lines into the environment WITHOUT evaluating them as shell —
# a connection string's '&' would otherwise background half of the line.
load_env_file() {
  local k v
  while IFS='=' read -r k v || [[ -n $k ]]; do
    [[ $k =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    printf -v "$k" '%s' "$v"; export "${k?}"
  done < "$1"
}

load_urls() {
  OLD_POOLED=${OLD_DATABASE_URL:-$(kc cf-hogwarts-DATABASE_URL)}
  OLD_DIRECT=${OLD_DIRECT_URL:-$(kc cf-hogwarts-DIRECT_URL)}
  OLD_EVO=${OLD_EVOLUTION_DATABASE_URL:-$(kc cf-hogwarts-EVOLUTION_DATABASE_URL)}
  if [[ -z ${EU_DIRECT_URL:-} ]]; then
    [[ -s $EU_ENV ]] || die "$EU_ENV is missing — run: scripts/db/move-region.sh prepare"
    load_env_file "$EU_ENV"
  fi
  : "${EU_DATABASE_URL:?}" "${EU_DIRECT_URL:?}" "${EU_EVOLUTION_DATABASE_URL:?}"
  [[ $(host_of "$OLD_DIRECT") != "$(host_of "$EU_DIRECT_URL")" ]] || die "old and new hosts are the same — the Keychain was already re-pointed"
  [[ $(host_of "$EU_DIRECT_URL") == *eu-central-1* ]] || die "the new URL is not in eu-central-1"
  # What the app will be given …
  EU_DATABASE_URL=$(with_params_of "$EU_DATABASE_URL" "$OLD_POOLED")
  EU_DIRECT_URL=$(with_params_of "$EU_DIRECT_URL" "$OLD_DIRECT")
  EU_EVOLUTION_DATABASE_URL=$(with_params_of "$EU_EVOLUTION_DATABASE_URL" "$OLD_EVO")
  # … and what the Postgres tools connect with.
  PG_OLD_POOLED=$(libpq_url "$OLD_POOLED"); PG_OLD_DIRECT=$(libpq_url "$OLD_DIRECT"); PG_OLD_EVO=$(libpq_url "$OLD_EVO")
  PG_EU_DIRECT=$(libpq_url "$EU_DIRECT_URL"); PG_EU_EVO=$(libpq_url "$EU_EVOLUTION_DATABASE_URL")
}

# Every schema that is ours: `public`, and the bridge's `evolution_api`.
USER_SCHEMA="nspname !~ '^pg_' AND nspname <> 'information_schema'"

prepare() {
  command -v neon >/dev/null || die "neon CLI not found"
  local a b c
  a=$(neon connection-string --project-id "$EU_PROJECT" --database-name neondb --role-name neondb_owner --pooled) \
    || die "neon CLI is not signed in — run: neon auth"
  b=$(neon connection-string --project-id "$EU_PROJECT" --database-name neondb --role-name neondb_owner)
  c=$(neon connection-string --project-id "$EU_PROJECT" --database-name evolution --role-name neondb_owner)
  [[ $a == postgres* && $b == postgres* && $c == postgres* ]] || die "neon CLI returned no URL"
  printf 'EU_DATABASE_URL=%s\nEU_DIRECT_URL=%s\nEU_EVOLUTION_DATABASE_URL=%s\n' "$a" "$b" "$c" > "$EU_ENV"
  chmod 600 "$EU_ENV"
  say "saved $EU_ENV  (pooled host: $(host_of "$a"))"
}

# One database: dump from $1, restore into $2 (which is emptied first).
copy_db() {
  local name=$1 from=$2 to=$3 dir=$MOVE_DIR/dump-$1 t=$SECONDS
  rm -rf "$dir"
  say "$name: dump ($(host_of "$from"))"
  "$PG/pg_dump" --format=directory --jobs="$JOBS" --no-owner --no-acl --file="$dir" "$from"
  say "$name: dumped in $(elapsed $t), $(du -sh "$dir" | cut -f1) on disk"
  t=$SECONDS
  # A rehearsal leaves rows behind; the real copy must land in an empty database.
  # Every schema the source has is dropped on the target, then `public` is put back.
  local wipe
  wipe=$("$PG/psql" -X -A -t -q -v ON_ERROR_STOP=1 "$from" \
    -c "SELECT format('DROP SCHEMA IF EXISTS %I CASCADE;', nspname) FROM pg_namespace WHERE $USER_SCHEMA")
  [[ $wipe == *'DROP SCHEMA'* ]] || die "$name: the source lists no schema"
  PGOPTIONS='-c client_min_messages=warning' "$PG/psql" -X -q -v ON_ERROR_STOP=1 "$to" \
    -c "$wipe CREATE SCHEMA IF NOT EXISTS public;" >/dev/null
  say "$name: restore ($(host_of "$to"))"
  "$PG/pg_restore" --jobs="$JOBS" --no-owner --no-acl --exit-on-error --dbname="$to" "$dir"
  say "$name: restored in $(elapsed $t)"
  rm -rf "$dir"
}

# Exact row count of every table + the value of every sequence, as one sorted list.
fingerprint() {
  "$PG/psql" -X -A -t -q -v ON_ERROR_STOP=1 "$1" <<'SQL'
SELECT 't ' || n.nspname || '.' || c.relname || ' ' ||
       (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM %I.%I', n.nspname, c.relname), false, true, '')))[1]::text
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema' AND c.relkind = 'r'
UNION ALL
SELECT 's ' || schemaname || '.' || sequencename || ' ' || coalesce(last_value::text, '-')
FROM pg_sequences WHERE schemaname !~ '^pg_' AND schemaname <> 'information_schema'
ORDER BY 1;
SQL
}

compare() {
  local name=$1 from=$2 to=$3
  fingerprint "$from" > "$MOVE_DIR/$name.old.txt"
  fingerprint "$to" > "$MOVE_DIR/$name.new.txt"
  local n d; n=$(wc -l < "$MOVE_DIR/$name.old.txt" | tr -d ' ')
  # An empty list would "match" an empty list: that is a broken check, not a pass.
  (( n > 0 )) || die "$name: the source shows no table — nothing was compared"
  if diff -q "$MOVE_DIR/$name.old.txt" "$MOVE_DIR/$name.new.txt" >/dev/null; then
    say "$name: $n tables + sequences identical"
  else
    d=$(diff "$MOVE_DIR/$name.old.txt" "$MOVE_DIR/$name.new.txt" | grep -c '^<' || true)
    say "$name: DIFFERENT — $d of $n lines; first ones:"
    diff "$MOVE_DIR/$name.old.txt" "$MOVE_DIR/$name.new.txt" | head -20 || true
    return 1
  fi
}

copy_all() {
  local db
  for db in $DBS; do
    case $db in
      neondb) copy_db neondb "$PG_OLD_DIRECT" "$PG_EU_DIRECT" ;;
      evolution) copy_db evolution "$PG_OLD_EVO" "$PG_EU_EVO" ;;
      *) die "unknown database: $db" ;;
    esac
  done
}

# Before any freeze: the server answers, has the image, and its pg_dump is a 17.
remote_ready() {
  [[ -n $REMOTE ]] || return 0
  local v
  v=$("${REMOTE_SSH[@]}" "$REMOTE" "docker image inspect $REMOTE_IMAGE >/dev/null 2>&1 || docker pull -q $REMOTE_IMAGE >/dev/null; docker run --rm $REMOTE_IMAGE pg_dump --version" </dev/null) \
    || die "$REMOTE cannot run the copy (ssh or docker)"
  [[ $v == *' 17.'* ]] || die "$REMOTE: expected pg_dump 17, got: $v"
  say "copy will run on $REMOTE ($v)"
}

# The first line on stdin is the environment, the rest is this script. `read`
# takes exactly that line, so the URLs live in the container's memory only.
remote_copy() {
  local strict=$1
  { printf 'export OLD_DATABASE_URL=%q OLD_DIRECT_URL=%q OLD_EVOLUTION_DATABASE_URL=%q EU_DATABASE_URL=%q EU_DIRECT_URL=%q EU_EVOLUTION_DATABASE_URL=%q JOBS=%q DBS=%q STRICT=%q PG_BIN=/usr/lib/postgresql/17/bin MOVE_DIR=/tmp/move\n' \
      "$OLD_POOLED" "$OLD_DIRECT" "$OLD_EVO" "$EU_DATABASE_URL" "$EU_DIRECT_URL" "$EU_EVOLUTION_DATABASE_URL" "$JOBS" "$DBS" "$strict"
    cat "$SELF"
  } | "${REMOTE_SSH[@]}" "$REMOTE" "docker run --rm -i --network host --memory 1g $REMOTE_IMAGE bash -c 'umask 077; IFS= read -r e; eval \"\$e\"; unset e; cat > /tmp/m.sh; exec bash /tmp/m.sh copy'"
}

# Copy, then compare. $1 = 1 when any difference must fail (the cutover: the
# source is frozen, so the two sides have to be identical).
copy_phase() {
  local strict=$1 rc=0
  if [[ -n $REMOTE ]]; then remote_copy "$strict"; return; fi
  copy_all
  compare neondb "$PG_OLD_DIRECT" "$PG_EU_DIRECT" || rc=1
  compare evolution "$PG_OLD_EVO" "$PG_EU_EVO" || rc=1
  if (( rc )) && [[ $strict != 1 ]]; then
    say "(a difference is expected without a freeze — the site was live during the copy)"
    return 0
  fi
  return $rc
}

# Writes stop, reads keep working. A role default only reaches NEW backends, so
# the open ones are closed; the pooler opens fresh ones that inherit it.
# Writes are frozen with a TABLE LOCK held for the whole copy. Two simpler
# freezes failed on Neon (2026-11-22):
#   - a role default (`ALTER ROLE … default_transaction_read_only`): the pooler
#     sets it back to `off` on every pooled session, and its server connections
#     survive a terminate;
#   - revoking write privileges: neondb_owner inherits pg_write_all_data through
#     neon_superuser, so no revoke can stop it.
# A lock does not care who asks. One session per database holds
# `LOCK TABLE <every table> IN EXCLUSIVE MODE`: reads (the dump, the compare,
# the site's pages) go on, every INSERT/UPDATE/DELETE waits behind it. The
# holder is a psql fed through a fifo so the lock outlives each command.
LOCKS=()   # "pid fifo-fd" of each holder

# Hold the lock on every user table of $2 (named $1) until release_locks.
hold_lock() {
  local name=$1 url=$2 fifo=$MOVE_DIR/lock-$1.fifo out=$MOVE_DIR/lock-$1.out tables fd
  tables=$("$PG/psql" -X -A -t -q -v ON_ERROR_STOP=1 "$url" -c "
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY schemaname, tablename)
    FROM pg_tables WHERE schemaname !~ '^pg_' AND schemaname <> 'information_schema'")
  [[ -n $tables ]] || die "$name: no table to lock"
  rm -f "$fifo" "$out"; mkfifo "$fifo"
  "$PG/psql" -X -q -v ON_ERROR_STOP=1 "$url" < "$fifo" > "$out" 2>&1 &
  local pid=$!
  # macOS bash 3.2 has no {fd} allocation: fixed descriptors, 7 + the holder's index.
  fd=$((7 + ${#LOCKS[@]}))
  eval "exec $fd> \"\$fifo\""
  LOCKS+=("$pid $fd")
  # lock_timeout: a transaction already writing gets 30 s to finish, then we give up (unfrozen).
  printf "SET lock_timeout = '30s';\nBEGIN;\nLOCK TABLE %s IN EXCLUSIVE MODE;\n\\\\echo LOCKED\n" "$tables" >&$fd
  local i
  for i in $(seq 1 70); do
    grep -q '^LOCKED' "$out" 2>/dev/null && { say "$name: every table locked (writes wait)"; return 0; }
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  die "$name: could not take the lock: $(tail -3 "$out" 2>/dev/null)"
}

release_locks() {
  local entry pid fd
  (( ${#LOCKS[@]} )) || return 0
  for entry in "${LOCKS[@]}"; do
    pid=${entry% *}; fd=${entry#* }
    { printf 'ROLLBACK;\n\\q\n' >&$fd; } 2>/dev/null || true
    eval "exec $fd>&-" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  LOCKS=()
  rm -f "$MOVE_DIR"/lock-*.fifo
}

# 0 when a real write through $1 is refused within 2 s (it waits on the lock).
write_blocked() {
  local t
  t=$("$PG/psql" -X -A -t -q -v ON_ERROR_STOP=1 "$1" -c "
    SELECT format('%I.%I', schemaname, tablename) FROM pg_tables
    WHERE schemaname !~ '^pg_' AND schemaname <> 'information_schema' ORDER BY 1 LIMIT 1")
  ! "$PG/psql" -X -q -v ON_ERROR_STOP=1 "$1" >/dev/null 2>&1 <<SQL
SET lock_timeout = '2s';
BEGIN;
INSERT INTO $t SELECT * FROM $t WHERE false;
ROLLBACK;
SQL
}

freeze() {
  say "freeze: lock every table of both old databases"
  hold_lock neondb "$PG_OLD_DIRECT"
  hold_lock evolution "$PG_OLD_EVO"
  # Asked through the POOLED url — the connection the app actually uses.
  write_blocked "$PG_OLD_POOLED" || die "freeze failed: a write through the pooler still went through"
  write_blocked "$PG_OLD_EVO" || die "freeze failed: a write to evolution still went through"
  say "freeze: confirmed — a write through the pooler waits and times out"
}

unfreeze() {
  say "unfreeze: release the locks"
  release_locks
  # Leftovers of the earlier freezes, in case a run was interrupted.
  "$PG/psql" -X -q "$PG_OLD_DIRECT" -c 'SET default_transaction_read_only = off' \
    -c 'ALTER ROLE neondb_owner RESET default_transaction_read_only' >/dev/null 2>&1 || true
  write_blocked "$PG_OLD_POOLED" && die "unfreeze: writes are still refused — check by hand"
  say "unfreeze: confirmed — writes go through again"
}

# 1 when every table in $1 accepts a write (the new database, before the switch).
all_writable() {
  write_blocked "$1" && { echo 0; return; }
  echo 1
}

# Three secrets → Worker, then the only sequence that delivers them to the
# container (2026-11-09): deploy from the build dir, then stop the container so
# the next request starts it with the current env.
point_app_at() {
  local pooled=$1 direct=$2 evo=$3 out
  : "${CF_BUILD_DIR:?CF_BUILD_DIR (a deploy-cloudflare.sh build)}" "${PROD_ENV:?PROD_ENV (the production dotenv)}"
  [[ -d $CF_BUILD_DIR ]] || die "$CF_BUILD_DIR does not exist — build first"
  out=$(mktemp -t db-move.XXXXXX.json)
  DBU=$pooled DIU=$direct EVU=$evo node -e '
    process.stdout.write(JSON.stringify({
      DATABASE_URL: process.env.DBU, DIRECT_URL: process.env.DIU, EVOLUTION_DATABASE_URL: process.env.EVU }))' > "$out"
  say "secrets → Worker (DATABASE_URL, DIRECT_URL, EVOLUTION_DATABASE_URL; host $(host_of "$pooled"))"
  pnpm exec wrangler secret bulk "$out" >/dev/null; rm -f "$out"
  say "deploy from $CF_BUILD_DIR"
  CF_BUILD_DIR=$CF_BUILD_DIR scripts/deploy-cloudflare.sh "$PROD_ENV" deploy
}

# Restart the container until the app's connections show up on $1 (a libpq URL
# of the database the app should now use). A restart sent seconds after the
# deploy can reach the PREVIOUS Worker version, whose Durable Object still holds
# the old secrets — the container then comes back on the old database (first
# cutover, 2026-11-22 21:43: switched secrets, restarted, still 101 ms). So:
# restart, let a request through, ask the target who connected since; retry.
restart_until_on() {
  local target=$1 label=$2 attempt t0 n
  for attempt in 1 2 3 4 5; do
    sleep 30   # the new version propagates
    t0=$(date +%s)
    say "restart the container (attempt $attempt) — expecting it on $label"
    curl -fsS -X POST "$SITE/__ops/container/restart" -H "authorization: Bearer $(kc cf-hogwarts-CRON_SECRET)" >/dev/null || true
    local i
    for i in $(seq 1 30); do curl -fsS -m 20 "$SITE/api/health" >/dev/null 2>&1 && break; sleep 4; done
    curl -fsS -m 20 "$SITE/api/health" >/dev/null 2>&1 || true
    n=$("$PG/psql" -X -A -t -q "$target" -c "
      SELECT count(*) FROM pg_stat_activity
      WHERE usename = 'neondb_owner' AND pid <> pg_backend_pid()
        AND backend_start > to_timestamp($t0)" 2>/dev/null || echo 0)
    if [[ ${n:-0} =~ ^[0-9]+$ ]] && (( n > 0 )); then
      say "the app is on $label ($n new connections since the restart)"
      return 0
    fi
    say "no connection from the app on $label yet"
  done
  return 1
}

verify() {
  say "waiting for the container"
  local i json ms up
  for i in $(seq 1 40); do
    json=$(curl -fsS -m 20 "$SITE/api/health" 2>/dev/null || true)
    [[ -n $json ]] && break; sleep 5
  done
  [[ -n ${json:-} ]] || die "the site did not answer /api/health"
  local samples=()
  for i in 1 2 3 4 5 6; do
    json=$(curl -fsS -m 20 "$SITE/api/health")
    ms=$(node -e 'const d=JSON.parse(process.argv[1]);console.log(d.checks?.database?.responseTime ?? "")' "$json")
    up=$(node -e 'const d=JSON.parse(process.argv[1]);console.log(Math.round(d.uptime ?? -1))' "$json")
    samples+=("$ms")
  done
  say "uptime ${up}s · database round trip (ms): ${samples[*]}"
  local best; best=$(printf '%s\n' "${samples[@]}" | sort -n | head -1)
  if (( best > ${MAX_DB_MS:-15} )); then
    say "round trip is still ${best} ms — the container is not on the Frankfurt database (or is not in Frankfurt)"
    return 1
  fi
  say "database is beside the app (${best} ms)"
}

repoint_local() {
  say "Keychain + local env files → new URLs"
  security add-generic-password -U -s cf-hogwarts-DATABASE_URL -a abdout -w "$EU_DATABASE_URL"
  security add-generic-password -U -s cf-hogwarts-DIRECT_URL -a abdout -w "$EU_DIRECT_URL"
  security add-generic-password -U -s cf-hogwarts-EVOLUTION_DATABASE_URL -a abdout -w "$EU_EVOLUTION_DATABASE_URL"
  local f
  for f in "$PROD_ENV" "$HOME/.cache/alabidae-ops/prod.env"; do
    [[ -f $f ]] || continue
    cp -p "$f" "$f.before-db-move"
    DBU=$EU_DATABASE_URL DIU=$EU_DIRECT_URL EVU=$EU_EVOLUTION_DATABASE_URL node -e '
      const fs=require("fs"), f=process.argv[1];
      const v={DATABASE_URL:process.env.DBU, DIRECT_URL:process.env.DIU, EVOLUTION_DATABASE_URL:process.env.EVU};
      fs.writeFileSync(f, fs.readFileSync(f,"utf8").split("\n").map(l=>{
        const m=/^([A-Z_]+)=/.exec(l); return m && v[m[1]] ? m[1]+"="+v[m[1]] : l }).join("\n"))' "$f"
    say "  $f (old copy kept beside it)"
  done
}

case $MODE in
  prepare) prepare ;;
  rehearse)
    load_urls; remote_ready; T=$SECONDS
    copy_phase 0
    say "rehearsal done in $(elapsed $T) — this is roughly how long writes are frozen at cutover"
    ;;
  copy)   # internal: what REMOTE= runs on the server
    load_urls; T=$SECONDS
    copy_phase "${STRICT:-0}"
    say "copied and compared in $(elapsed $T)"
    ;;
  cutover)
    load_urls
    : "${CF_BUILD_DIR:?}" "${PROD_ENV:?}"
    [[ $DBS == "neondb evolution" ]] || die "a cutover copies both databases — unset DBS"
    remote_ready
    # Saved first: once the Keychain is re-pointed, rollback still needs these.
    printf 'OLD_DATABASE_URL=%s\nOLD_DIRECT_URL=%s\nOLD_EVOLUTION_DATABASE_URL=%s\n' "$OLD_POOLED" "$OLD_DIRECT" "$OLD_EVO" > "$MOVE_DIR/old.env"
    chmod 600 "$MOVE_DIR/old.env"
    T=$SECONDS
    # EXIT, not ERR: `die` leaves through `exit`, which an ERR trap never sees —
    # and it is set before the freeze, so a freeze that half-worked is undone too.
    trap 'rc=$?; if (( rc )); then say "FAILED before the switch — unfreezing the old database"; unfreeze || true; fi' EXIT
    freeze
    copy_phase 1
    [[ $(all_writable "$PG_EU_DIRECT") == 1 && $(all_writable "$PG_EU_EVO") == 1 ]] \
      || die "the new databases are not fully writable — not switching"
    say "copy verified in $(elapsed $T); new databases writable; switching the app"
    point_app_at "$EU_DATABASE_URL" "$EU_DIRECT_URL" "$EU_EVOLUTION_DATABASE_URL"
    if ! restart_until_on "$PG_EU_DIRECT" "the Frankfurt database"; then
      say "the app never reached Frankfurt — putting the old secrets back BEFORE unlocking"
      point_app_at "$OLD_POOLED" "$OLD_DIRECT" "$OLD_EVO"
      restart_until_on "$PG_OLD_DIRECT" "the old database" \
        || say "!! could not confirm the app on the old database either — check by hand"
      die "cutover abandoned; the old database stays the only one in use"
    fi
    trap - EXIT
    if verify; then
      repoint_local
      say "DONE. The old project stays frozen as the fallback: scripts/db/move-region.sh rollback"
      say "Next: node scripts/live-smoke.mjs, sign in as three roles, then keep the old project 7 days."
    else
      die "verification failed — decide: re-run verify in a minute, or scripts/db/move-region.sh rollback"
    fi
    ;;
  rollback)
    [[ -s $MOVE_DIR/old.env ]] || die "$MOVE_DIR/old.env is missing (written by cutover)"
    load_env_file "$MOVE_DIR/old.env"
    PG_OLD_DIRECT=$(libpq_url "$OLD_DIRECT_URL"); PG_OLD_POOLED=$(libpq_url "$OLD_DATABASE_URL"); PG_OLD_EVO=$(libpq_url "$OLD_EVOLUTION_DATABASE_URL")
    point_app_at "$OLD_DATABASE_URL" "$OLD_DIRECT_URL" "$OLD_EVOLUTION_DATABASE_URL"
    restart_until_on "$PG_OLD_DIRECT" "the old database" || say "!! could not confirm the app on the old database — check by hand"
    unfreeze
    security add-generic-password -U -s cf-hogwarts-DATABASE_URL -a abdout -w "$OLD_DATABASE_URL"
    security add-generic-password -U -s cf-hogwarts-DIRECT_URL -a abdout -w "$OLD_DIRECT_URL"
    security add-generic-password -U -s cf-hogwarts-EVOLUTION_DATABASE_URL -a abdout -w "$OLD_EVOLUTION_DATABASE_URL"
    MAX_DB_MS=400 verify || true
    say "rolled back to the old database. Anything written to the new one since the cutover is NOT here."
    ;;
  freeze-test)   # freeze, check, unfreeze — a few seconds of refused writes, no copy
    load_urls
    trap 'rc=$?; if (( rc )); then say "freeze-test failed — unfreezing"; unfreeze || true; fi' EXIT
    T=$SECONDS; freeze; unfreeze; trap - EXIT
    say "freeze-test passed: refused and restored in $(elapsed $T)"
    ;;
  verify) verify ;;
  *) die "unknown mode: $MODE" ;;
esac
