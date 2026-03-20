# Admission (Dashboard) Block

## Context

School-side admission pipeline: campaigns, applications, merit lists, enrollment (90% complete, no blockers). Tabbed DataTable UI with RBAC-protected server actions.

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

- Enrollment `$transaction` in `actions.ts` -- 12 interdependent creates; partial failure corrupts data
- Bulk placement -- modifies many records at once; no progress indicator for large batches (P2)
- `authorization.ts` -- RBAC gate; incorrect changes expose data across roles
- Shared Prisma model with school-marketing side -- schema changes affect both blocks

## Related Blocks

- [School Marketing Admission](../../../school-marketing/admission/CLAUDE.md) -- public-facing application portal (applicant submits here)
- [School Marketing Apply](../../../school-marketing/application/CLAUDE.md) -- new multi-step application form
- [School Dashboard](../CLAUDE.md) -- parent block

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if file structure or routes changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000`
