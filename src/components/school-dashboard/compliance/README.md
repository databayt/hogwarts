# Compliance Block

Regulator-submission framework. First provider: **ADEK eSIS** (Abu Dhabi).

> **Master tracker:** [databayt/hogwarts#1](https://github.com/databayt/hogwarts/issues/1) — consolidated attendance + compliance ship work.

## Live Routes

- `/[lang]/compliance` — per-school admin (ADMIN/DEVELOPER/STAFF)
  - Settings card: enable toggle, mode, submission time, parent-contact SLA
  - Submissions table: 30 recent attempts, status, receipt, download CSV, retry
- `/[lang]/(saas-dashboard)/compliance` — cross-tenant (DEVELOPER only)
  - Create shared credential groups (Aldar pattern, 1 cred row → N schools)
  - View circuit-breaker state per group

## Server Actions

`src/components/school-dashboard/compliance/actions.ts`:

| Action                        | Permission         | What                                  |
| ----------------------------- | ------------------ | ------------------------------------- |
| `updateComplianceConfig`      | `manage_config`    | upsert SchoolComplianceConfig         |
| `retryComplianceSubmission`   | `retry_submission` | create new attempt row, status=QUEUED |
| `createSharedCredentialGroup` | DEVELOPER only     | encrypt + persist group secret        |

## API Routes

| Path                                      | Caller                        | Auth                                                 |
| ----------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| `/api/cron/esis-submit`                   | Vercel cron (10:00 UTC daily) | `Bearer CRON_SECRET`                                 |
| `/api/cron/absence-followup`              | Vercel cron (every 30 min)    | `Bearer CRON_SECRET`                                 |
| `/api/compliance/artifact/[submissionId]` | Admin UI                      | session + tenant + permission                        |
| `/api/compliance/worker/claim`            | RPA worker                    | `Bearer SchoolApiToken` scope `compliance.rpa_claim` |
| `/api/compliance/worker/ack`              | RPA worker                    | same                                                 |
| `/api/webhooks/adek`                      | ADEK eSIS (future)            | HMAC-SHA256 over body, `ADEK_WEBHOOK_SECRET`         |

## Connector Modes

- **DRY_RUN** — Build CSV, persist inline, mark SUBMITTED. Registrar uploads
  manually. **No external dependency. Default for Yasmina BA pilot.**
- **PIGGYBACK** — Decrypt group creds, post to eSIS via group account. Wired
  but returns `PIGGYBACK_UPLOAD_NOT_IMPLEMENTED` until Aldar grants creds.
- **OFFICIAL_API** — Documented vendor contract. Returns
  `OFFICIAL_API_NOT_AVAILABLE` until ADEK responds to integration inquiry.
- **RPA** — Mark QUEUED, hand off to `tools/adek-rpa-worker/` Fly.io worker.
- **DISABLED** — Skip in cron.

## Audit Actions

All under namespace `compliance.*` — search the audit log to trace:

- `compliance.config.{enabled|disabled|mode_changed}`
- `compliance.credential.{created|rotated|revoked}`
- `compliance.submission.{queued|submitted|accepted|rejected|failed|claimed}`
- `compliance.parent_contact.{queued|delivered|failed}`
- `compliance.circuit_breaker.{opened|closed|half_open}`

## Required Env Vars

- `COMPLIANCE_ENCRYPTION_KEY` — 32-byte hex (`openssl rand -hex 32`).
  Required in production. Fails closed if missing.
- `CRON_SECRET` — Vercel cron Bearer token (shared with other crons).
- `ADEK_WEBHOOK_SECRET` — Required once Phase 5 official API is live.

## Status

| Phase                                                        | Status                            |
| ------------------------------------------------------------ | --------------------------------- |
| 0 — schema consolidation (attendance-enhanced.prisma merged) | ✅                                |
| 1 — schema + encryption + settings UI                        | ✅                                |
| 2 — connector library + DRY_RUN + daily cron                 | ✅                                |
| 3 — PIGGYBACK + shared-group admin UI + circuit breaker      | ✅ wired (awaiting Aldar creds)   |
| 4 — RPA worker scaffold + claim/ack routes                   | ✅ scaffold (eSIS selectors TODO) |
| 5 — OFFICIAL_API stub + webhook receiver                     | ✅ stub (awaiting ADEK contract)  |
| 6 — 2h parent-contact SLA cron + intervention evidence       | ✅                                |

## External Blockers (non-engineering)

1. File formal eSIS-integration inquiry to ADEK via Aldar compliance team
2. Aldar piggyback approval (their group-level eSIS credentials)
3. Fly.io account + billing for RPA worker (~$5/mo)
4. `COMPLIANCE_ENCRYPTION_KEY` rotation policy (security team)
5. Authoritative ADEK 2025/26 absence-category circular (refine `mapper.ts`)
