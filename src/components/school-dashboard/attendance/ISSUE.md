# Attendance -- Production Readiness Tracker

**Master tracker:** [databayt/hogwarts#1](https://github.com/databayt/hogwarts/issues/1) -- consolidates attendance + compliance ship work (formerly #354 + #322; child stories #283 + #287 stay open)
**Status:** IN PROGRESS
**Completion:** 88%
**Last Updated:** 2026-05-28

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
- [ ] Route pages created in app directory (BLOCKER — no `src/app/.../attendance/` directory)
- [ ] Sidebar navigation entry added (blocked by above)

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

1. **i18n incomplete** -- Validation error messages and some intervention type labels not in dictionaries
2. **Staff read-only view** -- Staff role attendance report access is partial

### P2 -- Medium

1. **PDF compliance reports** -- Automated report generation not built
2. **Bulk upload error handling** -- Transaction rollback on validation failure missing
3. **Rate limiting** -- No rate limiting for failed barcode/QR scans
4. **Audit logging** -- No audit log for attendance modifications (compliance
   submissions DO write to `AuditLog` via `compliance.*` action strings)

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

**Last Review:** 2026-05-28 (full Vitest sweep — 632/632 green across 53 files; new attendance/compliance/cron/webhook/mobile/worker coverage)
