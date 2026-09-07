#!/usr/bin/env bash
# Push the container's SECRETS to the Worker from a production dotenv
# (`vercel env pull <file> --environment=production --scope databayt`).
# Only secret-classified names (see cf/env-split.mjs) are uploaded; the rest is
# baked into the image by scripts/deploy-cloudflare.sh. Values never touch the
# terminal or git. Secrets reach the container at its next start.
#
#   scripts/cf-secrets.sh <dotenv-file>
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=${1:?dotenv file}
OUT=$(mktemp -t cf-secrets.XXXXXX.json); trap 'rm -f "$OUT"' EXIT
node cf/env-split.mjs "$SRC" secrets > "$OUT"
echo "==> $(node -e 'console.log(Object.keys(require(process.argv[1])).length)' "$OUT") secrets → Worker (names: $(node cf/env-split.mjs "$SRC" names | awk '$1=="secret"{print $2}' | tr '\n' ' '))"
pnpm exec wrangler secret bulk "$OUT"
