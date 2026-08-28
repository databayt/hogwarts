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
   and delete `.github/workflows/conference-crons.yml` (see above).
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
