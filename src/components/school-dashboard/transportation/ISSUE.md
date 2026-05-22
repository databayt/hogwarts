# Transportation — Gap / Blocker / Improvement Tracker

**Status:** 🟢 Functionally production-ready — core flows work end-to-end and all 9 tables are live in production.
**Real completion:** ~98% (most of the audited backlog was resolved 2026-05-22 — see Resolution Log below; only P2-4 and P3-3 are consciously deferred, and broader test coverage remains incremental).
**Last audited:** 2026-05-21 · **Remediation pass:** 2026-05-22.
**Tests:** 79/79 unit tests green (verified 2026-05-22) — added a `geofence-webhook.test.ts` covering API-token generate/verify + the geofence boarding bridge (previously 0%).
**Plans:** original feature `invoke-feature-workflow-to-toasty-crystal.md`; production sweep `read-transportation-feature-to-elegant-walrus.md`.

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
- **P3-1** 🟡 partial — webhook/token + geofence-bridge now covered (12 new tests); trips-lifecycle / settings / me / notifications still rely on the existing multi-tenant suite.

**Deferred (conscious):**

- **P2-4** — react-hook-form rewrite NOT done. The i18n `createXSchema` factories are dead code; a 5-form RHF rewrite is the highest-risk/lowest-value item (forms work with HTML-`required` + server Zod + the new specific error toasts). Either wire RHF or delete the factories in a focused follow-up.
- **P3-3** — page-gate de-dup skipped (internal refactor; 13-file churn; server actions already double-gate).
- **P3-6** — token prefix-collision bcrypt cost: acceptable under the 120/min rate limit; unchanged.

> Scope tags: **[safe]** = component/action/dict/doc edit, fixable under `.claude/rules/qa-scope.md`.
> **[flag]** = touches schema / auth / middleware / config / icon registry → confirm before shipping.
>
> This block was promoted to "production-ready" on 2026-05-09 (commit `cb1bd42e`). That is accurate
> for **core functionality**, but several plan items were never completed and a few new gaps surfaced
> on audit. None break a core flow — they are catalogued below by severity.

---

## What actually works ✅

- [x] All 9 Prisma models live in production, `schoolId`-scoped, indexed, soft-delete where applicable
- [x] Full CRUD for vehicles / drivers / routes / stops / assignments (ref-validation + `restore` on all 5 entities)
- [x] `assignStudentToRoute` overlap guard (rejects a second ACTIVE assignment on the same route) + `restoreAssignment` re-checks the conflict
- [x] Two-phase stop reorder (negative-offset → final order) that respects `@@unique([schoolId, routeId, stopOrder])`
- [x] Trip lifecycle **state machine** — `startTrip` requires SCHEDULED, `finishTrip` requires IN_PROGRESS, `cancelTrip` rejects COMPLETED/CANCELLED, `recordBoarding` requires IN_PROGRESS → `TRIP_INVALID_STATE`
- [x] `startTrip` auto-populates one PENDING `TripBoarding` per active assignment (in a `$transaction`, `skipDuplicates`)
- [x] Guardian notifications: rendered in the school's `preferredLanguage`, gated by per-event opt-out flags in `TransportationSettings`, best-effort with `console.error` logging (never throws)
- [x] Fee preview (read-only) — finance reads `previewTransportFees()`; no `FeeRecord` writes from this block
- [x] Reports — route utilization, driver hours, trip stats (last 30 days)
- [x] Overview — counts, expiring-document widget (30-day window), recent assignments
- [x] Writable settings (`getSettings`/`updateSettings` upsert, sensible defaults when no row)
- [x] STUDENT/GUARDIAN `/me` view (resolves own `Student` or children via `StudentGuardian`)
- [x] ACCOUNTANT `/fees` view
- [x] Geofence webhook — Bearer token, bcrypt verify, **schoolId taken from the token (never the body)**, rate-limited 120/min/IP, ack-and-ignore for non-retryable codes; shared `geofence-internal` logic with the user action
- [x] Sidebar entries wired per-role in `template/platform-sidebar/config.ts` (`bus` icon present) — overview for ADMIN/STAFF/DEVELOPER, `/fees` for ACCOUNTANT, `/me` for STUDENT/GUARDIAN, `/trips` for TEACHER
- [x] Dashboard tiles wired for all 6 roles (`dashboard/config.ts` `getQuickActionsByRole`)
- [x] Demo seed (`pnpm db:seed:single transportation`) — realistic, idempotent
- [x] Dictionary parity en/ar (22 namespaces each; no top-level drift)
- [x] Page-level role gates on every route (redirect unauthorized → `/dashboard`); server actions independently gate via `requireContext()`

---

## Open Issues

### P1 — High (user-visible inconsistency; not a broken core flow)

- **P1-1 — ~~Sidebar entry is `ADMIN`-only~~ → WITHDRAWN (re-audit 2026-05-21).**
  False alarm. I originally read `school-dashboard/config.ts` (ADMIN-only, `package` icon) — but that
  file is **dead/legacy and imported nowhere**. The live sidebar is `template/platform-sidebar/config.ts`
  (`platformNav`), which already wires correct **per-role** entries: `ADMIN/STAFF/DEVELOPER` → overview,
  `ACCOUNTANT` → `/fees`, `STUDENT/GUARDIAN` → `/me`, `TEACHER` → `/trips`, all with the `bus` icon. The
  only residual issue is the missing dictionary titles — see **P2-10**.

- **P1-2 — Specific server error codes are flattened to a generic "internal error" toast. [safe]**
  `vehicles/drivers/routes/assignments/stop-editor` clients all do `toast.error(t.errors.internalError)`
  on **any** failure. The server returns precise codes (`VEHICLE_PLATE_TAKEN`, `DRIVER_LICENSE_TAKEN`,
  `ROUTE_NAME_TAKEN`, `ROUTE_ASSIGNMENT_OVERLAP`, `STOP_*`…) **and the translated messages already
  exist in the dictionary** (`errors.plateAlreadyExists`, `errors.licenseAlreadyExists`,
  `errors.routeNameTaken`, `errors.assignmentOverlap`, …) — they are simply never read. Only
  `trips-client.tsx:180` maps a code (`TRIP_DUPLICATE → trips.errors.duplicate`).
  _Fix:_ add a small `ERROR_MAP` per client (or one shared helper) routing `result.error` → the
  existing `errors.*` keys, falling back to `internalError`. Low effort, dictionary already done.

### P2 — Medium (incomplete plan items / polish)

- **P2-1 — ~~`bus` icon never registered~~ → WITHDRAWN (re-audit 2026-05-21).**
  False alarm. I checked `src/components/icons/registry.ts` (the unified registry), which has no `bus`
  — but the sidebar uses its **own** icon map, `template/platform-sidebar/icons.tsx`, which already has
  `bus: Bus` (line 83) and is what the transportation nav entries reference. Nothing to do here.
  (If `bus` is later wanted in the unified `icons/registry.ts` for other surfaces, that's a separate
  platform task, not a transportation gap.)

- **P2-2 — Geofence picker not wired into the route form. [safe]**
  `Route.geofenceId` is in the schema and `routeSchema`/`createRouteSchema` accept it, but
  `routes/routes-client.tsx` has **no geofence field** (no `listGeoFences` call). So an admin cannot
  link a route to a geofence from the UI — `geofenceId` is only settable via seed/SQL or the webhook
  path. Plan 3.2 is half-done (data layer yes, UI no). NOTE: CLAUDE.md currently overstates this as
  "Available via UI form".
  _Fix:_ add a geofence `Select` (filtered to bus-route geofences) to the route form + a
  `listGeoFences()` action; persist in `createRoute`/`updateRoute` (which already accept the field).

- **P2-3 — `window.confirm()` used for deletes instead of `AlertDialog`. [safe]**
  5 sites: `vehicles/drivers/routes/assignments` clients + `stop-editor.tsx`. The confirm text is
  i18n'd (`t.*.deleteConfirm`), so it works — but it's a native browser dialog, not the design-system
  `AlertDialog`. Plan 3.9 not done.

- **P2-4 — Client forms use plain `useState`; the i18n Zod factories are unused. [safe]**
  No client imports `useForm`/`zodResolver`. The `createVehicleSchema`/`createDriverSchema`/… factories
  in `validation.ts` (built specifically for client-side inline validation with translated messages)
  are therefore **dead in production** — exercised only by `validation.test.ts`. Validation happens
  server-side only; users get no inline field errors. Plan 3.10 not done.
  _Fix:_ either wire the factories into `react-hook-form` forms, or delete them and document that
  validation is server-only.

- **P2-5 — Fee CSV export never built; `export` permission is dead. [safe]**
  Plan 4.3 wanted `exportTransportFeesCsv()`. Absent. The `export` action exists in the RBAC matrix
  (granted to DEVELOPER/ADMIN/STAFF) and is asserted in a test, but **no action calls it**.
  _Fix:_ build the CSV export (and wire the `export` permission) or remove the dead permission.

- **P2-6 — `read_class` permission is dead. [safe]**
  Granted to `[DEVELOPER, ADMIN, TEACHER]` in `PERMISSION_MATRIX` but has **zero callers**. The
  production sweep plan explicitly said "remove dead `read_class` if not used (or document why kept)";
  still neither. _Fix:_ remove it (and its `authorization.test.ts` rows) or document the intended use.

- **P2-7 — `loading.tsx` missing for `/me` and `/fees`. [safe]**
  Every other route has one; these two Phase-4 surfaces don't, so they have no skeleton on navigation.

- **P2-8 — `previewTransportFees.studentsWithoutFee` counts assignments, not students. [safe]**
  `fees.ts` increments `studentsWithoutFee` once per fee-less **assignment**, but the field name (and
  the `/fees` UI) implies a student count. A student with two fee-less assignments is counted twice.
  _Fix:_ count distinct students, or rename the field to `assignmentsWithoutFee`.

- **P2-9 — No `drivers/[id]` or `assignments/[id]` detail pages. [safe]**
  Plan 3.8 is half-done — vehicles/routes/trips have `[id]` detail pages; drivers and assignments
  don't, so their table rows have no drill-in (e.g., a driver's license, assigned routes, recent
  trips driven).

- **P2-10 — The 4 transportation sidebar titles are missing from the `platform.sidebar` dictionary. [safe]**
  `platform-sidebar/content.tsx` renders titles as `dictionary.platform.sidebar[item.title] || item.title`.
  `platform.sidebar` (in `en.json`/`ar.json`) has keys for all 31 other nav items but **none** for
  `"Transportation"`, `"Transport fees"`, `"My transportation"`, `"Trips"` — so they fall back to the
  English `item.title` in every locale (visibly English in `/ar`). The nav entries and `bus` icon are
  otherwise correct (this is what's left of the withdrawn P1-1/P2-1).
  _Fix:_ add the 4 keys to `platform.sidebar` in both `en.json` and `ar.json`. (The dashboard quick-action
  tile labels in `dashboard/config.ts` are likewise hardcoded English, but that's the dashboard-wide tile
  pattern, not transportation-specific.)

### P3 — Low (robustness, coverage, future work)

- **P3-1 — Business-logic test coverage is thin. [safe]**
  67 tests, but: 31 are the RBAC matrix, 20 are schema validation, 16 are list-scoping/permission
  rejections. There are **no direct tests** for: full trip lifecycle (start → boarding upsert →
  finish), `recordBoarding` upsert branches, `geofence-internal` route/assignment/trip resolution,
  `verifyApiToken` + the webhook route, `getSettings`/`updateSettings`, `getMyTransportationView`
  (STUDENT vs GUARDIAN resolution), `notifyGuardiansOfTripEvent` fan-out + opt-out gating, or
  `reorderStops` two-phase logic. No **mutation-isolation** cross-tenant tests (plan 2.5 wanted
  `addRouteStop`/`assignStudentToRoute`/`recordBoardingFromGeofence`). The planned dedicated test
  files (`settings`, `me`, `geofence-webhook`, `trip-state-machine`) were never created — the
  state-machine cases were folded into `multi-tenant.test.ts` instead.

- **P3-2 — Guardian notifications use one language for all + generic bodies. [safe]**
  `notifyGuardiansOfTripEvent` picks the dictionary by `school.preferredLanguage` for **all** guardians
  (not each guardian's own preference), and the bodies are static strings — no route name, child name,
  or time interpolated (only the cancel `reason`). A guardian with children on two routes can't tell
  which trip a "Trip started" alert refers to. _Improvement:_ per-recipient language + templated bodies.

- **P3-3 — Page role gates duplicate the RBAC matrix. [safe]**
  Each `page.tsx` hardcodes an `ALLOWED_ROLES` array that must be kept in sync with
  `authorization.ts` `PERMISSION_MATRIX`. Drift risks an over-permissive page or a dead route.
  (Mitigated: server actions always re-check via `requireContext`, so a too-loose page can't actually
  leak data.) _Improvement:_ derive the page gate from the matrix.

- **P3-4 — `getMyTransportationView` bypasses the central matrix. [safe]**
  It inlines `auth()` + role branching instead of `requireContext("read_own")`. Works, but the
  `read_own` matrix entry no longer governs the `/me` path — a future matrix change won't reach it.

- **P3-5 — No admin UI to mint/revoke `SchoolApiToken`. [flag — new surface]**
  Documented as out-of-scope; tokens are inserted via seed/SQL only. The geofence webhook is therefore
  **unusable in production** without a manual DB insert. Follow-up: a token-management screen
  (`SchoolApiToken` is intentionally generic and reusable by other blocks).

- **P3-6 — Token verify bcrypt-compares all same-prefix candidates. [safe]**
  `verifyApiToken` loads every non-deleted token with the 8-char prefix and `bcrypt.compare`s each
  (~80ms each). Fine at current volume; a prefix collision across schools would multiply latency.
  Mitigated by the 120/min rate limit. _Improvement:_ unique prefixes, or HMAC lookup key.

---

## Improvements & Optimizations (non-defect)

- **Aggregate in SQL, not JS.** `previewTransportFees` and `reports.getDriverHours` pull full row
  sets and reduce in memory. Correct at school scale (~150 assignments) but would benefit from
  Prisma `groupBy`/`_count` if a tenant scales to thousands of students.
- **Cache settings + school language per trip event.** `notifyGuardiansOfTripEvent` issues several
  sequential queries (school → assignments → guardians → settings) on every start/finish/cancel.
  Read settings + `preferredLanguage` in one query, or memoize for the action's lifetime. (Fire-and-
  forget, so not latency-critical, but it's N queries per trip transition.)
- **Single root `error.tsx`** already covers all nested segments (Next.js boundary propagation), so
  the plan's "error.tsx per directory" is unnecessary — keep the one root file.
- **DRY the fee-preview UI.** Plan 4.3 intended a shared `<FeePreviewSection>` reused by `/reports`
  and `/fees`; the two pages render fee data independently. Extract if they diverge.
- **Surface the demo API token.** Its plaintext only prints to the seed console once. A short note in
  the `/settings` page (or token admin UI, P3-5) would make the webhook testable without re-seeding.

---

## Suggested Remediation Order

1. **P1-2** (error-code → toast mapping) — highest value/effort ratio; the dictionary is already done. **[safe]**
2. **P2-2** (geofence picker) — closes the only half-built data path; also correct the CLAUDE.md claim. **[safe]**
3. **P2-3 + P2-4** (AlertDialog + react-hook-form) — form-quality pass across the 5 clients; resolves the dead factories. **[safe]**
4. **P3-1** (test hardening) — add lifecycle / webhook / settings / `/me` / notification + mutation-isolation tests. **[safe]**
5. **P2-5/P2-6** (CSV export or remove dead `export`; remove dead `read_class`) — decide product intent, then wire or delete. **[safe]**
6. **P2-7/P2-8/P2-9/P2-10** + **P3-2/P3-3/P3-4** (loading states, fee-count semantics, detail pages, sidebar dict titles, notification polish, gate de-dup). **[safe]**
7. **P3-5** (API-token admin UI) — required before the geofence webhook is usable in production. **[flag]**

---

**Last review:** 2026-05-21
