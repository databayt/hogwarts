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

echo "==> stripping Next 16 segment-prefetch routes to fit the 2048 route cap"
node -e '
const fs = require("fs");
const p = ".vercel/output/config.json";
const c = JSON.parse(fs.readFileSync(p, "utf8"));
const before = c.routes.length;
c.routes = c.routes.filter(r => !JSON.stringify(r).includes(".segment") || !!r.handle);
fs.writeFileSync(p, JSON.stringify(c));
console.log(`    routes ${before} -> ${c.routes.length} (max 2048)`);
if (c.routes.length > 2048) { console.error("    STILL OVER THE LIMIT — deploy will be rejected"); process.exit(1); }
'

echo "==> deploying (single archive: the free plan caps files-per-day, not size)"
vercel deploy --prebuilt --prod --archive=tgz --scope databayt

# vercel link/pull write .env.local, which this project forbids.
rm -f .env.local
echo "==> done"
