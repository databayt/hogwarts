---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: claude
owner: Abdout
maturity: Built
completion: 96
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-09-04
---

# Admission (Dashboard) Block

## Context

School-side admission pipeline: campaigns, applications, merit lists, enrollment, leads. Tabbed DataTable UI with RBAC-protected server actions. **Status: ~96%, production-ready core** — the 2026-06-13 pass fixed the original P0/P1 breaks and the 2026-09-04 pass closed the money, expiry, notification and role gaps; the full admit→accept→pay→enroll→fee pipeline is end-to-end verified twice. **PRODUCT DECISION (2026-06-12): applying is always free — no application fee at the wizard; payment only at the fee stage (registration fee on acceptance + tuition invoices).** Read `ISSUE.md` for remaining open items (the applicant account model, interview scheduling dates, tour confirmation mail, WhatsApp breadth, #269). The feature spans 3 sides sharing one Prisma model: this dashboard block + `../../school-marketing/admission/` (public portal) + `../../school-marketing/application/` (wizard, ~68 files).

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
- **`Application.lang` exists and is fully wired (P1-6 CLOSED)**: written by `submitApplication` since migration `20260522000000_add_lang_to_application`, selected in `applicationDetailSelect`, and read directly on the detail page (2026-07-18 — the Arabic-regex heuristic is gone).
- **EXPIRED status (2026-07-18)**: cron-set only (daily fee-due job flips SELECTED past `offerExpiryDate`); never a dropdown target; admin re-offers via EXPIRED → SELECTED. `status-machine.ts` is the single transition source for BOTH dropdowns (`applications-columns.tsx` no longer hand-copies the map).
- **Role-aware UI (2026-07-18)**: `getUIConfigForRole` drives `readOnly` on detail actions; campaigns/merit/settings/leads render `AdmissionAccessDenied` for roles outside their `getTabsForRole` set (inline denial, never `redirect()`).
- **Applying is always free**: the vestigial application-fee plumbing (settings input, campaigns column, submit result fields, `APPLICATION_FEE_UNPAID` warning) was removed 2026-07-18; Prisma columns remain but nothing writes them.

- **Post-commit notification moved out (2026-08-14)**: the ~150 inline lines in
  `confirmEnrollment` that sent the account notice, the `fee_due` notice and the
  guardian notice now live in `src/lib/student-provisioning-notify.ts`, shared by
  all five intake channels. It was **replaced**, not duplicated — leaving both
  would double-send every PORTAL enrollment, which is pinned by a regression
  test in `enrollment-notifications.test.ts`. The registration-fee ledger block
  stays here: it is PORTAL-specific. `NOTIF.enrollment` / `feeDue` /
  `guardianEnrollment` were deleted from `actions.ts` with it.
- **`dispatchAdmissionNotification` sends email INLINE** (its own comment: "Send
  email immediately instead of waiting for daily cron"). That is fine for a
  single student an admin is watching, and wrong for bulk — the shared
  dispatcher takes a `delivery: "immediate" | "queue"` for exactly this. Since
  2026-09-04 the inline send re-checks the user's per-channel preference via
  the exported `shouldSendNotification` (so do `deliver()` in
  `student-provisioning-notify.ts`) — the row is written with only the enabled
  channels, and the inline path used to ignore that.

- **The offer deadline binds ACCEPTANCE, not the office's confirmation
  (2026-09-04)**: the fee-due cron flips only `offerAccepted: false` rows to
  EXPIRED, `confirmEnrollment` checks expiry only when unaccepted, and
  `getOfferDetails` + the four payment actions keep an accepted offer live.
  Before this, a family that accepted and paid but whose admin was slow got
  flipped, dropped off the Enrollment tab and shown "offer expired". Keep the
  four sites in agreement.
- **The registration-fee ledger step matches the ANNUAL assignment** — the
  auto-provisioned per-grade structures carry the registration component
  inside their total — so it must set PARTIAL unless the payment covers
  `finalAmount`. `offer/fee-structures.ts` decides the offer's fee set with
  the same three matching arms and one-variant-per-grade rule as
  `ensureStudentFeeAssignments`; change one, change both.
- **Applicant-facing notices use `Application.lang`** (`applicantLang()` in
  actions.ts and offer/actions.ts, `familyLang` in settle.ts) and link the
  applicant's OWN surfaces (`/application`, the offer page) — never
  `/admission`, which is role-gated to staff. Staff notices link the tab that
  exists (`/admission/leads`, `/admission/enrollment`, the detail page).
- **`registration-methods.ts` is the one manual-rail list** shared by
  `confirmRegistrationPayment` and the enrollment row menu; the row used to
  carry a copy without the Sudan wallets. Cash/bank/wallet confirmation goes
  through `settleRegistrationFee` (offer/settle.ts) — the same settler as the
  card webhooks — so the idempotent flip and the ADMIN/ACCOUNTANT notice are
  written once. Pass the stored amount/reference/method; settle writes all three.
- **Every row menu item is gated on `canPerformAdmissionAction(role, …)`**
  with the same action the server asserts (status menu → `updateStatus`,
  confirm payment → `recordPayment`, placement → `placeStudents`, merit
  generation → `generateMeritList`). `role` is threaded content → table →
  columns; a menu item without a gate is a FORBIDDEN toast waiting to happen.
- **A (re-)offer resets unpaid state**: `updateApplicationStatus(SELECTED)`
  clears `offerAccepted` / the manual intent / the proof unless
  `registrationFeePaid`, and extends `accessTokenExpiry` past the new deadline
  (the applicant dashboard and the tracker hide an offer whose token lapsed).
- **Commit hygiene**: `school-en.json` / `school-ar.json` are shared with every
  other block and routinely carry another session's uncommitted hunks — stage
  the `school.admission` subtree only (build the index blob from HEAD + the
  subtree; never `git add` the whole file).

## Related Blocks

- [School Marketing Admission](../../../school-marketing/admission/CLAUDE.md) -- public-facing application portal (applicant submits here)
- [School Marketing Apply](../../../school-marketing/application/CLAUDE.md) -- new multi-step application form
- [School Dashboard](../CLAUDE.md) -- parent block

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if file structure or routes changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `admin@balqalam.com` (pw: 1234) on `demo.localhost:3000`
