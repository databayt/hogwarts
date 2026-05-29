# Compliance Block

## Context

Generic regulator-submission framework. ADEK eSIS (Abu Dhabi) is the first
provider — Aldar Education pilot at Yasmina BA. Default OFF for every school;
opt-in per school × provider via `SchoolComplianceConfig.enabled`. Sidebar
gating: visible when `school.country === "AE"` OR DEVELOPER role.

Plan: `~/.claude/plans/read-attendance-block-and-distributed-wozniak.md` (6 phases).

## Before You Start

1. The schema lives in `prisma/models/compliance.prisma` — generic shape:
   `ComplianceProvider` enum (`ADEK_ESIS | CUSTOM`), `ConnectorMode` enum
   (`DRY_RUN | PIGGYBACK | OFFICIAL_API | RPA | DISABLED`), 4 tables:
   `SchoolComplianceConfig`, `SharedComplianceCredentialGroup`,
   `SchoolComplianceCredential`, `ComplianceSubmission`.

2. The connector library lives in `src/lib/compliance/`:
   - `types.ts` — `interface ComplianceConnector { id, mode, isConfigured, submit }`
   - `registry.ts` — `Map<provider:mode, ConnectorImpl>` + `getConnector()`
   - `orchestrator.ts` — `enqueueDailySubmissions()` + `processSubmission()`
   - `encryption.ts` — AES-256-GCM helpers for `COMPLIANCE_ENCRYPTION_KEY`
   - `audit-actions.ts` — `compliance.*` action-string constants
   - `providers/adek/` — ADEK-specific code (mapper, csv-schema, 4 connectors)

3. The cron entries live at `src/app/api/cron/`:
   - `esis-submit/route.ts` (10:00 UTC daily) — enqueue + dispatch
   - `absence-followup/route.ts` (every 30 min) — ADEK 2h SLA parent contact

4. The RPA worker is **out-of-band** at `tools/adek-rpa-worker/` (deployable
   to Fly.io). It pulls QUEUED submissions via `SchoolApiToken` with scope
   `compliance.rpa_claim`.

## Key Decisions

- **Generic naming everywhere.** Schema does NOT include ADEK-specific enums
  like `AdekAbsenceCategory`. The mapper translates internal status →
  category code; the result lives in `ComplianceSubmission.payloadCategorized
Json`. Adding SEC KSA / MoE Qatar is one enum value + one provider dir.

- **Audit via action strings, not enum.** `logAudit({ action:
"compliance.esis.submitted" })`. No `eventType` enum migration needed.
  Constants in `src/lib/compliance/audit-actions.ts`.

- **Idempotency primitive.** `ComplianceSubmission @@unique([schoolId,
provider, submissionDate, attemptNumber])`. Manual retries from the UI
  create a NEW row with incremented `attemptNumber` and `supersededById` ←→
  the prior row. History is preserved across modes (e.g., RPA after API
  failure each get their own audit row).

- **Circuit breaker on shared creds.** `SharedComplianceCredentialGroup`
  carries `circuitBreakerState`. Three failures within 1h → OPEN. Orchestrator
  halts further submissions for that group. Cooldown re-opens to HALF_OPEN
  after 1h.

- **DRY_RUN persists the CSV inline** in `csvArtifactContent` (`@db.Text`).
  When object storage (S3) is wired, switch to `csvArtifactUrl` and stream
  signed URLs from `/api/compliance/artifact/[submissionId]`.

- **2h SLA evidence = `AttendanceIntervention` row.** Auditors get a clean
  list via `getParentContactSlaReport()`. The intervention row has
  `parentNotified=true`, `contactMethod`, `contactResult` — designed for
  this purpose pre-feature, we just write to it.

## Danger Zones

- **`COMPLIANCE_ENCRYPTION_KEY` env var.** 32 bytes hex. If missing in
  production, the encryption helper throws at module load. Rotation goes
  through `COMPLIANCE_ENCRYPTION_KEY_V<N>` env vars + `keyVersion` column.
  Losing the key = losing every encrypted credential.

- **Shared-cred blast radius.** A bad CSV with PIGGYBACK creds shared by 29
  schools breaks all 29 simultaneously. Circuit breaker exists to short-circuit
  this; do NOT remove without a replacement.

- **UTC arithmetic, NOT school-local.** The 2h SLA cron computes `now() -
parentContactSlaMinutes` in UTC against `Attendance.markedAt`. Don't
  refactor to school-local — DST-flipping schools would double-fire or skip.

- **RPA scope.** The `compliance.rpa_claim` SchoolApiToken scope lets the
  external worker decrypt and read piggyback credentials. Treat the token
  like a root key — issue ONE per worker, monitor `lastUsedAt`, rotate on
  worker rotation.

- **Cron secret in production.** Hardened `timingSafeEqual` variant via
  `src/lib/cron-auth.ts isAuthorizedCron(request, "route-name")`. Dev allows
  no secret; prod fails closed.

- **Generic stance.** When adding a regulator-specific feature (column,
  enum value), think twice. If it's only useful for one authority, push it
  into `providers/<authority>/` instead of the shared schema.

## Related Blocks

- [Attendance](../attendance/) — source of truth for the submission payload.
  We extend `triggerAbsenceNotification` (actions/core.ts) to add
  `email`+`whatsapp` channels when compliance is enabled.
- [Notifications](../notifications/) — `dispatchNotification` + new
  `absence_unreported_followup` NotificationType.
- [Transportation](../transportation/) — donor of the `SchoolApiToken` model
  (generic per-school token, reused for the RPA worker claim path).
- [Webhooks](/Users/abdout/hogwarts/src/app/api/webhooks/adek/) — async
  receipts from ADEK when official-API mode lands.

## After You Finish

1. Run `pnpm prisma generate` + `pnpm tsc --noEmit` on touched files.
2. To apply schema to dev DB: `pnpm prisma db push` (WITHOUT
   `--accept-data-loss`). Migration history is empty per project memory —
   never `prisma migrate deploy`. The migration file at
   `prisma/migrations/20260527000000_add_compliance_models/migration.sql`
   is for the record only.
3. Set the encryption key locally:
   `export COMPLIANCE_ENCRYPTION_KEY=$(openssl rand -hex 32)` — add to
   central `.env`, NOT `.env.local` (project rule).
4. Test as `admin@databayt.org` (pw `1234`) on `demo.localhost:3000/en/compliance`.
5. Test as `dev@databayt.org` on `localhost:3000/en/compliance` for the
   shared-groups view.
