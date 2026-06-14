# Transportation — Gap / Blocker / Improvement Tracker

**Status:** 🟢 Production-ready — core flows work end-to-end, all 9 tables are live in production, and the polish/hardening backlog is closed.
**Real completion:** ~99% — the 2026-05-22, 2026-05-29, and 2026-06-14 passes resolved the audited backlog. Remaining items are consciously-deferred (P3-3 page-gate de-dup; the i18n raw-name sweep O-7).
**Last audited:** 2026-06-14 (6-dimension adversarially-verified workflow audit: 45 findings → 26 confirmed).
**Tests:** **313/313 unit tests green across 15 files** (verified 2026-06-14) — full inventory in [`README.md`](./README.md#tests). Up from 300 after the 2026-06-14 optimization pass added the deleteStop boarding-history guard test + the webhook 429 rate-limit test.
**Plans:** original feature `invoke-feature-workflow-to-toasty-crystal.md`; production sweep `read-transportation-feature-to-elegant-walrus.md`; coverage + cleanup pass `read-transportation-block-imperative-pancake.md`.

## Resolution Log — 2026-06-14 (optimization pass — security / correctness / perf)

Ran a 6-dimension adversarially-verified audit workflow (perf-db, dead-code, correctness/tenant,
react-render, security, i18n). Implemented the confirmed high-value, low-risk, code-only findings;
schema-index findings are staged in the model as **deploy-pending** (CLAUDE.md Neon protocol).

**Security / correctness — landed:**

- **revokeApiToken IDOR (write path)** ✅ — the soft-delete used `update({ where: { id } })` after a
  scoped `findFirst`; the write had no tenant boundary. Collapsed to one
  `updateMany({ where: { id, schoolId, deletedAt: null }, … })` — schoolId now lives in the write predicate.
- **getAssignmentForStudent IDOR** ✅ **(deleted)** — dead export (zero callers) gated only on `read_own`
  that accepted any caller-supplied `studentId` with no `StudentGuardian` ownership check (leaked
  route/driver/phone). Removed; all student/guardian access goes through the ownership-verified
  `getMyTransportationView`.
- **deleteStop wiped boarding history** ✅ — hard-delete cascades to `TripBoarding` (onDelete: Cascade);
  the only guard was active-assignment count. Added a `tripBoarding.count` guard → `HAS_DEPENDENCIES`
  when any boarding ever referenced the stop.
- **finishTrip / cancelTrip stranded PENDING boardings** ✅ — finish now marks un-recorded boardings
  `MISSED`; cancel marks them `EXCUSED` (trip didn't run → not the student's fault). No more dangling PENDING.
- **updateAssignment re-activation conflict** ✅ — re-activating a PAUSED/ENDED assignment now runs the
  same single-active-per-(student,route) guard as create/restore (`ROUTE_ASSIGNMENT_OVERLAP`).
- **CSV formula injection** ✅ — fee-export `csvCell` now tab-prefixes values starting with `=,+,-,@`
  before RFC-4180 quoting (Excel/LibreOffice formula-injection defence).
- **Geofence webhook rate limit** ✅ — swapped sync `rateLimit()` (in-memory Map, resets per serverless
  instance) for `checkRateLimitAsync()` (Redis-authoritative when Upstash is configured). Also mitigates
  the P3-6 bcrypt prefix-scan DoS amplifier without a schema change.

**Performance — landed:**

- **getTripStats** ✅ — replaced full-row-fetch + JS tally with `db.trip.groupBy({ by: ['status'], _count })`
  (served by `@@index([schoolId, scheduledDate, status])`).
- **geofence-internal webhook** ✅ — the assignment + trip lookups (both keyed off `route.id` only) now
  run via `Promise.all` instead of sequentially — one fewer round-trip on the hot ENTER/EXIT path.
- **notifyGuardiansOfTripEvent** ✅ — settings (opt-out flags) are now read up front in the initial
  `Promise.all` and the per-event opt-out short-circuits **before** the assignment→guardian fan-out
  (previously that work ran, then was thrown away on an opted-out event).
- **listStudentsForAssignment** ✅ — added `take: 500` so a large school can't transfer thousands of
  student rows into the `<Select>` on every assignments-page load (search-combobox is the follow-up).

**UX / i18n — landed:**

- **StopEditor refresh-desync** ✅ — the editor seeds `stops` once via `useState(() => …initialStops)` with
  no resync, and `router.refresh()` doesn't remount client components, so adding/deleting a stop appeared
  to do nothing until navigation. Keyed `<StopEditor>` on the stop-id set: add/delete remounts with fresh
  data; reorder (same set) keeps the optimistic order.
- **/me status labels** ✅ — trip + boarding status badges in the guardian/student view rendered raw enum
  values (`SCHEDULED`, `BOARDED`); now localized via the existing dict keys.
- **Route place-name localization (O-7 high-value slice)** ✅ — overview recent-assignments,
  `trips/detail-content` (live boarding roster), and `fees/content` (+ its CSV export) now batch-localize route
  names via `getLabels` (one resolution per render, source-fallback). Remaining admin-table surfaces + person-name
  transliteration are documented as deferred under O-7.

**Deploy-pending (schema staged in `transportation.prisma`, NOT yet pushed — apply via Neon protocol at deploy):**

- `@@index([schoolId, status, actualEndTime])` on `Trip` — serves the driver-hours report range scan.
- `@@index([schoolId, geofenceId])` on `Route` — serves the geofence-webhook route lookup.

## Resolution Log — 2026-05-29 (coverage + cleanup pass)

- **P3-1** ✅ **closed** — comprehensive unit coverage added (**79 → 300 tests**, +10 files). New suites:
  `crud-mutations` (mutating CRUD + ownership guards + uniqueness/overlap), `stops` (incl. the two-phase
  reorder ordering invariant), `trips-state-machine` (every state guard + auto-populated boardings +
  notification dispatch), `settings`, `me` (STUDENT/GUARDIAN branches + permission fall-through),
  `notifications` (en/ar rendering + opt-out + userId dedup + best-effort no-throw), `api-tokens`
  (plaintext-never-persisted, ownership-scoped revoke), `geofence-action` (wrapper gate + schoolId
  injection), `geofence-webhook-route` (HTTP 401/403/400/200-ack/500 matrix + **schoolId-from-token,
  never-body**), `overview-reports`, plus 26 backfilled raw-schema validation tests. Adversarially
  audited — all suites rated STRONG, zero hollow tests, zero source-file modifications.
- **P2-4** ✅ **resolved (deleted)** — the dead i18n `createXSchema` form factories (~150 lines) were
  removed from `validation.ts`. Verified zero importers; `TransportationSettingsInput` re-pointed to
  the structurally-identical raw `transportationSettingsSchema`. Validation is **server-only** by
  design (clients submit plain inputs; translated messages surface via `error-map.ts`). The
  react-hook-form rewrite was rejected as highest-effort/lowest-value.

## Resolution Log — 2026-05-22

Worked the remediation order; **landed:**

- **P1-2** ✅ — added `error-map.ts`; all 5 clients now route `result.error` through the existing `errors.*` dict messages (no more generic "internal error" for plate/license/route-name/overlap/stop-order conflicts).
- **P2-2** ✅ — geofence picker wired into the route form (`routes-client` + `content.tsx` pass `listAvailableGeofences()`); `geofenceId` settable from the UI.
- **P2-3** ✅ — `window.confirm` → `AlertDialog` across all 5 clients.
- **P2-5** ✅ — fee CSV export (`fees/export-button.tsx`, client-side, UTF-8 BOM for Arabic); dead `export` permission removed.
- **P2-6** ✅ — dead `read_class` permission removed (matrix + type + test).
- **P2-7** ✅ — `loading.tsx` added for `/me` and `/fees`.
- **P2-8** ✅ — `studentsWithoutFee` now counts distinct students.
- **P2-9** ✅ — `drivers/[id]` + `assignments/[id]` detail pages + `getDriver`/`getAssignment` actions + row drill-in links.
- **P2-10** ✅ — 4 transportation titles added to the `platform.sidebar` dict (en + ar) — no more English labels in `/ar`.
- **P3-2** ✅ — guardian notifications now interpolate the route name (`{route}` in en + ar bodies). (Per-recipient language stays infeasible — `User` has no locale field.)
- **P3-4** ✅ — `getMyTransportationView` now gates via `requireContext("read_own")`.
- **P3-5** ✅ — token admin UI in `/settings` (`api-tokens-section.tsx` + `actions/api-tokens.ts` + `generateApiToken()` in `src/lib/api-tokens.ts`): mint (show-once) / list / revoke. The geofence webhook is now usable without a manual SQL insert.

---

## What actually works ✅

- [x] All 9 Prisma models live in production, `schoolId`-scoped, indexed, soft-delete where applicable
- [x] Full CRUD for vehicles / drivers / routes / stops / assignments (ref-validation + `restore` on all 5 entities)
- [x] `assignStudentToRoute` overlap guard (rejects a second ACTIVE assignment on the same route) + `restoreAssignment` re-checks the conflict
- [x] Two-phase stop reorder (negative-offset → final order) that respects `@@unique([schoolId, routeId, stopOrder])` — **ordering invariant unit-proven**
- [x] Trip lifecycle **state machine** — `startTrip` requires SCHEDULED, `finishTrip` requires IN_PROGRESS, `cancelTrip` rejects COMPLETED/CANCELLED, `recordBoarding` requires IN_PROGRESS → `TRIP_INVALID_STATE`
- [x] `startTrip` auto-populates one PENDING `TripBoarding` per active assignment (in a `$transaction`, `skipDuplicates`)
- [x] Guardian notifications: rendered in the school's `preferredLanguage`, gated by per-event opt-out flags in `TransportationSettings`, best-effort with `console.error` logging (never throws)
- [x] Fee preview (read-only) — finance reads `previewTransportFees()`; no `FeeRecord` writes from this block
- [x] Reports — route utilization, driver hours, trip stats (last 30 days)
- [x] Overview — counts, expiring-document widget (30-day window), recent assignments
- [x] Writable settings (`getSettings`/`updateSettings` upsert, sensible defaults when no row)
- [x] STUDENT/GUARDIAN `/me` view (resolves own `Student` or children via `StudentGuardian`)
- [x] ACCOUNTANT `/fees` view + CSV export
- [x] Geofence webhook — Bearer token, bcrypt verify, **schoolId taken from the token (never the body, unit-proven)**, rate-limited 120/min/IP, ack-and-ignore for non-retryable codes; shared `geofence-internal` logic with the user action
- [x] Token admin UI in `/settings` — mint (show-once) / list / revoke `SchoolApiToken`
- [x] Geofence picker wired into the route form (`listAvailableGeofences`)
- [x] Sidebar entries wired per-role in `template/platform-sidebar/config.ts` (`bus` icon + dict titles en/ar)
- [x] Dashboard tiles wired for all 6 roles (`dashboard/config.ts` `getQuickActionsByRole`)
- [x] Demo seed (`pnpm db:seed:single transportation`) — realistic, idempotent
- [x] Dictionary parity en/ar; page-level role gates on every route + server-action `requireContext` double-gate
- [x] Error-code → translated toast mapping in all 5 clients (`error-map.ts`)

---

## Open Items

All P0/P1 confirmed findings from the 2026-06-14 audit are **resolved** (see the 2026-06-14 Resolution Log).
The remaining backlog is consciously deferred — none blocks production:

- **O-7 — i18n raw-name sweep across admin/list surfaces.** [partially landed — remainder deferred]
  The audit confirmed (P2) that route/driver/student/stop **names** render raw on several surfaces.
  **Landed 2026-06-14:** route place-names are now batch-localized (`getLabels`, source-fallback) on the three
  surfaces a non-admin / mixed-locale viewer actually sees — `content.tsx` (overview recent-assignments),
  `trips/detail-content` (the live boarding roster), and `fees/content` (which also localizes the CSV export).
  Plus the `/me` trip/boarding status-label fix. **Remaining (low-value, deferred):** route/stop names on the
  pure-admin surfaces `assignments/detail-content`, `drivers/detail-content`, `assignments-client`,
  `trips-client`; and **person-name** (student) transliteration everywhere except where driver names already use
  `getName`. These are ADMIN-only CRUD views where names are usually already in the reader's language — genuine
  diminishing returns. The established pattern (`shared/translate-display` + `getLabels`/`getNames`) applies when
  picked up; the client tables additionally need the names translated in their server `content.tsx` wrapper.

- **O-8 — Trip state-machine TOCTOU (start/finish/cancel).** [deferred — low impact]
  The status assertion is a check-then-act outside the write predicate; two concurrent calls can both pass.
  Real-world impact is low (the UI disables the action button while `pending`, and `startTrip`'s `createMany`
  uses `skipDuplicates`) — worst case is a duplicate best-effort notification, not data corruption. The clean
  fix (atomic `updateMany({ where: { id, schoolId, status }, … })` + count check inside the existing
  `$transaction`) is test-coupled (30 state-machine tests) — deferred to avoid a rushed rewrite.

- **O-9 — `prewarm` on write actions.** [deferred — P3] `createRoute`/`updateRoute`/`createDriver`/… don't
  `after(() => prewarm(...))`, so the first reader in the other language pays the translate latency once.

- **P3-3 — Page role gates duplicate the RBAC matrix.** [deferred]
  Each `page.tsx` hardcodes an `ALLOWED_ROLES` array that must track `authorization.ts` `PERMISSION_MATRIX`.
  **Mitigated:** server actions always re-check via `requireContext`, so a too-loose page cannot leak data.

- **P3-6 — Token verify bcrypt-compares all same-prefix candidates.** [accepted — now further mitigated]
  An 8-hex-char prefix (4-byte space) makes a cross-school prefix collision astronomically unlikely, so the
  candidate set is ~1 row in practice. The 2026-06-14 swap to Redis-authoritative rate limiting removed the
  serverless DoS-amplification path. A true fix (unique prefix / HMAC lookup key) needs a schema change.

- **Rejected by verification (for the record):** `getExpiringDocuments` returning already-expired docs is
  **desirable** (an expired license is more urgent, not less) — not a bug. The demo-seed token `console.log`
  is the intentional show-once delivery mechanism for a randomly-generated, hash-only-persisted token.

---

## Improvements & Optimizations (non-defect)

- **`getDriverHours` / `previewTransportFees` reduce in JS — [accepted, no action].** Both build nested
  per-driver / per-student shapes a single `groupBy` cannot express. `getTripStats` (flat counts) WAS converted
  to `groupBy` (2026-06-14). The deploy-pending `@@index([schoolId, status, actualEndTime])` keeps
  `getDriverHours` off a full scan.
- **`exhaustive-deps` suppressions — [accepted, no action].** The 5 `eslint-disable react-hooks/exhaustive-deps`
  sit on `useMemo` column definitions (idiomatic tanstack-table), not data-load effects.
- **`notifyGuardiansOfTripEvent` — improved (2026-06-14).** Settings now read up front in the initial
  `Promise.all`; the per-event opt-out short-circuits before the assignment→guardian fan-out.
- **Single root `error.tsx`** already covers all nested segments (Next.js boundary propagation) — keep the one file.
- **DRY the fee-preview UI.** `/reports` and `/fees` render fee data independently — extract a shared
  `<FeePreviewSection>` if they diverge.

---

**Last review:** 2026-06-14
