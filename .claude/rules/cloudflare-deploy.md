---
domain: deployment
severity: blocking
since: 2026-09-09
---

# hogwarts runs on Cloudflare, not Vercel

Auto-loads in this repo. The reasoning, the traps and the platform-wide runbook live in the
`cloudflare` agent and the `cloudflare` skill; the long-form history is in `DEPLOYMENT.md`. This
file is the minimum a session must know before touching deployment here.

## The facts

| | |
| --- | --- |
| Live hosts | `balqalam.com`, `www.balqalam.com`, `*.balqalam.com` (every school tenant) |
| Worker | `hogwarts` — a thin Worker in front of **one always-on `standard-1` container** |
| Why a container | the Worker bundle measured 172 MB raw / **31.6 MB gzipped** against a 10 MiB ceiling |
| Zone | `balqalam.com`, **Pro plan** (bought 2026-09-08 to escape a blocked IP range) |
| Account | `ce9a5376d149c808a0b97072421ba12f` · workers.dev subdomain `osmanabdout` |
| Database | unchanged — Neon `ep-little-credit`, project `square-hall-52214783` |
| Repo | `~/hogwarts` → `github.com/databayt/hogwarts`, **main-only, no PRs** |
| Crons | 15 UTC triggers in `wrangler.jsonc` → 24 `/api/cron/*` routes via `cf/crons.json`; 7 more stay on GitHub Actions |

**Vercel is dead here.** Both the Pro team and the free `databayt` account are disabled and every
Vercel hostname answers HTTP 402. `vercel.json`, `.vercel/` and `scripts/deploy-hobby.sh` are
historical. `ed.databayt.org` and `demo.databayt.org` will not work until the `databayt.org` zone
moves off Vercel's nameservers.

## Deploying

The full order lives in the `deploy` skill; these are the commands, in the order they run:

```bash
NODE_OPTIONS=--max-old-space-size=8192 pnpm exec tsc --noEmit        # the default heap SIGABRTs here
git pull --rebase origin main && git push origin main                # main must equal what ships
vercel env pull /tmp/prod.env --environment=production --scope databayt --yes && rm -f .env.local
CF_SOURCE=worktree scripts/deploy-cloudflare.sh /tmp/prod.env build # ~12 min, kill next dev first
scripts/deploy-cloudflare.sh /tmp/prod.env smoke                    # read the curl table, not the exit code
scripts/deploy-cloudflare.sh /tmp/prod.env deploy                   # note "Current Version ID"
```

`CF_SOURCE=worktree` ships uncommitted work — that is what "deploy everything" has meant in
practice, which is why `main` is pushed first. Rollback is `wrangler rollback`.

**The script never seeds.** Every commit under `prisma/seeds` or `prisma/scripts` since the last
deploy is owed a run against the prod `DIRECT_URL` (`pnpm db:seed:single <module>`, exported on
the command line so the local `.env` cannot win), behind a Neon restore point. Neon's free tier is
10 branches / 1 snapshot: when `create_branch` hits the limit, **delete the oldest non-default
branch and retry** (Abdout's standing rule, 2026-09-12), and prune `restore-point-*` branches
older than 7 days once the deploy is verified. Prefer a `no_compute` branch over a snapshot.

## Rules

1. **Check the schema gap before every deploy.** `prisma migrate diff --from-url <prod>
   --to-schema-datamodel prisma`. This repo's migration history is empty by design; DDL is applied
   out-of-band, snapshot first, additive statements only. Shipping code ahead of its columns puts
   "column does not exist" 500s on live pages. This actually happened and was caught pre-deploy.
2. **Never remove `"triggers"` from `wrangler.jsonc` to disable crons.** Omitting the key leaves
   existing schedules in place. Set the array explicitly.
3. **Give new cron triggers a day before calling them broken.** They took ~19 hours to start firing
   here while looking perfectly registered. A standalone cron Worker was built for this and deleted.
4. **`wrangler tail` does not work from this network.** Use the `cloudflare-observability` MCP or
   the telemetry API.
5. **A connection reset is probably the network, not the app.** Compare `curl` direct against
   `curl --resolve <host>:443:104.21.41.193`. If the forced address returns 200, stop debugging the
   deploy.
6. **Verify with a real login**, not an exit code. `admin@kingfahd.com` / `1234` on
   `kingfahd.balqalam.com` reaches a live tenant dashboard.

## Known open items

- Four duplicate `Application` row groups block a unique index the schema wants.
- `/api/health` reports degraded on a bad memory heuristic (heapUsed ÷ heapTotal, not the limit).
- King Fahad has no `classes` rows yet — the school creates those itself.
