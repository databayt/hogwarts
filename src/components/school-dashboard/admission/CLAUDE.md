---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: claude
owner: Abdout
maturity: Built
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-06-13
---

# Admission (Dashboard) Block

## Context

School-side admission pipeline: campaigns, applications, merit lists, enrollment, leads. Tabbed DataTable UI with RBAC-protected server actions. **Status: ~90%, production-ready core** — the 2026-06-13 pass fixed all P0/P1 breaks; the full admit→accept→pay→enroll→fee pipeline is end-to-end verified. **PRODUCT DECISION (2026-06-12): applying is always free — no application fee at the wizard; payment only at the fee stage (registration fee on acceptance + tuition invoices).** Read `ISSUE.md` for remaining open items (server-side search, WhatsApp breadth, #269). The feature spans 3 sides sharing one Prisma model: this dashboard block + `../../school-marketing/admission/` (public portal) + `../../school-marketing/application/` (wizard, ~68 files).

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

- Enrollment `$transaction` in `actions.ts` -- ~470 lines, many interdependent creates; partial failure corrupts data. New tests cover merit/placement/webhook paths; core enrollment coverage improved but Resend lazy-init still needed for full `confirmEnrollment` test load.
- `authorization.ts` -- RBAC gate; incorrect changes expose data across roles. ACCOUNTANT mismatch was fixed (2026-06-13): `permissions.ts` VIEW_ROLES now includes ACCOUNTANT with read-only tabs. `getCampaign` was the one exported read missing an `assertAdmissionPermission` call — now gated at `manageCampaigns` (fixed 2026-06-22, `111c06ff8`); keep EVERY exported action behind an authz assertion.
- Shared Prisma model with school-marketing side -- schema changes affect both blocks. `InvoiceStatus +PARTIAL`, `UserInvoice +amountPaid +sentAt` added (migration-of-record at `prisma/migrations/20260612200000_invoice_partial_payment_and_indexes`).
- **Merit was broken (P0-3) — fixed 2026-06-13**: added `updateApplicationScores` server action + inline score-entry UI (entrance/interview 0-100); `generateMeritList` now computes weighted `meritScore` (entrance 60% / interview 40%), ranks by it with nulls last, batched writes. Merit tab is functional.
- **Offer flow was broken (P0-1/P0-2) — fixed 2026-05-22 + 2026-06-13**: accessToken threaded from `offer/page.tsx` → `OfferContent` → all 5 mutations; `callbackUrl` now preserves the full token'd offer path through login; registration-fee success/fail banners; rate-limited; abandoned-checkout retry unblocked.
- **AI subsystem was disconnected (P1-1) — fixed 2026-06-13**: `/api/cron/process-document-jobs` (\*/10) now drains the queue; `classify.ts` is budget-gated (`canUseAI`) + tracks usage; `classifyDocument`/`getDocumentProcessingStatus` are RBAC-gated; `bank-receipt-schema.ts` Zod fields made optional.
- **Error display (P1-5) — fixed 2026-05-22**: clients now show localized messages; raw `OFFER_EXPIRED`-style codes no longer surface to users. When touching toasts, continue using the localized fallback pattern.
- `Application.lang` field still absent (P1-6 — schema flag, deferred). Student lang derived via regex heuristic; keep until schema work is approved.

## Related Blocks

- [School Marketing Admission](../../../school-marketing/admission/CLAUDE.md) -- public-facing application portal (applicant submits here)
- [School Marketing Apply](../../../school-marketing/application/CLAUDE.md) -- new multi-step application form
- [School Dashboard](../CLAUDE.md) -- parent block

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if file structure or routes changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000`
