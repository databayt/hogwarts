# Top 10 performance bottlenecks — baseline 2026-09-19

Ranked by measured user impact. Build `f01c3e8e1` (Worker `97957300`), live on
`demo.balqalam.com`. Raw data and tables: [`REPORT.md`](REPORT.md),
`summary.json`, `bundle.json`, `probe.json`, `browser-*.json`.

**How to read the numbers.** Measured from Rwanda through Cloudflare's
Johannesburg location (`JNB`) — not from Khartoum or Riyadh, where the users
are; their edge and last mile differ. Timings are medians of 3 lab runs and
are relative to that vantage point. **Bytes, request counts, query counts and
the location of the servers are exact from anywhere.** "Phone" means the
`mobile` profile: Pixel 5, 4× CPU slowdown, +150 ms RTT, 1.6 Mbps down.
Anything marked _predicted_ has not been measured yet.

## Where Hogwarts stands

| What a user feels                          | Measured                         | Target | Verdict |
| ------------------------------------------ | -------------------------------- | ------ | ------- |
| Tap a sidebar link → something changes     | 49 ms desktop · 90 ms phone      | 100 ms | PASS    |
| Click a control → next paint               | 24 ms desktop · 96 ms phone      | 100 ms | PASS    |
| Layout shift (CLS)                         | 0.00–0.07 (one route 0.108)      | 0.05   | ok      |
| Tap a link → the real content is there     | 1.6 s desktop · 3.1 s phone      | 500 ms | FAIL    |
| Open a page cold on a phone (LCP)          | 8.5 s (7.3–9.4 s)                | 1.5 s  | FAIL    |
| …first paint of that page                  | 6.8 s                            | 1.0 s  | FAIL    |
| Open a page again, warm, on a phone (LCP)  | 1.7 s                            | 1.5 s  | ok      |
| Sign in → dashboard painted                | 2.7 s desktop · 7.4 s phone      | —      | —       |
| Document wait (request → first byte)       | 330–390 ms cold · 0.6–4.0 s warm | 300 ms | FAIL    |
| Database round trip (p50 / p95 / p99)      | 91 / 308 / 844 ms                | 5 / 15 | FAIL    |
| Initial JS, core listing routes            | 1.45–1.62 MB gzip                | 200 KB | FAIL    |
| Document on the wire, every signed-in page | 276–295 KB                       | 40 KB  | FAIL    |

What is already good, and must be kept: taps answer at once. The prefetched
`loading.tsx` skeletons from the 2026-09-13 pass work — of 63 measured
navigations, 62 showed a visual response within 400 ms (one took 1063 ms). INP is not this app's
problem. The problems are **how long the real content takes to follow the
skeleton**, and **how many bytes a cold phone must download before it can
show anything**.

---

## 1. The database is an ocean away from the app

**Impact** — every query, on every page, for every user. It is the largest
share of "tap → content": 1.6 s median on desktop, 3.1 s on a phone; 2 of 63
navigations settled inside the 500 ms target (0 of 24 routes by median).

**Evidence**

- The container runs in **Frankfurt** (`wrangler containers instances` → `fra17`).
  Neon is in **N. Virginia** (`aws-us-east-1`, Neon API).
- A warm `SELECT 1` over the container's persistent Prisma pool:
  **min 90 · p50 91 · p95 308 · p99 844 ms** (n=25). 90 ms is the
  Frankfurt ↔ Virginia round trip; it is not connection setup
  (`DB_ADAPTER=pg` never reaches the container, so the pool is reused).
- Server time per navigation (RSC wait, payloads of a few KB so download is
  not the cause): 350–3441 ms. `/messages` paints at 2.7 s whether or not the
  service worker buffers it (see #2).
- `pnpm perf:queries` on a production build (local database, so only the
  STRUCTURE shows) — queries in the document's own render, and how many wait
  on each other:

  | Route (role)                                                  | Queries | Sequential steps | Duplicates | × 91 ms     |
  | ------------------------------------------------------------- | ------- | ---------------- | ---------- | ----------- |
  | `/dashboard` (teacher)                                        | **44**  | **10**           | **12**     | **~910 ms** |
  | `/finance` (admin)                                            | 21      | 6                | 0          | ~546 ms     |
  | `/dashboard` (admin)                                          | 9       | 4                | 2          | ~364 ms     |
  | `/library` (admin)                                            | 5       | 4                | 0          | ~364 ms     |
  | `/messages`, `/notifications`, `/exams`                       | 5–11    | 3                | 0          | ~273 ms     |
  | students, teachers, grades, attendance, timetable, classrooms | 1–7     | 1                | 0          | ~91 ms      |

  The teacher dashboard — the page a teacher opens every morning — resolves the
  same facts again in every widget: `School.findUnique` ×7, `Term.findFirst` ×6,
  `Teacher.findFirst` ×4, `Timetable.findMany` ×4 in ONE render. It is also the
  slowest page measured (3.2–3.9 s to first byte, warm).

- Several pages fetch their data AFTER mounting, through server actions and
  API routes, where the same waterfall hides from first byte and shows up as
  "settled". Queries outside any render, per page view:

  | Page                   | Queries | Sequential steps | × 91 ms    | Same fact re-read                           |
  | ---------------------- | ------- | ---------------- | ---------- | ------------------------------------------- |
  | `/timetable` (teacher) | **27**  | **18**           | **~1.6 s** | `Term.findFirst` ×6, `Period.findMany` ×3   |
  | `/timetable` (admin)   | 22      | 17               | ~1.5 s     | `Term.findFirst` ×4                         |
  | sign-in action         | 16      | 12               | ~1.1 s     | `School.findUnique` ×2, `User.findFirst` ×2 |
  | `/attendance`          | 12–15   | 8                | ~0.7 s     | `Teacher.findFirst` ×2                      |
  | every page (the bell)  | 3       | 3                | ~0.27 s    | —                                           |

  `/timetable` is the slowest navigation measured (students → timetable settled
  at 5.5–7.5 s), and the sign-in row is the 0.9–1.2 s "action + redirect"
  measured in the browser.

- With 15 queries in a render, the chance that at least one lands in the
  308 ms+ tail is 1 − 0.95¹⁵ = **54 %**.

**Root cause** — the database region predates the Cloudflare move (US East is
also Vercel's default function region; `vercel.json` pins none). The Cloudflare
move (2026-09-07) put the app wherever the first request after a deploy came
from: Cloudflare starts a container at "the nearest location with a
pre-fetched image" and keeps it there. Frankfurt is an accident — a good one
for users in East Africa and the Gulf, a bad one for a database in Virginia —
and **the next deploy can land it somewhere else**.

**Fix** — co-locate them. Two ways:

|                  | A. Move Neon to Frankfurt (recommended)                                                                                                                                    | B. Pin the container next to Neon                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Change           | new Neon project in `aws-eu-central-1`, dump/restore `neondb` + `evolution`, swap `DATABASE_URL`/`DIRECT_URL`; pin the container: `"constraints": { "regions": ["WEUR"] }` | one line in `wrangler.jsonc`: `"constraints": { "regions": ["ENAM"] }` |
| Query round trip | ~2–5 ms _(predicted)_                                                                                                                                                      | ~2–5 ms _(predicted)_                                                  |
| User ↔ app       | unchanged (~Frankfurt)                                                                                                                                                     | +~90 ms on every request, static files excepted (edge-cached)          |
| Risk             | a production database migration: maintenance window, restore point first                                                                                                   | low, reversible by deleting the line                                   |

B is a net win whenever a render makes two or more sequential queries — all of
them do — and needs no data to move. A is where this should end up: the
users are closer to Frankfurt than to Virginia. Either way, pin the region:
today placement is luck.

**Expected gain** _(predicted)_ — ~85 ms per sequential query step: the
teacher dashboard −850 ms, finance −510 ms, and every mount-time server action
and notification-bell poll (3 sequential queries: ~270 ms → ~15 ms).

**Worth doing regardless of where the database lives** — wrap the dashboard's
shared lookups (school, current term, the teacher row) in React `cache()` so
each is read once per render: 44 queries → ~27, and fewer steps. `cache()` is
scoped to one request, so nothing is shared between users or schools.

**Do not** adopt Hyperdrive for this. It is a Workers binding; the app runs
in a container that already holds a warm pool, so there is no connection
setup for it to remove, and queries would have to be re-routed through the
Worker to use it. Co-location removes the latency itself.

---

## 2. The service worker buffered every page — FIXED `9641e058b`

**Impact** — every returning user (the worker controls every visit after the
first), every full page load **and** every client-side navigation.

**Evidence** — all 28 of 28 role × route pairs reach first byte later warm
than cold: cold 330–390 ms, warm 600–4020 ms. `/messages` warm: 4.0 s — the
worker's own 4-second "slow network" timer fired and showed a **stale copy**
of a page the server had already answered.

**Root cause** — `pageFirst` did `await cache.put(key, response.clone())`
before returning the response. `cache.put` resolves after the last byte, so
the browser got byte one only when the whole 1.3 MB document had been
downloaded and written to disk. Streaming was switched off for everyone.

**Fix** — clone, return, save inside `event.waitUntil`. Worker v8.

**Measured gain** — production, admin, warm, median of 3, the fixed worker
served in place of the live one (`--sw-override`), back to back:

| Route        | Document wait, v7 → v8 | First paint, v7 → v8 |
| ------------ | ---------------------- | -------------------- |
| `/dashboard` | 972 → **348 ms**       | 1316 → 964 ms        |
| `/students`  | 1208 → **333 ms**      | 1540 → 980 ms        |
| `/finance`   | 1745 → **342 ms**      | 2092 → 1908 ms       |
| `/messages`  | 2395 → **344 ms**      | 2736 → 2808 ms       |

Warm now equals cold: ~340 ms is the origin floor (#5). First paint improves
where the page flushes a shell early and not on `/messages`, which does not —
what is left there is #1. **Risk** — low; the copy is still saved. Ships with
the next deploy.

---

## 3. Core routes ship 1.5 MB of JavaScript to draw a table — FIXED `b7982a824` `7e6fa4585`

**Impact** — every cold visit to students, attendance, grades, classrooms,
exams, finance, teachers, announcements. On the phone profile each 200 KB is a
second: these pages reach first paint at **6.2–8.2 s** and LCP at
**7.3–9.4 s**.

**Evidence** — `pnpm perf:build`, confirmed by the browser (static 1459 KB vs
1493 KB measured for `/attendance`). In initial JS, before hydration:

| Library                    | gzip   | Routes | Serves                     |
| -------------------------- | ------ | ------ | -------------------------- |
| `@react-pdf/renderer`      | 462 KB | 49     | the Export → PDF menu item |
| Node `crypto` polyfill     | 137 KB | 44     | nothing — server code      |
| `xlsx`                     | 135 KB | 47     | Export → Excel             |
| libphonenumber + countries | 77 KB  | 57     | phone inputs in forms      |
| `@aws-sdk/client-s3`       | 45 KB  | 44     | nothing — server code      |
| Prisma browser client      | 47 KB  | 10     | a value import (an enum?)  |

**Root cause** — `@/components/file` is one barrel for upload, export, import,
generate, print, storage providers, CDN signing and deduplication. Client
components import it for `ExportButton`; a re-export is bundled whether it is
used or not, so the AWS SDK and `node:crypto` came along.

**Fix** — `useExport` and the spreadsheet parser `await import()` their
library at the click; the barrel no longer re-exports server-only or heavy
modules. **Measured gain** — **−870 KB gzip on each of the eight routes (−54 % to
−60 %)**, e.g. `/attendance` 1459 → 588 KB; table in "After". **Risk** — low:
tsc clean, nothing imported the removed names through the barrel except one
call (re-pointed), and Export was clicked in a browser on the built app — both
formats still produce files, their library fetched at the click.

Still open: libphonenumber + country data on 57 routes (77 KB), the Prisma
browser client on 10, and the 124 KB icon module on 456.

---

## 4. Every document carries the whole dictionary

**Impact** — every full page load: 276–295 KB on the wire, **1.2–1.4 MB to
parse**, ~1.26 MB of it RSC flight data. On a phone the dashboard blocks the
main thread for **620–910 ms** even warm, with every file already cached.
`/ar/login` — the first screen anyone sees, always cold — was 1.13 MB of HTML,
99 % dictionary, to render two inputs.

**Root cause** — a prop passed to a client component is serialized into the
page. The auth pages passed the full dictionary to the form; the dashboard
layout passes it to `DictionaryProvider`. The Arabic dictionary is ~900 KB.

**Fix, part 1 — DONE `03dbd5d98`** — the six auth pages use
`getAuthDictionary` (the four namespaces the forms read). **Measured:** login
document 1128.7 → **79.1 KB**, 268 → **19.4 KB** on the wire (−93 %); sign-in
through it verified in a browser.

**Fix, part 2 — open, the larger prize** — the dashboard layout. 347
components read `useDictionary()` and 299 server files pass `dictionary` down
whole, so it cannot be trimmed by hand. Proposed: make the dictionary a
per-locale **static client module** the provider imports, so it becomes an
immutable, edge-cached, service-worker-cached JS chunk downloaded once per
deploy instead of 285 KB in every response; then pass subtrees, not the root,
to client components. _Predicted:_ document 285 KB → ~50 KB on the wire.
**Risk** — medium: it changes the hydration path of every dashboard page.
Do it behind a measurement, one layout first.

---

## 5. Nothing dynamic can arrive in under ~330 ms

**Evidence** — one keep-alive socket, so no handshakes: a cached static file
answers in **112 ms**; the cheapest thing the container can say (a 404, no
database) takes **333 ms**. Frankfurt adds ~220 ms to anything not served from
the edge, from this vantage point.

**Consequence** — the 300 ms TTFB target is unreachable for server-rendered
HTML by tuning the app. It is reachable only if the first bytes do not come
from the container: a shell served from the edge, with the personal parts
streamed in behind it.

**Fix** — evaluate Next's Cache Components / Partial Prerendering for the
dashboard shell (header, sidebar frame, skeleton) — the parts that are the same
for everyone in a school and a role. **Risk** — high if rushed: the shell must
contain nothing tenant- or user-specific, and `force-dynamic` on the dashboard
layout currently rules it out. Not started; it comes after #1, which is worth
more and risks less.

---

## 6. One page view is 12–60 extra requests to a single half-vCPU container

**Evidence** — RSC prefetches per page load: dashboard 43, attendance 18–60,
timetable 46–57. Total requests per cold page: 83–147. The container is
`standard-1` (½ vCPU) and also runs the WhatsApp bridge. Two server actions
fire on dashboard mount and wait **514–833 ms** for ~700 bytes each — queued
behind the prefetches, and paying #1.

**What a prefetch costs the database** — nothing: in the query audit a page
view caused exactly ONE querying render (the document) on 15 of 18 routes, and
2–5 on the other three. Prefetch renders stop at the loading boundary and
never reach Prisma. The cost is container CPU and connection slots,
not Neon. **Caution** — these prefetches are why a tap answers in 49 ms. Do not
turn them off. **Fix** — keep the viewport prefetch for the sidebar and move long in-page lists (student rows →
`/profile/[id]`, 20+ per page) to prefetch-on-intent, as the mail links already
do. The mount-time actions should be part of the streamed render, not a second
round trip after hydration.

---

## 7. The container compresses HTML, so the edge cannot

**Evidence** — documents leave as `gzip`; static files as `br`. A
cache-busted static file on the Worker's _miss_ path — raw bytes from the
container — still reached the browser as `br`: Cloudflare compresses container
output itself. On the production login HTML, brotli at the qualities an edge
uses on the fly (4–5) is **12–19 % smaller** than the container's gzip-6
(270 → 219–238 KB), and the ½ vCPU stops spending itself compressing 1.3 MB
per page view.

**Fix** — `compress: false` when `CF_CONTAINER=1` (`.claude/rules/cloudflare-deploy.md`
rule 7 already names this switch). **Not changed blind** — unknown: whether the
edge compresses a streamed response without buffering it, which would undo #2.
Verify on the first deploy: `curl -sN -H 'accept-encoding: br'` shows
`content-encoding: br` and the first bytes still arrive at ~340 ms.

---

## 8. PostHog on every page, doing nothing — FIXED `f8d415c0d`

74 KB gzip (226 KB to parse) in the initial JS of 490 of 493 routes, login
included. The deployed chunks contain no project key and the init call is
guarded by one, so it was downloaded, parsed and never ran. Now imported on
idle, only when a key exists.

## 9. Fonts and CSS on the critical path

Cold load: 6 font files, **361 KB** — three weights of Thmanyah Serif Text at
~79 KB each are the largest. The root stylesheet is 517 KB raw (89 KB gzip over
4 files) and render-blocking on every page, login included. Both are part of
why first paint on a phone is at 6.8 s. **Next** — check which weights the
dashboard actually renders; find what is in the 517 KB sheet (`leaflet.css` is
imported by the root layout for every page).

## 10. Sign-in: 7.4 s on a phone

Submit → dashboard painted: 2.7 s desktop, **7.4 s phone**. 0.9–1.2 s is the
sign-in action and redirect — 16 queries in 12 sequential steps (#1); the rest
is a cold dashboard (#3, #4). It needs no fix of its own.

---

## After — what the committed fixes measure

Verified on a production build of `1789801682856` (HEAD `eeacfed66`, built like
the deploy: `CF_CONTAINER=1`, standalone) served locally. **None of this is
deployed.** Bytes are exact; nothing here is a timing claim about production.

### Initial JavaScript per route — static inventory, gzip on both sides

| Route             | Deployed | After  | Change |
| ----------------- | -------- | ------ | ------ |
| `/announcements`  | 1624 KB  | 753 KB | -54%   |
| `/finance`        | 1570 KB  | 699 KB | -55%   |
| `/students`       | 1555 KB  | 685 KB | -56%   |
| `/teachers`       | 1546 KB  | 675 KB | -56%   |
| `/grades`         | 1462 KB  | 592 KB | -60%   |
| `/classrooms`     | 1459 KB  | 589 KB | -60%   |
| `/attendance`     | 1459 KB  | 588 KB | -60%   |
| `/exams`          | 1445 KB  | 574 KB | -60%   |
| `/dashboard`      | 750 KB   | 681 KB | -9%    |
| `/timetable`      | 584 KB   | 515 KB | -12%   |
| `/library`        | 553 KB   | 484 KB | -13%   |
| `/my-assignments` | 549 KB   | 480 KB | -13%   |
| `/notifications`  | 549 KB   | 480 KB | -13%   |
| `/parent`         | 547 KB   | 478 KB | -13%   |
| `/`               | 539 KB   | 471 KB | -13%   |
| `/messages`       | 435 KB   | 366 KB | -16%   |
| `/login`          | 379 KB   | 310 KB | -18%   |

Across all 493 routes: mean initial JS 647 → 502 KB gzip
(-22%); routes over 1 MB **51 → 1**; over 600 KB
137 → 81. In initial JS: `@react-pdf/renderer` 49 → 2 routes (the two
exam-paper PDF pages, whose purpose it is), `xlsx` 47 → 0, PostHog 490 → 0.

### JavaScript a cold page view downloads — measured in a browser

| Page                  | Production (brotli) | After (local, gzip) | Change |
| --------------------- | ------------------- | ------------------- | ------ |
| admin `/dashboard`    | 807 KB              | 871 KB              | +8%    |
| admin `/attendance`   | 1493 KB             | 649 KB              | -57%   |
| admin `/students`     | 1582 KB             | 750 KB              | -53%   |
| admin `/grades`       | 1485 KB             | 667 KB              | -55%   |
| teacher `/dashboard`  | 1732 KB             | 737 KB              | -57%   |
| teacher `/attendance` | 1495 KB             | 809 KB              | -46%   |
| teacher `/students`   | 1602 KB             | 793 KB              | -51%   |
| teacher `/grades`     | 1486 KB             | 847 KB              | -43%   |

The "after" column is **conservative, for two reasons**, and the static table
above is the clean like-for-like comparison. (1) On localhost 2–4× more
prefetches finish inside the measurement window (`/attendance`: 18 on
production, 79 locally), so the browser fetched far more script files (58 → 105) — the local run downloads JavaScript for routes the production run never
got to. (2) The local server gzips static files; production's edge serves
brotli, 10–15 % smaller. Admin `/dashboard`'s +8 % is those two effects on a
page whose own initial set fell 9 %. Even so, every other page halves. This run also
caught what the static inventory could not: teacher `/students` still pulled
1377 KB, because its prefetched `/profile/[id]` rows dragged in a 587 KB chunk of
base64 payment logos (`7e6fa4585`).

### The sign-in page

| `/ar/login`           | Deployed         | After       |
| --------------------- | ---------------- | ----------- |
| Document              | 1128.7 KB        | **79.1 KB** |
| RSC flight data in it | 1116.7 KB (99 %) | 67.1 KB     |
| On the wire (gzip)    | 268.0 KB         | **19.4 KB** |

Inside the 40 KB budget. Signing in through it works, in Arabic, including
the translated error message.

### Proven in a browser, not assumed

- **Export still exports.** `/attendance/reports`: before any click neither
  library is loaded; Export → Excel fetches the xlsx chunk at the click and
  downloads a 593 KB `.xlsx` (`PK`); Export → PDF fetches react-pdf at the click
  and downloads a 355 KB `%PDF`. `/students`: a 148 KB CSV, no library at all —
  that page had been shipping 600 KB of PDF and Excel code for a CSV button.
- **The service worker fix**, against production itself — table in #2.

### A second instrument agrees

`pnpm perf:lighthouse` (one run each, production, Lighthouse's simulated
phone — corroboration, not a baseline): teacher `/attendance` ships 2306 KB of
which Lighthouse's coverage counts **1668 KB of JavaScript as unused** during
load, LCP 12.5 s; `/login` weighs 1080 KB (this lab's harness: 1048–1056 KB).
The marketing home page is 4.1 MB with LCP 5.6 s — not examined here.

### Not verified yet — needs the deploy

LCP, first paint and "settled" on production after these changes; the RUM
pipeline end to end (the `RUM` Analytics Engine binding is new); the v8 worker
replacing v7 on real devices. After "deploy":

```bash
pnpm perf:playwright -- --target prod --profile mobile --roles admin,teacher \
  --routes /dashboard,/attendance,/students,/grades --out performance/reports/after-deploy
pnpm perf:report -- --run performance/reports/after-deploy
```

---

## Also found

- **Neon storage** — the project reports `synthetic_storage_size` 497.5 MB; the
  free plan's branch logical-size limit is 512 MB. They are different measures,
  so this may be fine — not a speed issue, but worth one look.
- **Database tail** — p99 844 ms on `SELECT 1` points at the 0.25 CU
  free-tier compute as well as distance. Re-measure after #1.
- **Realtime** — production has no socket server (`NEXT_PUBLIC_SOCKET_URL` is
  unset), so there is nothing to load-test; `socket.io-client` (14 KB) still
  ships on 422 routes.
- **Excel export on `/attendance/reports` was broken in production** — it asked
  the action for 10000 rows, the action's schema allows 5000, the ZodError was
  swallowed into the console and the teacher got no file. Found by clicking
  Export in a browser to verify the lazy import; fixed in `eeacfed66`.
- The existing Playwright auth setup fills `input[name="email"]`; the form's
  field is `identifier`. That is one reason that workflow fails.
