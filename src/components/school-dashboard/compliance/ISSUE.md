# Compliance Block — Issue Tracker

**Master tracker:** [databayt/hogwarts#1](https://github.com/databayt/hogwarts/issues/1) — attendance + compliance ship work. Tests shipped 2026-05-28 (Vitest 632/632 green; 0 TS errors).

## Open

### P1 — Awaiting external

- **eSIS official API contract** — file inquiry via Aldar compliance team
  (Epic 01 sub-issue #1). Until then, `providers/adek/official.ts` returns
  `OFFICIAL_API_NOT_AVAILABLE`.
- **Aldar piggyback credentials** — formal request for group-level eSIS
  account (Epic 01 sub-issue #2). Until then, `providers/adek/piggyback.ts`
  returns `PIGGYBACK_UPLOAD_NOT_IMPLEMENTED`.
- **eSIS portal selectors** — `tools/adek-rpa-worker/src/submit-esis.ts`
  flow is scaffolded but every claim currently returns
  `RPA_FLOW_NOT_IMPLEMENTED`. Need Aldar pilot access + Playwright codegen
  recording.
- **ADEK 2025/26 absence-category circular** — `mapper.ts` rules are based
  on the Aldar memo summary. Reconcile with the PDF when shared.

### P2 — Improvements

- **Object storage migration** — currently `csvArtifactContent` is a
  Postgres TEXT column. For pilot scale (1 school × 1 day × small CSV) this
  is fine. When the worker fleet adds dozens of schools, move to S3 +
  server-side encryption + signed URLs in `csvArtifactUrl`. The download
  route at `/api/compliance/artifact/[submissionId]` already redirects to
  `csvArtifactUrl` when set.

- **Per-school overrides for SLA channels** — today the followup cron always
  uses `["in_app", "email", "whatsapp"]`. Some schools may want to disable a
  channel; surface this in `SchoolComplianceConfig.providerConfig` JSON.

- **Notification preference gating** — `dispatchNotification` already honors
  per-user `NotificationPreference.enabled` for `in_app`. Confirm the same
  gating fires for the new `absence_unreported_followup` type, especially
  for the email and WhatsApp drains.

### P3 — Polish

- **Resolve generic CSV writer** — `providers/adek/mapper.ts` has its own
  escape function. If a second provider needs CSV, extract to
  `src/lib/compliance/csv-export.ts`.

- **Compliance dashboard widgets** — `getParentContactSlaReport()` returns
  counts. Surface as a card in `content.tsx` so admins see the regulator
  evidence at a glance.

- **i18n shared-groups page** — the saas-dashboard page is in English only.
  Translate the table headers when DEVELOPER UI gets a full pass.

## Resolved (audit pass — same session)

- Cross-tenant leak in worker `/claim` (now scoped to `verified.token.schoolId`)
- Cross-tenant leak in worker `/ack` (returns 403 if submission's schoolId ≠ token's)
- Audit FK broken for system actor (`AuditLog.userId` now nullable; system events log with `userId: null`)
- RPA payload hardcoded `rolling30dAbsencePct: 0` (now uses orchestrator `buildPayloadForDay`)
- CSV not persisted for non-DRY_RUN modes (now persisted on every mode)
- Sidebar missing compliance entry (added with shield icon + en/ar titles)
- Country gate (school.country === "AE" OR DEVELOPER) missing on school-dashboard page
- `submissionTimeUtc` field stored but never used (orchestrator now filters by current UTC HH:MM)
- Hardcoded English "Notify admins on failure" label (uses dict.settings.notifyAdminLabel)
- Hardcoded English in orchestrator failure notification (now lang-aware via school.preferredLanguage)
- Intervention type was `PARENT_PHONE_CALL` despite email-only dispatch (now `PARENT_EMAIL`)
- `window.location.reload()` in shared-groups-table (now `router.refresh()`)
- ALTER TYPE inside transaction in migration SQL (wrapped in COMMIT/BEGIN markers)
- `compliance.rpa_claim` scope hardcoded as string (now in `API_TOKEN_SCOPES` catalog)
- RPA processSubmission status-thrash (`processSubmission` now early-returns for RPA — the worker takes over from QUEUED)

## Remaining (deferred, non-blocking)

- DEVELOPER saas-dashboard `shared-groups-table.tsx` still has hardcoded English
  copy throughout. Acceptable since the page is DEVELOPER-only (English-speaking
  ops team); P3.
- Cron fan-out `after()` has no concurrency limit; at 200+ schools could exhaust
  Neon pool. Mitigate with a queue (BullMQ/Inngest) before scaling beyond pilot.
- Issuance UI for `compliance.rpa_claim` scope — currently transportation tokens
  page only mints `transportation.geofence_boarding`. Add a scope selector or a
  dedicated compliance tokens admin section before bringing the Fly.io worker
  online.
- Validation Zod messages in `validation.ts` are English strings — should use
  `ValidationHelper` once the helpers contract supports compliance keys.
