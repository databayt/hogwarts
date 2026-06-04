# Transportation — Gap / Blocker / Improvement Tracker

**Status:** 🟢 Production-ready — core flows work end-to-end, all 9 tables are live in production, and the polish/hardening backlog is closed.
**Real completion:** ~99% — the 2026-05-22 and 2026-05-29 remediation passes resolved the audited backlog. Two consciously-deferred items remain (P3-3 page-gate de-dup, P3-6 token prefix-scan), both no-risk.
**Last audited:** 2026-05-29.
**Tests:** **300/300 unit tests green across 14 files** (verified 2026-05-29) — full inventory in [`README.md`](./README.md#tests). Up from 79 after the 2026-05-29 coverage pass closed P3-1.
**Plans:** original feature `invoke-feature-workflow-to-toasty-crystal.md`; production sweep `read-transportation-feature-to-elegant-walrus.md`; coverage + cleanup pass `read-transportation-block-imperative-pancake.md`.

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

All P1/P2 items and P3-1/P3-2/P3-4/P3-5 are **resolved** (see Resolution Logs). The remaining backlog is
two no-risk deferrals — neither blocks production:

- **P3-3 — Page role gates duplicate the RBAC matrix.** [deferred]
  Each `page.tsx` hardcodes an `ALLOWED_ROLES` array that must track `authorization.ts` `PERMISSION_MATRIX`.
  Drift risks an over-permissive page or a dead route. **Mitigated:** server actions always re-check via
  `requireContext`, so a too-loose page cannot leak data. _Improvement:_ derive the page gate from the matrix
  (13-file churn — low value).

- **P3-6 — Token verify bcrypt-compares all same-prefix candidates.** [accepted]
  `verifyApiToken` loads every non-deleted token with the 8-char prefix and `bcrypt.compare`s each (~80ms each).
  Fine at current volume; a prefix collision across schools would multiply latency. Mitigated by the 120/min
  rate limit. _Improvement:_ unique prefixes, or an HMAC lookup key.

---

## Improvements & Optimizations (non-defect)

- **Aggregate in SQL, not JS — [accepted, no action].** `previewTransportFees` and `reports.getDriverHours`/
  `getTripStats` pull row sets and reduce in memory. Correct at school scale (~150 assignments); `getDriverHours`
  computes per-trip durations a single Prisma `groupBy` cannot express. Revisit only if a tenant scales to
  thousands of students.
- **`exhaustive-deps` suppressions — [accepted, no action].** The 5 `eslint-disable react-hooks/exhaustive-deps`
  sit on `useMemo` column definitions (the idiomatic tanstack-table pattern used block-wide), not data-load
  effects — removing them risks stale closures for no benefit.
- **Cache settings + school language per trip event.** `notifyGuardiansOfTripEvent` issues several sequential
  queries (school → assignments → guardians → settings) per start/finish/cancel. Fire-and-forget, so not
  latency-critical, but it's N queries per trip transition.
- **Single root `error.tsx`** already covers all nested segments (Next.js boundary propagation) — the plan's
  "error.tsx per directory" is unnecessary; keep the one root file.
- **DRY the fee-preview UI.** `/reports` and `/fees` render fee data independently — extract a shared
  `<FeePreviewSection>` if they diverge.

---

**Last review:** 2026-05-29
