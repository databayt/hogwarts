#!/usr/bin/env bash
# hogwarts → Cloudflare Containers. Builds the Next standalone server on the Mac,
# wraps it in a COPY-only linux/amd64 image, smokes it locally, deploys it behind
# the Worker in cf/worker.js. Nothing here touches vercel.json, .vercel/, DNS or
# scripts/deploy-hobby.sh; Vercel stays a working fallback until DNS is flipped.
#
#   scripts/deploy-cloudflare.sh <env-file> build|smoke|deploy|all
#
# <env-file>  a dotenv with the PRODUCTION values (vercel env pull …). Used verbatim:
#             NEXT_PUBLIC_* are inlined by next build; non-secret vars are baked into
#             the image as env.json; secrets go to the Worker via scripts/cf-secrets.sh.
# build       export the source, install, generate Prisma for debian x86-64, next build
#             (standalone, NO prebuild — the hobby lane never ran it either, and with a
#             prod DATABASE_URL it would write to prod at build time), assemble the image dir
# smoke       docker build (linux/amd64) + run on :3300 with SMOKE_DATABASE_URL, curl it, stop
# deploy      wrangler deploy from the build dir (builds + pushes the image, needs Workers Paid)
#
# CF_SOURCE=<ref>|head|worktree  what to build (default head). Pin to the commit the
#             live site runs for a like-for-like cutover.
# CF_OVERLAY="a b c"             working-tree files copied over the export.
# CF_BUILD_DIR, CF_HEAP_MB (3072), NEXT_BUILD_CPUS (2): 9 workers + 8 GB and 4 + 4 GB
#             both got killed for memory on this 16 GB machine with other sessions resident.
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=${1:?dotenv with production values}; MODE=${2:-all}
ENV_FILE=$(cd "$(dirname "$ENV_FILE")" && pwd)/$(basename "$ENV_FILE")
BUILD_DIR=${CF_BUILD_DIR:-${TMPDIR:-/tmp}/hogwarts-cf-build}
IMAGE=hogwarts-cf:local

build() {
  local SOURCE=${CF_SOURCE:-head}
  rm -rf "$BUILD_DIR"; mkdir -p "$BUILD_DIR"
  if [[ "$SOURCE" == "worktree" ]]; then
    echo "==> copying the WORKING TREE ($(git rev-parse --short HEAD) + uncommitted changes) to $BUILD_DIR"
    rsync -a --exclude node_modules --exclude .next --exclude .open-next --exclude .vercel \
      --exclude .git --exclude coverage --exclude playwright-report --exclude test-results ./ "$BUILD_DIR/" \
      || { rc=$?; [[ $rc == 23 || $rc == 24 ]] && echo "    (rsync $rc: files changed under us — another session is editing; continuing)" || exit $rc; }
  else
    local REF=$SOURCE; [[ "$REF" == "head" ]] && REF=HEAD
    echo "==> exporting $REF ($(git rev-parse --short "$REF")) to $BUILD_DIR"
    git archive "$REF" | tar -x -C "$BUILD_DIR"
    for f in ${CF_OVERLAY:-}; do mkdir -p "$BUILD_DIR/$(dirname "$f")"; cp -R "$f" "$BUILD_DIR/$f"; echo "    overlay: $f"; done
  fi
  cp .env "$BUILD_DIR/.env"                       # prisma.config.ts loads it
  cd "$BUILD_DIR"

  echo "==> installing for darwin + linux/x64 (sharp, swc binaries for the image)"
  node -e '
    const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));
    p.pnpm={...(p.pnpm||{}),supportedArchitectures:{os:["current","linux"],cpu:["current","x64"],libc:["current","glibc"]}};
    fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'
  pnpm install --frozen-lockfile --prefer-offline --silent
  node scripts/fetch-thmanyah.mjs                 # woff2 are gitignored, fetch-only license

  echo "==> prisma generate for the image (debian x86-64) + native"
  PRISMA_CLI_BINARY_TARGETS=native,debian-openssl-3.0.x pnpm exec prisma generate >/dev/null
  ls node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/ | grep -E "libquery_engine" | sed 's/^/    engine: /'

  echo "==> next build (standalone) with $ENV_FILE"
  export CF_CONTAINER=1 NODE_OPTIONS="--max-old-space-size=${CF_HEAP_MB:-3072}" NEXT_TELEMETRY_DISABLED=1 NEXT_BUILD_CPUS=${NEXT_BUILD_CPUS:-2}
  node cf/env-split.mjs "$ENV_FILE" run -- pnpm exec next build
  [[ -f .next/standalone/server.js ]] || { echo "ABORT: .next/standalone/server.js missing"; exit 1; }

  echo "==> assembling: baked non-secret config, sharp + prisma checks"
  node cf/env-split.mjs "$ENV_FILE" config > .next/standalone/env.json
  echo "    env.json: $(node -e 'console.log(Object.keys(require("./.next/standalone/env.json")).length)') config vars; $(node cf/env-split.mjs "$ENV_FILE" secrets | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(Object.keys(JSON.parse(s)).length))') secrets stay with the Worker"
  ls -d .next/standalone/node_modules/.pnpm/@img+sharp-linux-x64* >/dev/null 2>&1 && echo "    sharp linux-x64: ok" || echo "    WARN: sharp linux-x64 not in standalone output"
  find .next/standalone -name "libquery_engine-debian-openssl-3.0.x.so.node" | head -1 | grep -q . && echo "    prisma debian engine: ok" || echo "    WARN: prisma debian engine not in standalone output"
  du -sh .next/standalone .next/static public | sed 's/^/    /'
}

smoke() {
  cd "$BUILD_DIR"
  echo "==> docker build (linux/amd64, COPY-only)"
  docker build --platform linux/amd64 -t "$IMAGE" . 2>&1 | tail -3
  local DENV; DENV=$(mktemp -t hogwarts-smoke.XXXXXX); trap 'rm -f "$DENV"' RETURN
  node cf/env-split.mjs "$ENV_FILE" docker > "$DENV"
  [[ -n "${SMOKE_DATABASE_URL:-}" ]] && printf 'DATABASE_URL=%s\nDIRECT_URL=%s\n' "$SMOKE_DATABASE_URL" "$SMOKE_DATABASE_URL" >> "$DENV"
  docker rm -f hogwarts-cf-smoke >/dev/null 2>&1 || true
  echo "==> docker run :3300 (DATABASE_URL host: $(grep -E '^DATABASE_URL=' "$DENV" | tail -1 | sed -E 's#.*@([^/:]+).*#\1#'))"
  docker run -d --rm --name hogwarts-cf-smoke --platform linux/amd64 -p 3300:3000 --env-file "$DENV" "$IMAGE" >/dev/null
  for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3300/api/health && break; sleep 2; done
  echo "    boot: ${i}×2s"
  for p in /api/health /en /ar /en/login /en/pricing "/en/s/demo/dashboard" /en/docs; do
    printf "    %-22s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url} %{time_total}s' "http://localhost:3300$p")"
  done
  printf "    %-22s %s\n" "host demo.balqalam.com" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -H 'Host: demo.balqalam.com' http://localhost:3300/dashboard)"
  echo "==> container log tail"; docker logs --tail 15 hogwarts-cf-smoke 2>&1 | sed 's/^/    /'
  docker stop hogwarts-cf-smoke >/dev/null
}

deploy() {
  cd "$BUILD_DIR"
  echo "==> wrangler deploy (builds + pushes the image; needs Workers Paid)"
  pnpm exec wrangler deploy
}

case "$MODE" in
  build) build ;;
  smoke) smoke ;;
  deploy) deploy ;;
  all) build; smoke; deploy ;;
  *) echo "mode must be build|smoke|deploy|all"; exit 2 ;;
esac
echo "==> done ($MODE)"
