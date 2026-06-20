---
epic: 04
sprint: Q3-2026
title: Attendance
file_type: issue
owner: Abdout
maturity: Production-Ready
completion: 96
tracker: https://github.com/databayt/hogwarts/issues/322
docs: https://ed.databayt.org/en/docs/attendance
last_audited: 2026-06-19
---

# Attendance -- Production Readiness Tracker

**Master tracker:** [databayt/hogwarts#1](https://github.com/databayt/hogwarts/issues/1) -- consolidates attendance + compliance ship work (formerly #354 + #322; child stories #283 + #287 stay open)
**Status:** PRODUCTION-READY (deploy gates pending — see below)
**Completion:** ~96%
**Last Updated:** 2026-06-13

---

## MVP Checklist

### Core Features

- [x] Daily attendance marking (present/absent/late/excused/sick/holiday)
- [x] Class roster view with attendance status
- [x] Bulk marking for entire class
- [x] Upsert logic (update existing records)
- [x] Attendance history with date filtering
- [x] CSV export with date range filters
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Class selection dropdown
- [x] Server actions with Zod validation (48+ actions)
- [x] Period-by-period tracking for secondary schools
- [x] Route pages wired — 23 subroutes under `src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/`, all page-level auth-gated (the former "no route pages" blocker is obsolete)
- [x] Sidebar entry (`template/platform-sidebar/config.ts`) + in-page PageNav tabs (`permissions.ts:getTabsForRole`)

### Advanced Features

- [x] QR Code attendance with session management
- [x] Barcode/RFID student identifier system
- [x] Geofence attendance with Haversine formula
- [x] Multi-zone management (create/edit/delete geofences)
- [x] Auto-attendance trigger (6-10 AM school entry)
- [x] Check-in/check-out time tracking
- [x] Location data storage for geofence events

### Excuse and Intervention System

- [x] Excuse submission by parents/guardians
- [x] Excuse review workflow (approve/reject)
- [x] 7 excuse reason categories
- [x] Attachment support for documentation
- [x] Intervention tracking (14 intervention types)
- [x] Intervention status flow (SCHEDULED to COMPLETED/ESCALATED)
- [x] Priority levels (1=Low to 4=Critical)
- [x] Early warning system for at-risk students
- [x] Follow-up scheduling and tracking

### Analytics

- [x] Attendance statistics calculation
- [x] Attendance trends over time
- [x] Method usage statistics
- [x] Day-wise absence patterns
- [x] Class comparison statistics
- [x] At-risk student identification
- [x] Today's dashboard summary

### Tests

- [x] Core actions tests
- [x] Validation schema tests
- [x] Intervention workflow tests
- [x] Multi-tenant isolation tests
- [x] Geofence service tests
- [x] Geofence validation tests
- [x] QR code actions tests
- [x] Gamification actions tests
- [x] Intentions actions tests
- [x] Bulk upload tests
- [x] Helpers / identifiers / master / periods / policy / records / analytics / compliance / dashboard / excuses / qr action tests (2026-05-28 — full block sweep)
- [x] Hall-pass / letters / interventions-tiers / ai / geofencee actions tests
- [x] Permissions (UI gating), attendance-stats, atom (stat-card, action-card) tests
- [x] Compliance sub-block tests (actions, queries, authorization, validation, error-map)
- [x] `src/lib/compliance` tests (encryption AES-256-GCM round-trip + key rotation, mapper categorization, csv-schema, audit-actions, registry)
- [x] API route tests: `/api/cron/{esis-submit,absence-followup,attendance-policies}`, `/api/webhooks/adek` (HMAC verify), `/api/compliance/worker/claim` (token-gated RPA, tenant scope)
- [x] Mobile API tests: `/api/mobile/attendance/mark` (role gates + cross-tenant rejection)
- [x] Playwright E2E specs (`tests/e2e/attendance/`): overview RBAC, admin marks manual, compliance settings RBAC, student records, feature-pages smoke

---

## Known Issues

### P0 -- Critical

_(none open)_

### P1 -- High

_(none open — the auth/IDOR, multi-tenant and correctness P1s were closed in the
2026-06-13 hardening pass below.)_

### P2 -- Medium (deferred polish — not blocking)

1. **i18n — server-action error strings (partial)** -- core/periods/bulk and most
   sub-feature read guards now return `actionError(ACTION_ERRORS.*)` codes, but a
   long tail of English `error:` literals remains across
   `analytics/master/policy/compliance/excuses/interventions.ts` and the
   sub-feature `actions.ts`. Client-safe (components surface their own
   `dictionary.*` text, not the raw `result.error`) — convention-conformance, not
   a visible defect.
2. **i18n — Zod validation messages** -- `validation.ts`, `shared/validation.ts`,
   `geofencee/validation.ts` and per-feature schemas use raw English literals.
   These are **dev-facing only** (server actions `.parse()` and surface their own
   dictionary text / `VALIDATION_ERROR` codes to users), so converting to
   `createXSchema(v: ValidationHelper)` factories is low-value/high-churn; deferred.
3. **i18n — settings page** -- `attendance/settings/page.tsx` is a non-functional
   static mockup (switches without state, no-op Save); its labels are hardcoded
   English. Localize **when it is wired to real persistence** (needs a settings
   model). The page is ADMIN-gated; the "Save" button is a known no-op.
4. **i18n — client toast literals** -- `toast.*("literal")` calls in the
   geofencee client components (geo-tracker, geo-live-map, geofence-form/list) and
   `intentions/submit-form.tsx` JSX bypass `dictionary.messages.toast`. User-visible
   but English-only; localize next i18n pass.
5. **Durable scan rate limiter** -- `security.ts` `checkRateLimit`/`recordScanFailure`
   are in-memory (reset on serverless cold start). A shared Redis-backed limiter
   exists (`@/lib/rate-limit` `checkUserRateLimit`); migrating the QR/barcode/kiosk
   scan-failure counter to it needs an async refactor of those call sites. The
   in-memory store still gives per-instance protection.
6. **Nav reachability** -- 13 functional auth-gated subroutes are reachable by
   direct URL but not surfaced in `getTabsForRole`. Product decision: promote the
   user-facing ones (geo, kiosk, letters, gamification, ai) to tabs vs keep as
   deep-links.
7. **PDF compliance reports** -- Automated report generation not built.

### P3 -- Low (documented, not addressed)

1. **`/attendance/analysis` duplicates `/attendance/analytics`** -- consolidate or
   redirect one to the other.
2. **kiosk date-range vs stored midnight** -- `processKioskCheck` queries
   `gte today / lt tomorrow` but stores `date: today` — fine under UTC, fragile if
   the server TZ is non-UTC.
3. **QR class-enrollment check** -- `processQRScan` does not verify the scanner is
   enrolled in the QR's class before marking PRESENT (low risk: the QR must be
   physically displayed in the room). Deferred because `StudentClass` population is
   not guaranteed for section-based schools.

### Deploy-time blockers (require owner action — not code)

1. **Vercel Pro** -- `vercel.json` declares 19 crons, 5 sub-daily (incl. the
   compliance `absence-followup */30` 2h-SLA cron). Hobby caps crons at 2/day,
   so this branch cannot deploy until the project is upgraded to Pro.
2. **Neon DB push** -- additive compliance + live-class tables +
   `NotificationType.absence_unreported_followup` + nullable `AuditLog.userId`,
   PLUS the two new attendance hot-path indexes added 2026-06-13
   (`@@index([schoolId, classId, date])`, `@@index([schoolId, studentId, date])`).
   Apply via `CREATE INDEX CONCURRENTLY IF NOT EXISTS` / `ALTER … ADD … IF NOT
EXISTS` on the default branch (never `migrate deploy`); Neon-branch-first.
3. **Env vars** -- `COMPLIANCE_ENCRYPTION_KEY`, `ADEK_WEBHOOK_SECRET`, the 8
   `LIVEKIT_*`, `FIREBASE_*` in central `.env` + Vercel.
4. **Browser DRY_RUN E2E** -- compliance esis-submit + absence-followup +
   attendance/excuse/QR smoke on `demo.localhost:3000`.

### Recently Fixed (2026-06-19 -- soft-delete read/write consistency)

A competitor pass (vs OpenEduCat / PowerSchool / Skyward) plus a full audit of
every `db.attendance` read found the soft-delete feature (`deleteAttendance` /
`bulkDeleteAttendance` / `restoreAttendance`, admin-reachable via
`core/attendance-context.tsx`) was **half-wired**: delete/restore set
`deletedAt`, but a swath of reads ignored it, so an admin-removed record still
counted everywhere — wrong student percentages, wrong dashboard "marked" counts,
removed absences still demanding excuses, and (worst) a re-mark after delete that
silently failed to revive. **Closed across the whole attendance surface (block
actions + mobile API + crons). tsc 0, 611/611 tests green incl. new regression
tests in `attendance-stats.test.ts` + `actions.test.ts`.**

**Read side — aggregate/display reads now filter `deletedAt: null`:**

1. `attendance-stats.ts` (per-student percentage engine) — all four reads:
   `calculateAttendancePercentage`, `getBulkAttendanceStats`,
   `getClassAttendanceStats`, `getAttendanceTrends`. A removed record no longer
   skews a student's %, the at-risk list or perfect-attendance awards.
2. `dashboard.ts` — the per-class "isMarked / markedCount" groupBys (admin +
   teacher views) and the period-based unmarked-classes detector.
3. `bulk.ts` — `getRecentBulkUploads` total + success groupBys (kept consistent).
4. `excuses.ts` — `submitExcuse` lookup + the guardian "absences needing excuse" list.
5. `periods.ts` — period-marked detection, `getPeriodAttendanceStats`, student day view.
6. `qr-code/actions.ts` `getQRCodeStats`; `core.ts` `checkOutStudent` lookup.
7. Mobile `mobile/dashboard` student attendance ratio; cron `teacher-reminders`
   no longer treats a deleted record as "attendance taken" (so the reminder fires).

**Write side — re-marking now revives a soft-deleted row.** The unique tuple
`(schoolId, studentId, section|class, date, periodId)` still reserves a deleted
row's key, so filtering the lookup would collide on create. Instead the update
paths set `deletedAt: null`: `markAttendance`, `markSingleAttendance`,
`quickMarkAllPresent`, `markPeriodAttendance`, QR scan (block + mobile), kiosk
check-in. `geofencee/geo-service.ts` + `barcode/actions.ts` branch on the found
row's `deletedAt` to revive instead of crashing on the constraint. Barcode now
also records `method: "BARCODE"` (it previously defaulted to MANUAL, corrupting
by-method analytics).

**Already-correct (verified, untouched):** the main analytics groupBy, the ADEK
compliance CSV groupBys, the report/CSV-export reads, and the student/guardian
mobile attendance lists already filtered `deletedAt: null`.

### Recently Fixed (2026-06-13 -- production-readiness hardening pass)

A full 8-dimension audit (multi-tenant, auth/RBAC, correctness, performance,
security, robustness, i18n, structure) with adversarial verification produced
83 confirmed findings; the security/correctness/performance ones are now fixed.
**525/525 attendance tests green, tsc 0 attendance errors.**

**Auth / IDOR (P0–P1) — `getTenantContext()` resolves `schoolId` from the
`x-subdomain` header WITHOUT a session, so any `"use server"` action guarded only
on `schoolId` was reachable unauthenticated. Closed:**

1. `core.ts` — `checkOutStudent` + `bulkCheckOut` had **no `auth()` at all**
   (unauthenticated mutations); `quickMarkAllPresent` had no role check. All now
   go through a new shared `guardAttendance(action)` helper (`actions/helpers.ts`)
   = `auth()` + `getTenantContext()` + RBAC-matrix check.
2. `qr-code/actions.ts` — added role gates to `generateAttendanceQR`,
   `getActiveQRSessions`, `invalidateQRSession`, `getQRCodeStats`; fixed
   `getStudentQRScans` **IDOR** (compared `studentId` against `User.id` and used
   `User.id` as a `Student.id`) — now resolves owned students via
   `getOwnedStudentIds`.
3. `analytics.ts` — `getAttendanceStats` + `getRecentAttendance` now require an
   analytics role (return the empty shape on failure).
4. `attendance-stats.ts` — `getClassAttendanceStats` `findUnique`→`findFirst`+
   `schoolId` (**cross-tenant class-name leak** closed); all exports gated via
   `guardAttendance("view_analytics")`.
5. `intentions/actions.ts` — `submitAbsenceIntention` ownership check;
   `getAbsenceIntentions` + `getPendingIntentionsCount` staff-gated.
6. `interventions/tiers/actions.ts` — `getStudentsByTier`,
   `getStudentInterventionHistory`, `getMTSSStats` staff-gated.
7. `letters/actions.ts` — `getStudentLetterHistory`, `getStudentsNeedingLetters`
   staff-gated. `gamification/actions.ts` — `getStudentGamificationStats`
   ownership check. `policy.ts` — `getPolicyTriggers` staff-gated.
8. `excuses.ts` — `getExcuseById` ownership check; `reviewExcuse` writes wrapped
   in a transaction + the attendance write scoped by `schoolId` (updateMany).
9. `bulk.ts` — **teacher scope-bypass** fixed in `getAttendanceReport` +
   `getAttendanceReportCsv` (an explicit `classId` overwrote the
   `{ in: teacherClassIds }` restriction; now intersected).
10. `periods.ts` — `markPeriodAttendance` validates that submitted `studentId`s
    belong to the school; `getPeriodsForClass` staff-gated.
11. Mobile routes — hall-pass + excuse PUT writes scoped by `schoolId`
    (updateMany, immune to TOCTOU).

**Correctness:**

- `bulk.ts` — **CSV formula-injection** neutralized (every cell quoted, quotes
  doubled, risky `=/+/-/@` leads prefixed).
- QR scan — date normalized to midnight + `method:"QR_CODE"` set + idempotent
  re-scan (was wall-clock `new Date()`, no method, duplicate rows).
- `attendance-stats.ts` — `calculateAttendancePercentage` no longer folds LATE
  into `presentDays` (was double-counting); percentage unchanged.
- `dashboard.ts` — `getTodaysDashboard` rate now counts PRESENT **and** LATE.
- `periods.ts` — `markPeriodAttendance` no longer nulls `checkInTime`/`notes` on a
  re-mark that omits them; writes are now atomic (transaction).
- `excuses.ts` / `interventions.ts` — `reviewExcuse` + `escalateIntervention`
  made atomic.
- `bulk-upload/content.tsx` — UI no longer reports success on a rolled-back /
  partial import.
- `bulk/page.tsx` — removed the broken "Live Tracking" card (`href:""`).
- `manual` + `analytics` pages — removed double-`await params`.

**Performance (N+1 / hot paths):**

- `periods.ts markPeriodAttendance` (P0) — prefetch + batched `createMany`
  (was `findFirst`+write per record).
- `attendance-stats.ts getBulkAttendanceStats` — one `findMany` for all students
  (was one per student via `calculateAttendancePercentage`).
- `analytics.ts getAttendanceStats` — one `groupBy` (was 6 parallel `count`s).
- `dashboard.ts` — `getParentAttendanceSummary` batched (2 queries vs 2N);
  `getTodaysDashboard` joins names only for the 10 recent rows; `getFollowUpStudents`
  pending-excuses now teacher-scoped.
- `bulk.ts getRecentBulkUploads` — one `groupBy` (was a COUNT per bucket).
- `core.ts getAttendanceList` — batched `getNames` (was `getText` per student).
- `attendance-policies` cron — batched `createMany` + parallel notifications,
  per-school `try/catch` (one school's failure no longer aborts the run).
- Schema — added `@@index([schoolId, classId, date])` +
  `@@index([schoolId, studentId, date])` (apply on Neon at deploy).

### Recently Fixed (2026-06-12 -- section-chain alignment)

1. **`markPeriodAttendance` now writes `sectionId`** -- period attendance
   previously landed only on the legacy
   `[schoolId, studentId, classId, date, periodId]` constraint with
   `sectionId` omitted, contradicting the declared section-based
   architecture. The action now resolves `sectionId` from the passed
   `timetableId` slot (fallback: the class's timetable slot for that
   period) and writes it on both create and update — never nulling an
   existing value when unresolvable. 3 new tests (13/13 green in
   `periods.test.ts`). Part of the platform-wide section-chain pass
   (timetable manual writes went section-first the same day; see
   [/docs/provision](https://ed.databayt.org/en/docs/provision)).

### Recently Fixed (2026-06-02 -- production-readiness pass)

1. **Authorization gaps closed** -- role gates added to all gamification
   mutations, every AI action, letters generate/preview/bulk, interventions/tiers
   mutations; `getStudentIntentions` gained `auth()` + staff|self|guardian
   (was an intra-tenant IDOR); `getParentAttendanceSummary` guardian lookup is
   now `findFirst` + `schoolId`; `submitLocation` has an explicit STUDENT assert
   and its false "rate-limited 20/10s" docstring was corrected.
2. **i18n (visible)** -- `early-warning` risk-level labels were Arabic-only;
   now merged from `attendance.earlyWarning.riskLevels` (en/ar). New shared
   `<AttendanceAccessDenied>` localizes the "Access Denied" panel across all 17
   gated pages. Added `attendance.accessDenied` + `earlyWarning.riskLevels` to
   en + ar (550 leaves each, full parity).
3. **Route robustness** -- per-route `error.tsx` (19) + `loading.tsx` (8) added
   so every subroute localizes failures and shows a skeleton.
4. **Compliance/eSIS + live-classes re-landed** -- the reverted Aldar bundle was
   restored on this branch (`67f1887a9` un-park + Epic-01/03/04 hardening) so
   issue #1's "shipped" claim holds again here (pending the deploy blockers).

### Recently Fixed (2026-05-27 -- ADEK compliance epic)

1. **Parent notifications** -- `triggerAbsenceNotification` (actions/core.ts)
   now also queues `email` + `whatsapp` channels for schools where
   `SchoolComplianceConfig.enabled = true`. Existing crons drain the rows.
   Non-compliance schools keep the legacy `in_app + SMS` path.
2. **2-hour parent-contact SLA** -- New cron at
   `src/app/api/cron/absence-followup/route.ts` (every 30 min, UTC arithmetic)
   detects unreported absences and writes an `AttendanceIntervention` row of
   type `PARENT_EMAIL` with `parentNotified=true`, `contactMethod`,
   `contactResult` -- the regulatory audit-evidence path ADEK requires.
3. **ADEK eSIS submission framework** -- See sibling
   [`compliance/`](../compliance/README.md) block. Daily CSV cron at 10:00 UTC
   (= 14:00 GST), 4 connector modes (DRY_RUN / PIGGYBACK / OFFICIAL_API / RPA),
   generic schema (`ComplianceProvider` enum so future regulators plug in).

### Recently Fixed (2026-03-21)

1. **N+1 in `markAttendance()`** -- Was 2N DB calls per class, now ~4 (batch findMany + grouped updateMany + createMany)
2. **N+1 in `quickMarkAllPresent()`** -- Was 2N DB calls, now ~3 (batch fetch + updateMany + createMany)
3. **N+1 in `getClassComparisonStats()`** -- Was 3N parallel count queries, now 1 groupBy query
4. **24 stale `.bak` files removed** -- Leftover from prior refactoring

---

## Enhancements (Post-MVP)

- **Attendance-sheet finalize/lock workflow** (top competitor-parity gap — every
  major SIS has it: OpenEduCat "Draft/Start/Finalized" sheets, PowerSchool /
  Skyward sheet submission). Today any marking-role user can silently overwrite a
  marked record and there is no per-section/day "submit → lock" state, so admins
  can't distinguish a _finalized_ roster from a merely _touched_ one, and there's
  no immutability (or audited unlock) after submission. The `getUnmarkedClasses`
  / dashboard "N classes not marked" view already covers _completeness_; this adds
  _finality_. Needs an `Attendance.sheetStatus` (or a per-section/day lock model)
  - UI + RBAC for unlock. Schema-gated; deliberately deferred from the 2026-06-19
    pass so it doesn't expand the pending deploy surface.
- Biometric attendance (fingerprint/face recognition) — schema enums + device
  models exist (`BiometricTemplate`, `AccessCard`); needs device integration.
- Automated PDF compliance reports (see P2.7 — CSV ships today)
- Attendance policy enforcement rules
- Real-time WebSocket updates
- Soft delete support for attendance records — **shipped + read/write-consistent
  as of 2026-06-19** (see Recently Fixed). Remaining nicety: a UI surface for
  the admin restore (`restoreAttendance`) path.
- HMAC signature on QR code payloads (helpers exist in `security.ts` but are
  still dead code — QR uses randomBytes sessions)
- ADEK Phase 5 -- Official API connector (awaits ADEK developer access)
- ADEK Phase 4 -- RPA worker live selectors (awaits Aldar piggyback access)

---

**Last Review:** 2026-06-02 (production-readiness pass on `fix/attendance-production-ready`: security gaps closed, visible i18n localized, per-route boundaries added; attendance + compliance + cron + webhook + compliance-worker scope = **575/575 green across 45 files**, tsc 0 attendance errors, eslint 0 errors. The earlier "632/53" figure was the full Epic-01 sweep including additional mobile/e2e files outside this scope run.)
