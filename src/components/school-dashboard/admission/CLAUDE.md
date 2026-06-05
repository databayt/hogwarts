---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: claude
owner: Abdout
maturity: Built
completion: 60
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-05-25
---

# Admission (Dashboard) Block

## Context

School-side admission pipeline: campaigns, applications, merit lists, enrollment. Tabbed DataTable UI with RBAC-protected server actions. **Status: ~70%, NOT production-ready** despite prior "100%" claims — the 2026-05-21 audit found 3 live P0 breaks (offer flow dead, merit ranks by a never-computed score, AI pipeline never runs). Read `ISSUE.md` before assuming anything works. The feature spans 3 sides sharing one Prisma model: this dashboard block + `../../school-marketing/admission/` (public portal) + `../../school-marketing/application/` (wizard, ~68 files).

## Before You Start

1. Read `README.md` here for routes, file structure, and integration points
2. Read `ISSUE.md` here for priorities and MVP checklist
3. Check `../../../school-marketing/admission/` and `../../../school-marketing/application/` -- changes here often require changes there (shared Prisma model)

## Key Decisions

- Tabbed layout: each tab (campaigns, applications, merit, enrollment) has its own `*-content.tsx` (server) + `*-table.tsx` + `*-columns.tsx` (client) triplet
- RBAC enforced via `authorization.ts` -- ADMIN/STAFF full access, ACCOUNTANT payment-only, others denied
- Enrollment confirmation is a 12-step `$transaction` (creates Student, Guardian, Fees, Documents in one atomic operation)
- Application status transitions: draft → submitted → under_review → shortlisted → admitted/rejected → enrolled
- Merit scoring uses campaign-specific criteria -- algorithm lives in `queries.ts`

## Danger Zones

- Enrollment `$transaction` in `actions.ts` -- ~470 lines, many interdependent creates; partial failure corrupts data. Currently has **zero executing test coverage** (test file fails to load — Resend top-level init)
- `authorization.ts` -- RBAC gate; incorrect changes expose data across roles. Note ACCOUNTANT mismatch (server grants `viewApplications`/`recordPayment`, `permissions.ts` gives no UI)
- Shared Prisma model with school-marketing side -- schema changes affect both blocks
- **Merit is broken (P0-3)**: `meritScore` is never computed — the engine in `ai/merit-engine.ts` is unwired (zero callers); `generateMeritList` only assigns `meritRank` ordered by null scores. Don't trust the Merit tab
- **Offer flow is broken (P0-1/P0-2)**: `application/offer/content.tsx` passes an empty accessToken to every mutation, and the route sits under `(auth)` (login wall). Admit→accept→pay is dead end-to-end
- **AI subsystem is disconnected (P1-1)**: no `document-processing` cron, `ai/document-card.tsx` is never rendered, budget tracking is a no-op. Built ≠ running
- **Error display (P1-5)**: clients show raw error CODES (`OFFER_EXPIRED`…) because `result.error` holds the code and `resolveActionError()` is never called. Route through it when touching any toast

## Related Blocks

- [School Marketing Admission](../../../school-marketing/admission/CLAUDE.md) -- public-facing application portal (applicant submits here)
- [School Marketing Apply](../../../school-marketing/application/CLAUDE.md) -- new multi-step application form
- [School Dashboard](../CLAUDE.md) -- parent block

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if file structure or routes changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000`
