# Attendance -- Production Readiness Tracker

**Master tracker:** [databayt/hogwarts#1](https://github.com/databayt/hogwarts/issues/1) -- consolidates attendance + compliance ship work (formerly #354 + #322; child stories #283 + #287 stay open)
**Status:** IN PROGRESS
**Completion:** ~92%
**Last Updated:** 2026-06-02

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

1. **i18n — server-action error strings (partial)** -- The auth/tenant guard
   returns in `actions/{bulk,core,dashboard,periods}.ts` now use
   `actionError(ACTION_ERRORS.*)` codes, but ~80 English error strings remain
   across the rest of those files plus `analytics/master/policy/compliance.ts`.
   (Client-safe: components surface their own `dictionary.*` text, not the raw
   `result.error`, so this is convention-conformance, not a visible defect.)

### P2 -- Medium

1. **i18n — Zod validation messages** -- `validation.ts`, `shared/validation.ts`
   (16), `geofencee/validation.ts` (~40) and per-feature schemas use raw English
   literals; not yet routed through `ValidationHelper`.
2. **i18n — settings page** -- `attendance/settings/page.tsx` is a non-functional
   static mockup (switches without state, no-op Save); its ~42 labels are
   hardcoded English. Localize when it is wired to real persistence.
3. **i18n — client toast literals** -- a handful of `toast.*("literal")` calls
   (geofencee/geo-tracker, geo-live-map) bypass `dictionary.messages.toast`.
4. **Unused `dictionary` locals** -- 6 route pages (ai, intentions, hall-pass,
   early-warning, kiosk, interventions/tiers) load `getDictionary` but never use
   it (pre-existing; eslint warning, not error).
5. **PDF compliance reports** -- Automated report generation not built.
6. **Bulk upload error handling** -- Transaction rollback on validation failure missing.
7. **Nav reachability** -- 13 functional auth-gated subroutes (bulk, bulk-upload,
   analysis, gamification, geo, barcode, intentions, hall-pass, kiosk, letters,
   recent, ai, interventions/tiers) are reachable by direct URL but not surfaced
   in `getTabsForRole`. Product decision: promote the user-facing ones (geo,
   kiosk, letters, gamification, ai) to tabs vs keep as deep-links.

### Deploy-time blockers (require owner action — not code)

1. **Vercel Pro** -- `vercel.json` declares 19 crons, 5 sub-daily (incl. the
   compliance `absence-followup */30` 2h-SLA cron). Hobby caps crons at 2/day,
   so this branch cannot deploy until the project is upgraded to Pro.
2. **Neon DB push** -- additive compliance + live-class tables +
   `NotificationType.absence_unreported_followup` + nullable `AuditLog.userId`.
   Apply via `ALTER … ADD … IF NOT EXISTS` on the default branch (never
   `migrate deploy`); Neon-branch-first.
3. **Env vars** -- `COMPLIANCE_ENCRYPTION_KEY`, `ADEK_WEBHOOK_SECRET`, the 8
   `LIVEKIT_*`, `FIREBASE_*` in central `.env` + Vercel.
4. **Browser DRY_RUN E2E** -- compliance esis-submit + absence-followup +
   attendance/excuse/QR smoke on `demo.localhost:3000`.

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

- Biometric attendance (fingerprint/face recognition)
- Automated PDF compliance reports
- Attendance policy enforcement rules
- Real-time WebSocket updates
- Soft delete support for attendance records
- HMAC signature on QR code payloads
- ADEK Phase 5 -- Official API connector (awaits ADEK developer access)
- ADEK Phase 4 -- RPA worker live selectors (awaits Aldar piggyback access)

---

**Last Review:** 2026-06-02 (production-readiness pass on `fix/attendance-production-ready`: security gaps closed, visible i18n localized, per-route boundaries added; attendance + compliance + cron + webhook + compliance-worker scope = **575/575 green across 45 files**, tsc 0 attendance errors, eslint 0 errors. The earlier "632/53" figure was the full Epic-01 sweep including additional mobile/e2e files outside this scope run.)
