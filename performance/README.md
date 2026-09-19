# Performance lab

How Hogwarts measures speed, what the numbers must stay under, and the rules
that keep them there. The goal is not a Lighthouse score. It is this:

> A teacher opens the app on a mid-range phone and an imperfect connection,
> moves between the screens they use every day, and it feels instant.

Every claim about speed in this repo should be a number from this lab —
"before 842 ms, after 411 ms" — not "this should be faster".

- Baseline and the ranked bottlenecks: [`reports/baseline-2026-09-19/`](reports/baseline-2026-09-19/)
- Budgets: [`config/budgets.json`](config/budgets.json)
- What is tracked (routes, roles, profiles): [`config/lab.json`](config/lab.json)

## The commands

| Command                | What it measures                                                         | Needs            |
| ---------------------- | ------------------------------------------------------------------------ | ---------------- |
| `pnpm perf:build`      | Initial JS/CSS per route from a build; which heavy libraries ride along  | a `.next` build  |
| `pnpm perf:probe`      | Edge vs container vs database latency; document payloads                 | network          |
| `pnpm perf:playwright` | Cold / warm / navigation / interaction in a real browser                 | a running target |
| `pnpm perf:lighthouse` | Main-thread cost (TBT, JS bootup, unused JS) on a simulated phone        | a running target |
| `pnpm perf:queries`    | Database round trips per route, and how many wait on each other          | local app        |
| `pnpm perf:rum`        | Field data: p75 from real phones (Workers Analytics Engine)              | Cloudflare token |
| `pnpm perf:report`     | `REPORT.md` + `summary.json`, budget verdicts, diff against the baseline | a run directory  |
| `pnpm perf:check`      | **The gate.** `perf:build` + report, exit 1 on a regression              | a `.next` build  |
| `pnpm perf`            | probe → browser flows (phone profile) → report                           | a running target |

Everything writes to `performance/reports/latest/` unless `--out <dir>` says
otherwise. Pass arguments after `--`: `pnpm perf:playwright -- --target prod --roles teacher`.

### Targets

`--target local` (default) is `http://demo.localhost:3000` — run a **production
build** (`pnpm build && pnpm start`), never `next dev`: dev bundles are several
times larger and unminified, and its numbers mean nothing. `--target prod` is
the live demo tenant. It signs in with the public demo accounts, loads one page
at a time and never writes — one careful user, not a load test.

Local database timings are never evidence about production: the local database
is on the same machine, production's is an ocean away (see "Database").

### Profiles

| Profile       | Device  | CPU | Network added on top of your own               |
| ------------- | ------- | --- | ---------------------------------------------- |
| `mobile`      | Pixel 5 | 4×  | 150 ms RTT, 1.6 Mbps down — Lighthouse's phone |
| `mobile-fast` | Pixel 5 | 4×  | 40 ms RTT, 9 Mbps down — good 4G / Wi-Fi       |
| `none`        | desktop | 1×  | nothing                                        |

Throttling is **added to** the vantage point's real latency. A run records
where it was measured from (`vantage` in the JSON); never compare timings
across vantage points. **Bytes and request counts are exact from anywhere** —
when in doubt, argue from bytes.

### The flows

- **cold** — a fresh browser holding only the session cookie opens the route.
- **warm** — the same browser opens it again: HTTP cache, service worker.
- **nav** — clicks through the sidebar (`navigation` in `lab.json`). Reports
  _visual response_ (click → first frame that changed), _URL change_ and
  _settled_ (last DOM change, no skeleton left), plus bytes moved.
- **interaction** — click → next paint on controls that change nothing (menus,
  the notification bell). This is the building block of INP.

Try a service-worker change against production before deploying it:

```bash
pnpm perf:playwright -- --target prod --profile none --roles admin \
  --routes /dashboard --flows cold,warm --sw-override public/service-worker.js --tag sw-fix
```

## Reading a report

`pnpm perf:report -- --run <dir>` writes `REPORT.md`. Verdicts are `PASS`
(meets the internal target), `ok` (inside Google's "good"), `WARN`, `FAIL`.

| Column       | Meaning                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------ |
| TTFB         | navigation start → first byte, including connection setup                                        |
| doc wait     | request sent → first byte. The server's share: edge → container → database → render              |
| LCP / CLS    | as web.dev defines them (CLS is the worst 5-second session window)                               |
| TBT          | long-task time beyond 50 ms after FCP — how long taps go unanswered while JS runs                |
| HTML decoded | the document after decompression — what the phone must parse                                     |
| flight       | the part of the document that is RSC payload: **the serialized props of every client component** |
| prefetch     | RSC prefetch requests the page fired. Each one is a request to the single container              |

Lab numbers are medians of N runs from one machine. Field numbers
(`pnpm perf:rum`) are p75 over real visits and are the ones that count; the lab
exists to explain them and to catch regressions before users do.

## Budgets

`config/budgets.json`. Timings are judged under the `mobile` profile.

| Metric                          | Target    | Google "good" |
| ------------------------------- | --------- | ------------- |
| LCP (p75)                       | 1.5 s     | 2.5 s         |
| TTFB (p75)                      | 300 ms    | 800 ms        |
| INP (p75)                       | 150 ms    | 200 ms        |
| CLS (p75)                       | 0.05      | 0.1           |
| Navigation: visual response     | 100 ms    | —             |
| Navigation: settled             | 500 ms    | —             |
| Click → visible response        | 100 ms    | —             |
| Initial JS per route (gzip)     | 200 KB    | —             |
| Document on the wire            | 40 KB     | —             |
| Database round trip (p50 / p95) | 5 / 15 ms | —             |

**The gate** compares against `performance/baseline.json`. It fails on bytes
(initial JS or CSS per tracked route up by more than 5 % and 8 KB) and on a
banned library entering a route's initial JS. It reports timing changes but does
not fail on them — a laptop's clock is not a contract. It runs in
`scripts/deploy-cloudflare.sh build` (warns; `PERF_GATE=strict` aborts), and
`.github/workflows/perf.yml` checks production weekly and on demand.

After an intentional change, promote the new numbers:

```bash
pnpm perf:report -- --run performance/reports/latest --save-baseline
```

## Rules

### JavaScript: a library pays its cost when it is used

A route's initial JS is everything its layouts and page import **statically**
from client components — used or not.

1. **Never import a barrel from client code when the barrel re-exports
   anything heavy or server-only.** A re-export is bundled whether or not the
   importer uses it. `@/components/file` re-exported the AWS SDK, Node's `crypto`
   polyfill, xlsx and `@react-pdf/renderer`; 44–49 routes shipped ~860 KB gzip
   of it to show a table. Import from the sub-module.
2. **Export, print, upload, scan, map, chart-editor, PDF: `await import()` at
   the click**, inside the handler — see `file/export/use-export.ts`. If the UI
   needs a component, `next/dynamic` with a skeleton.
3. **Server code stays on the server.** `node:crypto`, SDKs, `db`: a module
   that imports them must not be reachable from a `"use client"` file. Prefer
   `import "server-only"` at the top of such modules so the build says so.
4. **`import type` for Prisma enums and types in client code.** A value import
   from `@prisma/client` ships the whole browser client (~47 KB gzip).
5. `pnpm perf:build` names the libraries in each route's initial JS.
   `bannedInInitialJs` in `budgets.json` is the list that must stay empty.

### Documents: a prop to a client component is part of the HTML

Whatever a server component passes to a client component is serialized into
the page. The dictionary is the expensive case: the full Arabic dictionary is
~900 KB, and `/ar/login` shipped 838 KB of it to render two inputs.

1. **Pass the subtree the component reads**, not `dictionary`:
   `dictionary.school.students`, not the root.
2. **Pages that render a client form use a route-scoped loader**
   (`getAuthDictionary`, `getFinanceDictionary`, …) — never `getDictionary`.
3. Check with `pnpm perf:probe` (public pages) or the `flight` column.

### Navigation: respond first, then stream

1. Every sidebar route has a `loading.tsx` that draws the real page's skeleton.
   Prefetched, it is what makes a tap answer in under 100 ms. Keep it cheap.
2. Do not `await` slow data above a `<Suspense>` boundary; pass the promise
   down and let the shell stream.
3. `staleTimes` (`next.config.ts`): 30 s dynamic, 5 min static — a page revisited
   within 30 s is drawn from memory. Mutations must `revalidatePath` so a teacher
   never sees their own change missing.
4. The service worker must never delay a response to save it — `cache.put`
   resolves after the last byte. Clone, return, save in `event.waitUntil`.

### Database: round trips are the server time

The container runs in Frankfurt and the database in N. Virginia: **every query
costs ~90 ms** before Postgres does anything (`pnpm perf:probe`). Ten sequential
queries are a second of waiting. Until they are co-located:

1. **Independent queries go in one `Promise.all`.** Only chain what depends on
   the previous result.
2. **No query in a loop.** `findMany({ where: { id: { in } } })`, `include`, or
   one aggregate — never N `findUnique`.
3. **Layouts are paid by every page under them — and by every prefetch.** A
   query in the dashboard layout runs once per prefetched link, too.
4. `select` the columns the UI shows; paginate on the server; aggregate in SQL.
5. `schoolId` in every `where`, always — an index on `(schoolId, …)` is what
   makes the query fast, and its absence is a data leak, not a perf bug.
6. `PERF_TRACE=1 pnpm dev > trace.log` then `pnpm perf:queries -- --trace trace.log`
   counts a route's queries, its sequential steps and its duplicates.

### Caching: only what cannot leak

Multi-tenant and signed-in: a cache key that omits the school, the user, the
role or the locale is a data leak.

| Safe to cache                                                  | Never cached                                |
| -------------------------------------------------------------- | ------------------------------------------- |
| `/_next/static/*`, fonts, optimised images — edge, 1 year      | any HTML or RSC payload of a signed-in page |
| PWA icons — edge, 1 day                                        | `/api/*` (`no-store`), signed media tickets |
| subdomain → schoolId — in-process 1 min, Redis 5 min           | anything keyed by URL alone                 |
| a signed-in page, **on that person's device only**, in a cache |                                             |
| named by the server's `x-session-key` (service worker)         |                                             |

`'use cache'` on a tenant read is allowed only when `schoolId` (and the role,
if the result depends on it) is an **argument** of the cached function — the
arguments are the key — with a `cacheTag` the write path invalidates.

## Production measurement (RUM)

`src/components/monitoring/web-vitals.tsx` reports TTFB, FCP, LCP, INP and CLS
from real visits, plus `NAV` (link click → first paint of the new route) and
`SRV` (the server's `Server-Timing: total`, when present). One `sendBeacon` to
`/api/rum`, which **the Cloudflare Worker answers itself** and writes to Workers
Analytics Engine (`cf/worker.js`, binding `RUM`, dataset `hogwarts_rum`) — no
container CPU, no database write.

What is stored per metric: tenant, route **pattern** (`/students/[id]` — ids and
share tokens never leave the page), role, locale, device class, connection
type, navigation type, rating, country, Cloudflare location, whether the
service worker was in control. No user id, no URL, no query string.

```bash
CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… pnpm perf:rum -- --days 7 --device phone
```

The token needs _Account Analytics: Read_. Groups under 20 samples are left
out: a p75 of five page views is noise.

## Layout

```
performance/
  README.md            this guide
  baseline.json        the committed summary the gate compares against
  config/              lab.json · budgets.json · libraries.json
  scripts/             bundle-report · probe · query-audit · rum-report · report
  playwright/          run.mjs (flows) · collect.mjs (in-page + CDP collectors)
  lighthouse/          run.mjs · lighthouserc.cjs (LHCI, public pages)
  reports/             one directory per run; `latest/` is scratch (git-ignored)
```
