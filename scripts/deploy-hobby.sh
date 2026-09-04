#!/usr/bin/env bash
# Deploy hogwarts to the FREE (Hobby) Vercel account — the bridge lane used while
# the Pro account is soft-blocked on the unpaid invoice.
#
# Why this script exists rather than `git push`:
#
#   1. Vercel's own builder cannot build this app on the Hobby machine. Hobby gets
#      2 cores; a COLD build of ~420 routes exceeded the 45-minute cap and was
#      killed. Pro built the same commit in 2.6 minutes — but only with a warm
#      cache, and a new project has none. So we build locally (10 cores) instead.
#      Git auto-deploy is deliberately disconnected on the Hobby project.
#
#   2. `vercel deploy` without --archive uploads every file individually and trips
#      the free plan's 5,000-files-per-24h cap. --archive=tgz uploads one tarball.
#
#   3. The locally-generated .vercel/output/config.json declares 2,208 routes
#      against a hard platform max of 2,048. 551 of them are Next 16 client
#      segment-prefetch rewrites (".segment"), which are a prefetch optimisation,
#      not functionality. Stripping them lands at 1,657 and the app works. There
#      is no next.config flag to disable their emission in 16.3.
#
# Undo when the invoice clears: redeploy from git on the Pro project. Nothing here
# is permanent, and no application code is modified.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> building locally (Vercel's Hobby builder cannot finish this cold)"
vercel build --prod --scope databayt

echo "==> checking the Prisma engines the functions will need"
# `vercel build` on Apple Silicon tags every function `architecture: arm64`
# (see .vercel/output/functions/**/.vc-config.json), and Prisma only ships the
# engines named in the generator's binaryTargets. From 2026-08-31 to 09-03 the
# client carried darwin + rhel (x86-64) only, so every function that actually
# landed on arm64 threw PrismaClientInitializationError at its first query —
# the live-class crons and fee-due 500'd on every run while tsc, vitest and the
# build stayed green. Nothing but a prod request can catch it, so refuse to
# upload a bundle whose architecture has no matching engine.
node -e '
const fs = require("fs"), path = require("path");
const root = ".vercel/output/functions";
const ENGINE = { arm64: "libquery_engine-linux-arm64-openssl-3.0.x.so.node", x86_64: "libquery_engine-rhel-openssl-3.0.x.so.node" };
const need = new Set(), have = new Set();
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name);
  if (e.isDirectory()) walk(f);
  else if (e.name === ".vc-config.json") { try { need.add(JSON.parse(fs.readFileSync(f, "utf8")).architecture || "x86_64"); } catch {} }
  else if (e.name.startsWith("libquery_engine-")) have.add(e.name);
} };
walk(root);
const missing = [...need].filter((a) => ENGINE[a] && !have.has(ENGINE[a]));
console.log(`    architectures: ${[...need].join(", ") || "none"}; engines bundled: ${[...have].join(", ") || "none"}`);
if (missing.length) { console.error(`    ABORT: no Prisma engine bundled for ${missing.join(", ")} — add it to binaryTargets in prisma/schema.prisma and run pnpm prisma generate`); process.exit(1); }
'

echo "==> stripping Next 16 segment-prefetch routes to fit the 2048 route cap"
node -e '
const fs = require("fs");
const p = ".vercel/output/config.json";
const c = JSON.parse(fs.readFileSync(p, "utf8"));
const before = c.routes.length;

// A route matching ".segment" has one of two shapes:
//
//   pure     — a segment-prefetch rewrite and nothing else. Always droppable.
//   combined — Next 16 emits ONE route per page whose src alternates over all
//              three RSC suffixes: (\.rsc|\.prefetch\.rsc|\.segments/...).
//              DELETING it takes that page plain .rsc handling with it: the
//              document still renders, but every soft navigation to the page
//              404s its RSC payload and falls back to a full document load.
//              That shipped on 2026-09-01 (observed on /en/pricing).
//
// So rewrite the combined ones to drop only the ".segments" alternative, and
// delete the rest. All 556 combined routes do NOT fit (1711 + 556 = 2267), so
// the rewrite is spent where soft navigation is user-visible — the non-tenant
// marketing/docs/public pages — while tenant "/s/" dashboard routes keep the
// old delete behaviour.
//
// The middlewarePath/handle guard is load-bearing, not defensive tidiness. The
// middleware route matches ".segments/....segment.rsc" as an OPTIONAL group in
// its own src regex, so a naive substring filter deletes it — which silently
// removes the proxy, and with it all tenant subdomain routing. Every host then
// serves the marketing site and looks fine while being wrong. That shipped once.
const SEG_ALT = "|\\.segments/.+\\.segment\\.rsc";
let rewritten = 0;
c.routes = c.routes.filter(r => {
  if (r.middlewarePath || r.handle) return true;
  if (!JSON.stringify(r).includes(".segment")) return true;
  if (typeof r.src === "string" && r.src.includes(SEG_ALT) && !r.src.includes("/s/")) {
    r.src = r.src.replace(SEG_ALT, "");
    rewritten++;
    return true;
  }
  return false;
});

const mw = c.routes.filter(r => r.middlewarePath).length;
console.log(`    routes ${before} -> ${c.routes.length} (max 2048), rsc-preserved: ${rewritten}, middleware routes: ${mw}`);
if (mw !== 1) { console.error("    ABORT: middleware route missing — tenant routing would break"); process.exit(1); }
if (c.routes.length > 2048) { console.error("    ABORT: still over the route cap"); process.exit(1); }
fs.writeFileSync(p, JSON.stringify(c));
'

echo "==> deploying (single archive: the free plan caps files-per-day, not size)"
vercel deploy --prebuilt --prod --archive=tgz --scope databayt

# vercel link/pull write .env.local, which this project forbids.
rm -f .env.local
echo "==> done"
