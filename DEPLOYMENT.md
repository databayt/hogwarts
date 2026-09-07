# Deployment

> **Current state (2026-08-28): hogwarts runs on the FREE Vercel account as a temporary bridge.**
> The Pro team is soft-blocked on an unpaid invoice. This document is how to deploy today, and how
> to move back to Pro when the invoice clears. It is written to be deleted once that happens.

## Why we are here

On **2026-08-22 05:28Z** the Vercel Pro team `osman-abdouts-projects` was soft-blocked for an unpaid
invoice (Mada/Al Rajhi cards are declined by Vercel billing). Every hostname began serving
**HTTP 402 `DEPLOYMENT_DISABLED`**. The last healthy production deploy was 04:12Z the same day —
about an hour before the block.

hogwarts was the only databayt product still on that team; kun, mkan, marketing, codebase and twenty
had already moved to the free `databayt` account. It is now there too.

|                 |                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Account         | `databayt` (Hobby) — `team_BrPSqGS4wSpLors2B9jYAAFs`                                            |
| Project         | `hogwarts` — `prj_KEuI2aVzMHIeBkjVcpK7KQvWGIJe`                                                 |
| Live hosts      | `ed.databayt.org`, `demo.databayt.org`, `balqalam.com`, `www.balqalam.com`, `demo.balqalam.com` |
| Git auto-deploy | **Disconnected on purpose** — see below                                                         |
| Crons           | **All 31 disabled** — see below                                                                 |

> The Hobby plan's terms are non-commercial. This is a knowing, temporary exception; settle the
> invoice and move back.

## Deploying

```bash
./scripts/deploy-hobby.sh
```

That is the whole command. It builds locally, fixes up the output, and uploads. **`git push` does
not deploy** — the project's Git connection was deliberately removed.

### Why it is not just `git push`

Three separate platform limits block the normal path. Each first presented as something other than
its cause, so they are recorded here rather than rediscovered.

**1. Vercel cannot build this app on a Hobby build machine.**
Hobby gets 2 cores. A cold build of ~420 routes was killed at the 45-minute cap having printed
nothing since `Creating an optimized production build` — no error, no out-of-memory message. Pro
built the identical tree in **2.6 minutes**, but only with a warm cache, and a new project has none.
Commit `201a1f5f7` already recorded that cold builds of this app do not finish, which is what
`keep-cache-warm.yml` existed to avoid.

So we build locally instead — 10 cores, about a minute — and ship the output. Git auto-deploy is
disconnected so a push cannot silently start another doomed 45-minute build or replace a working
deployment with a failed one.

**2. `Too many requests — more than 5000` on upload.**
This is a **files-per-24-hours** cap on the free plan, not the 100 MB size cap it looks like. The
deploy uploads 14,452 files. `--archive=tgz` sends a single tarball instead, and the size never
mattered.

**3. `Maximum number of routes exceeded. Max is 2048, received 2211`.**
551 of those are Next 16 client segment-prefetch rewrites (`.segment`). They are a prefetch
optimisation, not functionality, and Next 16.3 exposes no config flag to stop emitting them. The
script strips them, landing at 1,657, and the app works. Vercel's own cloud builder does not appear
to emit them, which is why this never surfaced on Pro.

### Prisma

`prisma/schema.prisma` declares `binaryTargets = ["native", "rhel-openssl-3.0.x"]` because we now
build on macOS and run on Amazon Linux. Without the rhel engine every query fails at runtime. This
line is harmless on Pro — leave it.

### `prebuild` does not run on the Hobby lane

`scripts/deploy-hobby.sh` calls `vercel build`, which runs the framework command (`next build`)
directly — not `pnpm build` — so the npm `prebuild` hook and with it `prisma/seeds/ensure-demo.ts`
**never run on a Hobby deploy**. Nothing has re-asserted the demo since 2026-08-27. That is why
`Period.isBreak` stayed false on every demo period after the column landed (`seedPeriods` would
have set it) until `pnpm db:seed:single conference` repaired it by hand on 2026-08-29. If the demo
looks stale, run `tsx prisma/seeds/ensure-demo.ts` from the repo root against the prod `.env`.

## Crons are off

`vercel.json` has `"crons": []`. This is **not** optional: the Hobby plan allows daily-only schedules
and rejects the entire deployment if it sees a sub-daily one, and 17 of our 31 jobs run every 15–30
minutes. The original array is preserved verbatim in **`vercel.crons.full.json`**.

> ### Before re-enabling `process-email-notifications`, read this
>
> There are **19,996 unsent notification emails** queued, the oldest from 2026-04-13, addressed to
> roughly **5,500 real recipients** (12,109 of them at qdwa, a live school). `emailSent` is true on
> **zero** rows — this job has never once run successfully — and `notification_preferences` is
> empty, so `checkEmailPreference()` defaults to send for everybody.
>
> Switching it on as-is sends about **9,600 months-old emails per day** into a live school for two
> days. That is unrecoverable once sent and a Resend-reputation event.
>
> Gate it first: suppress the backlog with an explicit age-bounded statement, then verify the
> remaining queue is small, then enable. Better still, add the age cutoff inside
> `processPendingEmailNotifications()` so this cannot recur.
>
> **Done 2026-09-05:** `processPendingEmailNotifications()` now carries an age gate
> (`EMAIL_QUEUE_MAX_AGE_DAYS = 3` in `email-service.ts`). Every run first marks rows older than the
> gate `emailSent: true` with `emailError: "Expired: …"`, then drains only recent rows. The first
> live run therefore retires the whole backlog above without sending it. From that run on, queued
> notification email reaches real recipients — the bridge below enables it knowingly.

### The four admission / finance jobs run on GitHub Actions too

`.github/workflows/admission-crons.yml` pings `fee-due` (daily 08:00), `fee-overdue` (daily 09:00),
`process-email-notifications` (`*/15`) and `process-document-jobs` (`*/30`) the same way. Without
them the student-intake pipeline stops after enrollment: no instalment reminders, no offer-expiry
reminders or `EXPIRED` flips, no OVERDUE detection or late fees, no unplaced-student alerts, and every
notification written with `delivery: "queue"` (every bulk-import notice) sits unsent forever. It alerts
on databayt/hogwarts#314 and uses the same `CRON_SECRET` repo secret.

**Delete that workflow too when you restore the cron array**, or the four jobs fire twice.

### The three conference jobs run on GitHub Actions instead

`.github/workflows/conference-crons.yml` pings `live-class-reminders` (`*/15`),
`end-stale-live-classes` (`*/30`) and `expire-live-recordings` (daily) with a `Bearer $CRON_SECRET`
header. This is not a nicety: `live-class-reminders` is the only caller of `materializeOnlineSchools()`,
so with every cron off a school that teaches online materializes **zero** sessions after the day it
saved its settings — nothing to join and no reminders. It needs a `CRON_SECRET` **repo secret**
matching the Vercel project value.

**Delete that workflow when you restore the cron array below**, or the three jobs fire twice.

## Moving back to the paid account

1. Restore the cron array: copy `vercel.crons.full.json`'s `crons` back into `vercel.json`,
   and delete `.github/workflows/conference-crons.yml` and `.github/workflows/admission-crons.yml`
   (see above).
2. Move the five hostnames from the Hobby project to the Pro one.
3. Redeploy from git on Pro. Its warm cache builds this in ~2.6 minutes.

Nothing else needs undoing. No application code was changed for the bridge — the only additions are
`scripts/deploy-hobby.sh`, the Prisma `binaryTargets` line, and this file. `public/`, `.vercelignore`,
`next.config.ts`, `src/proxy.ts` and `src/lib/root-domain.ts` were never touched.

## Notes that cost time to learn

- **Domains claimed themselves.** All five hostnames were taken from the blocked Pro project by
  `_vercel` TXT verification, with no access to that account and no dashboard work. `databayt.org`
  is on Vercel nameservers in the free account; `balqalam.com` is on Cloudflare and its records were
  added there. Cloudflare records must stay **grey-clouded** — the orange-cloud proxy blocks Vercel
  certificate issuance.
- **`hogwarts.databayt.org` is taken** by the `twenty` CRM project. Do not use it.
- **Vercel stores a trailing newline in env values.** Eight production values carried one, including
  `AUTH_SECRET` and `DATABASE_URL`. Trim on the way in — this previously broke kun (PR #97). Because
  `AUTH_SECRET` was trimmed, its value changed and all pre-existing sessions were invalidated.
- **`vercel link` and `vercel env pull` write `.env.local`**, which this project forbids. Delete it
  after either command; `deploy-hobby.sh` already does.
- **`vercel deploy` ships the working tree, not `HEAD`.** Commit before deploying.
- **Hobby quotas are pooled per account, not per project.** Exceeding them pauses everything for 30
  days with no pay-as-you-go escape — and that same pool serves `kun.databayt.org`, `www.mkan.sd`
  and `databayt.org`. Builds are also one-at-a-time account-wide, so a hogwarts build blocks the
  other projects' deploys. Worth a glance at the usage page while we are here.
- **There is no `robots.txt`.** All ~420 routes across every tenant subdomain are crawlable, which is
  the cheapest way to burn the shared quota if this arrangement lasts.

## Cloudflare Workers pilot — a second host, in parallel

> Started 2026-09-07. The question was whether Cloudflare can replace Vercel + Neon. It was measured
> on the exact commit balqalam.com runs (`bb675c5af`, deployed 2026-09-02), beside the Vercel
> deployment, not instead of it. **Verdict: hogwarts does not fit a Cloudflare Worker.** The build
> works end to end; the bundle is 3.4× the platform ceiling. Nothing in the Vercel lane changed.

### The measurement

| | |
| --- | --- |
| Worker script (wrangler dry run) | **172 MB raw · 31.6 MB gzipped** |
| Ceiling | 3 MiB gzipped free · **10 MiB gzipped paid** |
| Compiled app code (Next SSR chunks + app pages) | ~85 MB raw — 491 pages, 215 route handlers |
| Next runtime | 16 MB raw |
| Docs stack (shiki + langs + themes + prettier + compiled MDX source chunk) | ~33 MB raw |
| Prisma (Wasm engine, shipped as a separate module) | 2.2 MB raw · 0.8 MB gzipped |

Even with the docs stack removed the script is ~100 MB raw (≈19 MB gzipped), still twice the paid
ceiling. The app code alone is over it. This is a property of the app's surface area, not of any
one dependency.

### What was proven on the way (all reusable)

- `next build` + OpenNext produce a working Worker bundle for this app, including `proxy.ts` (Node
  middleware, supported since `@opennextjs/cloudflare` 1.20.3 → needs Next ≥16.3.3, hence the bump).
- Prisma on workerd: `@prisma/adapter-pg` with `maxUses: 1` behind `DB_ADAPTER=pg`; the same
  `src/lib/db.ts` returns identical rows with and without the adapter against local Postgres.
- Two Turbopack traps and their fixes are in `next.config.ts`: the adapter must resolve to a stub in
  browser bundles, and `pg-cloudflare` must be force-included in output tracing (its default export
  condition is an empty stub).
- vinext (Cloudflare's recommended path) is not an option: `npx vinext check` flags next-auth as
  unsupported and requires `"type": "module"`.

### Options if Cloudflare is still the goal

1. **Cloudflare Containers** — run the standalone `next start` server in a container behind a
   Worker. No size ceiling, no adapter, Prisma's normal engine, crons via Worker cron triggers.
   Needs the $5/mo Workers Paid plan; an always-on `basic` instance (¼ vCPU, 1 GiB) is roughly
   $20/mo at list price, `standard-1` (½ vCPU, 4 GiB) roughly $50/mo. Cold starts if scaled to zero.
   This is the drop-in path and the one to pilot next.
2. **Multi-worker split** — OpenNext can run middleware and server in separate Workers and "could
   split further"; fitting ~85 MB of app code under 10 MiB per Worker would need 5–8 Workers by route
   prefix, loses `opennextjs-cloudflare deploy`, preview URLs and skew protection, and the fit is
   unproven. Weeks, not days.
3. **Stay on Vercel** — the Hobby lane above is the working state; the Pro block was an invoice, not
   a platform limit.

### The lane, as built

|                 |                                                                                   |
| --------------- | --------------------------------------------------------------------------------- |
| Account         | Cloudflare `ce9a5376d149c808a0b97072421ba12f` (osmanabdout@hotmail.com), workers.dev subdomain `osmanabdout` |
| Worker          | `hogwarts` (never deployed — size gate)                                           |
| Adapter         | `@opennextjs/cloudflare` 1.20.6 on Next 16.3.4                                    |
| Database        | Neon branch `br-proud-breeze-adn79b1b` (a 2026-08-29 prod snapshot) was wired for the smoke test; the pinned commit's `prebuild` re-asserted the demo seed on it. Prod was never touched. The project is at its 10-branch limit, so no new branch was created |
| Crons           | None in `wrangler.jsonc` on purpose                                              |
| DNS             | Untouched                                                                         |

```bash
# runtime secrets (once) — from a pulled Vercel prod env; drops empties, Vercel/Turbo/Nx, Sentry
vercel env pull /tmp/prod.env --environment=production --scope databayt && rm -f .env.local
scripts/cf-secrets.sh /tmp/prod.env https://hogwarts.osmanabdout.workers.dev "<neon branch pooled url>"

# build the live commit from a clean export (+ the one file HEAD forgot), size gate, no deploy
CF_SOURCE=bb675c5af CF_OVERLAY="package.json pnpm-lock.yaml next.config.ts prisma/schema.prisma \
  src/lib/db.ts src/lib/db-adapter.browser.ts src/components/saas-marketing/pricing/lib/db.ts \
  wrangler.jsonc open-next.config.ts src/lib/platform-notification.ts" \
  scripts/deploy-cloudflare.sh /tmp/build.env --no-deploy
```

The build env file must carry the same `NEXT_PUBLIC_*` values as the secrets because `next build`
inlines them. Builds run at 2 workers / 3 GB heap; 9 workers + 8 GB and 4 + 4 GB were both killed
for memory on this 16 GB machine while other sessions had `next dev` and `tsc` resident.

### What is shared with the Vercel lane (all inert there)

- `next` 16.3.0 → 16.3.4 (+ `@next/mdx`, `eslint-config-next`). Reaches Vercel only on the next
  manual hobby deploy.
- `src/lib/db.ts` — when `DB_ADAPTER=pg` (set only in `wrangler.jsonc`) the client is built on
  `@prisma/adapter-pg` with `maxUses: 1`. `src/components/saas-marketing/pricing/lib/db.ts`
  re-exports the shared singleton. `global` → `globalThis`.
- `next.config.ts` — `.prisma/client` in `serverExternalPackages`; a Turbopack alias resolving
  `@prisma/adapter-pg` to `src/lib/db-adapter.browser.ts` in browser bundles; `pg-cloudflare` in
  `outputFileTracingIncludes`; `experimental.cpus` from `NEXT_BUILD_CPUS` when set.

Vercel never sees `wrangler.jsonc`, `open-next.config.ts`, `.open-next/`, or the two scripts.

### HEAD does not build from a clean checkout (found 2026-09-07)

The first pilot build used `git archive HEAD` and failed. Committed code imports
`src/lib/platform-notification.ts` (from the lumos video actions and the catalog approval actions),
but that file was never `git add`ed — and neither were the two things it depends on:

- `prisma/models/notifications.prisma` — the `content_review` enum label (HEAD lacks it; prod has it)
- `prisma/migrations/20260828010000_add_content_review_notification_types/`

Vercel never noticed because the hobby lane builds the working tree. A tracked test
(`src/tests/lib/platform-notification.test.ts`) imports the module too. Whoever owns the
content-review work should commit those three together. Ten more untracked modules (lumos courses
shelves, dashboard home-block/next-action/today-timetable, textbook format/ornament) are imported
only by *uncommitted* edits, so they belong to that session's work, not to HEAD.

Until then the pilot builds HEAD with the one file copied over the export:

```bash
CF_SOURCE=head CF_OVERLAY="src/lib/platform-notification.ts" scripts/deploy-cloudflare.sh <env>
```

`CF_SOURCE=worktree` exists too, but the working tree is a moving target while other sessions edit —
two builds died on a half-written i18n JSON and a file that vanished mid-copy.

### What the `workers.dev` host can and cannot prove

`hogwarts.osmanabdout.workers.dev` is not a known root domain, so `src/proxy.ts` takes its default
branch: marketing pages, login, and DB round-trips work. Tenant dashboards need a **wildcard
hostname** (`demo.<root>`) — on the pilot they are reachable only by the internal path
`/en/s/<school>/…`, and post-login redirects resolve an unknown root to `databayt.org`. Do **not**
use a `*.pilot.balqalam.com` wildcard: `cookieDomainForHost` would scope the pilot's session cookie
to `.balqalam.com` and send it to live prod. Phase 2 needs either a throwaway domain on the
Cloudflare account or an additive host shape in `src/lib/root-domain.ts` (like the existing
`tenant---branch.vercel.app` pattern).

### Removing the lane

Revert the pilot commits (`be65e69db`, `5317961f6`, `a4f39f535` and the docs commit). The Worker was never
created. The Neon snapshot branch `br-proud-breeze-adn79b1b` predates the pilot and can stay or go.
