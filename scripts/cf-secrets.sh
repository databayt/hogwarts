#!/usr/bin/env bash
# Push the Worker's runtime secrets from a dotenv file (e.g. one pulled with
# `vercel env pull <file> --environment=production --scope databayt`).
#
#   scripts/cf-secrets.sh <dotenv-file> <pilot-origin> [DATABASE_URL]
#
# Values never touch the terminal or git: the file is converted to JSON in a
# temp path and handed to `wrangler secret bulk`. Host-bound vars are rewritten
# to the pilot origin, Vercel/Turbo/Nx build noise and Sentry are dropped (no
# pilot noise in the prod project), empty values are dropped, and DATABASE_URL may be
# replaced — pass the Neon branch URL, never let the pilot inherit prod's.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=${1:?dotenv file}; ORIGIN=${2:?pilot origin, e.g. https://hogwarts.osmanabdout.workers.dev}; DB=${3:-}
OUT=$(mktemp -t cf-secrets.XXXXXX.json)
trap 'rm -f "$OUT"' EXIT
SRC="$SRC" ORIGIN="$ORIGIN" DB="$DB" OUT="$OUT" node -e '
const fs = require("fs");
const out = {};
for (const raw of fs.readFileSync(process.env.SRC, "utf8").split("\n")) {
  const m = raw.match(/^([A-Z0-9_]+)=(.*)$/); if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith(`"`) && v.endsWith(`"`)) || (v.startsWith("\x27") && v.endsWith("\x27"))) v = v.slice(1, -1);
  v = v.replace(/\\n$/, "");
  if (v === "") continue;                       // Vercel drops empties at build time; z.string().min(1).optional() rejects ""
  out[m[1]] = v;
}
for (const k of Object.keys(out)) if (/^(VERCEL|TURBO_|NX_|SENTRY_|NEXT_PUBLIC_SENTRY_)/.test(k)) delete out[k];
const host = new URL(process.env.ORIGIN).host;
Object.assign(out, {
  NEXTAUTH_URL: process.env.ORIGIN, NEXT_PUBLIC_APP_URL: process.env.ORIGIN,
  NEXT_PUBLIC_MAIN_APP_URL: process.env.ORIGIN, DOMAIN: process.env.ORIGIN,
  NEXT_PUBLIC_ROOT_DOMAIN: host, AUTH_TRUST_HOST: "true",
});
if (process.env.DB) { out.DATABASE_URL = process.env.DB; delete out.DIRECT_URL; }
fs.writeFileSync(process.env.OUT, JSON.stringify(out));
console.log(`==> ${Object.keys(out).length} secrets prepared (DATABASE_URL host: ${new URL(out.DATABASE_URL).host})`);
'
pnpm exec wrangler secret bulk "$OUT"
