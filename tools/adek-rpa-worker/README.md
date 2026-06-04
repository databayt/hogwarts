# ADEK eSIS RPA Worker

Out-of-band Playwright worker that uploads daily attendance CSV files to
[esis.adek.gov.ae](https://esis.adek.gov.ae) on behalf of hogwarts tenants.

## Why this is separate from the main app

Playwright + Chromium won't fit Vercel's serverless function size limits and
its 300s execution cap is unfriendly to a browser session. The worker runs as
a long-lived process on Fly.io (or any container host) and polls the hogwarts
API for queued RPA submissions.

## Architecture

```
hogwarts Vercel app                       this worker (Fly.io)
─────────────────────                     ─────────────────────
 esis-submit cron (10:00 UTC)
   ↓
 ComplianceSubmission row (status=QUEUED, mode=RPA)
                                          ←── POST /api/compliance/worker/claim
                                            (Bearer SchoolApiToken,
                                             scope=compliance.rpa_claim)
                                          → returns: submission payload + CSV
                                                   + decrypted credentials
                                                   + lease (10 min)

                                          worker spawns Playwright Chromium,
                                          logs into eSIS, uploads CSV,
                                          captures receipt ID

                                          ──→ POST /api/compliance/worker/ack
                                            { status, receiptId, errorCode? }
   ↓
 ComplianceSubmission updated
   status=ACCEPTED/REJECTED/FAILED
   logAudit("compliance.submission.*")
```

## Authentication

The worker holds one `SchoolApiToken` with `scopes: ["compliance.rpa_claim"]`.
Issue it once via the DEVELOPER saas-dashboard (or programmatically via
`generateApiToken()` in `src/lib/api-tokens.ts`). The plaintext is shown ONCE;
store it as the `HOGWARTS_API_TOKEN` env var on the Fly.io machine.

## Deploy

```bash
cd tools/adek-rpa-worker
fly launch --no-deploy        # one-time
fly secrets set \
  HOGWARTS_API_BASE=https://ed.databayt.org \
  HOGWARTS_API_TOKEN=<plaintext-token> \
  WORKER_ID=fly-adek-rpa-01
fly deploy
```

## Local dev

```bash
pnpm install
export HOGWARTS_API_BASE=http://localhost:3000
export HOGWARTS_API_TOKEN=<token-from-dev-seed>
pnpm start
```

## Status

**SCAFFOLD** — the browser flow in `src/submit-esis.ts` is wired end-to-end
but selectors are placeholders. The worker will run and claim submissions, but
every attempt currently returns `errorCode: "RPA_FLOW_NOT_IMPLEMENTED"` until
we have access to the live eSIS portal to record real selectors.

To finish the implementation:

1. Get group eSIS credentials from Aldar (Epic 01 sub-issue #2)
2. Record the login + upload flow once (Playwright codegen)
3. Paste selectors into `submit-esis.ts` and remove the TODO block
