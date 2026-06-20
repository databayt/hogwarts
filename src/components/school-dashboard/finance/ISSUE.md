---
epic: 01
sprint: Q3-2026
title: Finance (school dashboard)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 88
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-06-13
---

# Finance -- Readiness & Verified Gap Register

> Last updated: 2026-06-13 · ~88% ready · 14 sub-modules
>
> This file is the **engineering source of truth** for finance readiness. The public-facing mirror is `/docs/finance` (hub) + a page per sub-block. The hub's status matrix and `README.md`'s matrix are kept identical to the banner below.
>
> **Aldar UAE payment readiness:** consolidated trace lives at [hogwarts#356](https://github.com/databayt/hogwarts/issues/356) — payment-method enum extended (APPLE_PAY/GOOGLE_PAY/MADA/KNET/ATM_DEPOSIT), `PENDING_VERIFICATION` flow, currency snapshot on Payment/FeeAssignment/FeeStructure/Receipt, reconciliation report live at `/finance/banking/reconciliation`, server-side receipt PDF.

## Status banner

| Sub-module  | Readiness | Ledger wired                             | i18n | Tests  | Docs |
| ----------- | --------- | ---------------------------------------- | ---- | ------ | ---- |
| invoice     | 95%       | ❌ `postInvoicePayment` orphaned         | ⚠️   | 🟢 131 | ✅   |
| fees        | 96%       | 🟢 payments + assignments (no rollback)  | ✅   | 🟡 17+ | ✅   |
| budget      | 85%       | ➖ n/a                                   | ✅   | ❌     | ✅   |
| receipt     | 90%       | ➖ n/a                                   | ✅   | ❌     | ✅   |
| banking     | 85%       | 🔗 reconciliation live                   | ⚠️   | 🟡 5   | ✅   |
| dashboard   | 80%       | ➖ n/a (trends are mock)                 | ✅   | ❌     | ✅   |
| expenses    | 80%       | ❌ `postExpensePayment` orphaned         | ⚠️   | ❌     | ✅   |
| accounts    | 75%       | 🟢 engine home (fee payments only)       | ⚠️   | 🟡 10  | ✅   |
| permissions | 75%       | ➖ n/a                                   | ⚠️   | ❌     | ✅   |
| reports     | 75%       | 🔗 reads ledger (fee-only data)          | ⚠️   | ❌     | ✅   |
| salary      | 75%       | ➖ n/a                                   | ✅   | ❌     | ✅   |
| timesheet   | 75%       | ➖ n/a                                   | ⚠️   | ❌     | ✅   |
| wallet      | 75%       | 🟡 `postWalletTopup` wired (no rollback) | ⚠️   | ❌     | ✅   |
| payroll     | 65%       | ❌ `postSalaryPayment` orphaned          | ✅   | ❌     | ✅   |

Legend — **Ledger**: 🟢 posts journal entries · 🟡 posts but not transactional · ❌ posting fn exists but has zero callers · 🔗 consumes the ledger · ➖ not a money-mover. **i18n**: ✅ ready · ⚠️ validation strings still hardcoded English (separate from the cross-cutting DB-`lang` gap below). **Tests**: 🟢 strong · 🟡 partial · ❌ none.

**Overall ≈ 88%** (average of the readiness column after the 2026-06-13 admission+finance production-readiness pass).

## MVP Checklist

- [x] Currency driven by `School.currency` everywhere -- no `$` or `SDG` hardcodes
- [x] All `date-fns format()` calls pass locale from `date-fns/locale`
- [x] Server actions use `actionError(ACTION_ERRORS.*)` + client `ERROR_MAP`
- [x] Notification dispatch uses `finance.notifications.*` keys (no bilingual ternaries)
- [x] Locale-aware formatters in `lib/format.ts`
- [x] Public docs: hub + per-sub-block pages (`/docs/finance`, EN) — 2026-05-21
- [~] Wire the orphaned posting functions — `postFeeAssignment` (assignFee + bulkAssignFees) and `postWalletTopup` now wired; `postInvoicePayment` / `postExpensePayment` blocked on missing payment-recording flows, `postSalaryPayment` on the unbalanced rule (see P0)
- [ ] `postFeePayment` made transactional with rollback — deliberately deferred (fire-and-forget by design; shared with the reconciliation story)
- [x] `debit = credit` invariant test on actual posting — `lib/accounting/posting-rules.test.ts` (15/15 green after the `toCents` fix below)
- [ ] `lang` field on user-facing finance models + `getText` routing
- [ ] 11 `validation.ts` factories wired to `ValidationHelper` in consumers
- [ ] Test coverage for the 11 untested sub-modules
- [ ] PDF rendering wired for invoice (fees receipt PDF already works)
- [ ] Plaid live-credential sandbox run + Dwolla webhook handler
- [ ] AR mirror of the new public docs (`content/docs-ar/finance*.mdx`)

## Verified Gap Register

All items below were verified against live code on 2026-05-21 (file:line cited). See per-sub-module `ISSUE.md` for finer detail.

### P0 -- correctness / data integrity

The block-level "P0: none" of prior cycles was inaccurate. These are silent-data-integrity issues:

- **3 of 6 domain posting functions are now wired; the other 3 are blocked on more than wiring.** Wired: `postFeePayment` (fees + Stripe/Tap webhooks), `postWalletTopup` (wallet top-up), and — 2026-06-20 — `postFeeAssignment` (`assignFee` + `bulkAssignFees`). Wiring assignment was a **correctness fix, not just coverage**: the accrual model recognizes revenue at assignment (DR Receivable / CR Revenue) and the payment post only clears the receivable (DR Cash / CR Receivable), so with payment wired but assignment not, the receivable was credited without ever being debited (driven negative) and revenue was never recognized. Still unwired, each blocked beyond wiring: **`postInvoicePayment`** — `UserInvoice` has no record-payment action (only the generic edit form + a `sentAt` stamp), so there is no payment event to hook; **`postExpensePayment`** — `approveExpense` only accepts `APPROVED`/`REJECTED` (never `PAID`), so no expense ever reaches a payment state; **`postSalaryPayment`** — the rule itself is unbalanced (below).
- **`createSalaryPaymentEntry` does not balance when tax > 0 (NEW P0).** It debits `gross + payroll-tax-expense` but credits only `net + tax-payable + ss-payable` (= gross), so debits exceed credits by the tax amount and `validateDoubleEntry` rejects it; it also has no line for generic "other deductions". This is why `postSalaryPayment` cannot simply be wired — the withholding model needs correcting and all payroll deductions mapped to contra/payable lines. (`posting-rules.test.ts` asserts only the no-withholding case for this reason.)
- **`toCents` ×100 ledger inflation — FIXED in code 2026-06-20 (`916327882`); DATA MIGRATION still pending.** The posting rules used to store `toCents(amount)` while `LedgerEntry.debit/credit` is `Decimal(12,2)` whole units. Read-side investigation confirmed whole-units is correct (Payment.amount is whole units; `banking/reconciliation` reads `LedgerEntry.debit` raw and compares to Payment sums; `fromCents` has zero callers; no reader divides by 100). `toCents` is dropped from all six rules and `posting-rules.test.ts` is green. **Remaining:** existing rows written by the live `postFeePayment` (Stripe/Tap) are still ×100, so the fix must NOT be deployed alone — ship it with a one-time migration that divides the inflated rows by 100. Scope the migration to **posting-rule-created** `LedgerEntry`/`AccountBalance` rows (`sourceModule IN fees,payroll,expenses,invoice,wallet`); manual journal entries were entered in whole units and must be excluded. **Migration script ready: `scripts/migrate-ledger-cents-to-whole-units.ts`** — DRY-RUN by default (`APPLY=1` to write, optional `SCHOOL_ID=`), divides in-scope rows by 100 and recomputes `AccountBalance` from the corrected ledger. NOT idempotent → run exactly once per env, Neon-branch-first + verify (every posted entry balances; reconciliation ledger ≈ payments). Approval-gated. **Deploy coupling: ship this migration together with `916327882` — do not push the code fix alone.**
- **`finance/content.tsx` + `salary/content.tsx` rendered amounts at 1/100 — FIXED 2026-06-20 (`5ad229722`).** They summed whole-unit data (`Payment.amount` Decimal(10,2); salary `baseSalary`) but formatted with the `÷100 formatCurrency`. Both swapped to `formatMoney`. These were the **only two** importers of the `÷100 formatCurrency`, so no genuinely-cents caller remains for that variant (candidate for deletion in a later cleanup).
- **`postFeePayment` is fire-and-forget with no rollback (by design).** On post failure it logs but does **not** roll back the recorded payment; the newly-wired `postFeeAssignment`/`postWalletTopup` follow the same deliberate pattern. The rollback/reconciliation story is tracked separately from wiring the posters.

### P1 -- functional / misleading

- **Dashboard trend charts are `Math.random()` mock data** (`dashboard/actions.ts:278-288` — `generateTrend()` for revenues/expenses/profit/collection). KPI totals are real DB aggregations; only the sparkline trends are fabricated.
- **Payroll tax is a hardcoded flat 15%** (`payroll/actions.ts:286` — `grossSalary * 0.15 // Simplified 15% tax rate`). No brackets, no per-country rules. (Prior doc claimed 0% — corrected.)
- **Invoice PDF not wired.** Infrastructure exists at `src/components/file/generate/invoice.tsx` but nothing in `finance/invoice/**` imports it. Contrast: the **fees receipt PDF is real** (`fees/receipt-pdf.tsx`, `@react-pdf/renderer`).
- **No finance Prisma model has a `lang` field.** DB-stored, user-facing finance text (`Fine.reason`, `Scholarship` name/description, `ExpenseCategory`, `ChartOfAccount` account names, `FeeStructure` name/description) renders English-only on the Arabic side. The rest of the platform uses the `lang` + `getText` convention; finance can't.
- **Test coverage: 11 of 14 sub-modules have zero tests** (see table below).
- **11 `validation.ts` factories are uncalled by their consumers** — Zod schemas exist but mutations don't run them; messages are still hardcoded English (`// TODO: add custom validation key`).

### P2 -- stubs / incomplete

- **`invoice/bulk-generate.tsx`** — fully stubbed ("Bulk invoice generation is currently unavailable"); blocked on the deleted `actions-enhanced.ts`. Needs reimplementation from the current schema.
- ~~`banking/reconciliation-panel.tsx`~~ — **REPLACED 2026-05-28** by Aldar P2.3. New live 3-column diff at `/finance/banking/reconciliation` and `/finance/accounts/reconciliation`. Persistence into `BankReconciliation` model deferred to v2; today's view computes live.
- **`banking/my-banks` Plaid sync** — stub (`"Bank sync is not yet implemented"`); needs live Plaid sandbox creds. Dwolla webhook handler missing.
- **`bankak` provider** (`src/lib/payment/providers/bankak.ts`) — intentional placeholder; `createCheckout` always returns `success:false` pending Bank of Khartoum API spec.
- **Refunds absent from the `PaymentProvider` interface.** It declares only `supportsCurrency` / `isConfigured` / `createCheckout` — no `verifyWebhook`, no `createRefund`. The only refund logic is Stripe **course-enrollment** refunds in `api/webhooks/stripe/route.ts`; there is no fee/invoice/wallet refund path (wallet refunds are manual journal entries).

### P3 -- backlog

- Recurring invoices · installment-plan UI for fees (schema exists) · expenses CSV bulk import · salary increment automation + salary history · payslip PDF + bank-file export · scheduled report exports + multi-currency conversion fix · wallet refund + low-balance alerts · audit log for permission changes · fee defaulters list.

### Stale entries removed this pass

Deleted references to files that no longer exist: `content-enhanced.tsx`, `invoice/onboarding/actions.ts`, `invoice/settings/actions.ts`. The `actions-enhanced.ts` items are reframed above as "blocked on deleted file — needs reimplementation" (P2) rather than open wiring tasks.

## Test Coverage

| Module                                                                                                   | Tests | Status                                                  |
| -------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------- |
| invoice                                                                                                  | 131   | passing (actions, util, validation, wizard, enrollment) |
| fees                                                                                                     | 13    | partial (actions: tenant URL, checkout)                 |
| lib/accounting                                                                                           | 10    | utils only -- NO debit=credit invariant test            |
| banking                                                                                                  | 5     | tenant-isolation only                                   |
| accounts, budget, dashboard, expenses, payroll, permissions, receipt, reports, salary, timesheet, wallet | 0     | none                                                    |

## Improvements & Optimizations

Forward-looking work beyond closing the gaps above.

- **Accounting integrity** — wire the 5 orphaned posting functions (or remove the false posting claims from sub-READMEs); make `postFeePayment` transactional with rollback; add a `debit = credit` invariant test plus a per-school trial-balance test.
- **Remove mock data** — replace the dashboard `Math.random()` trends with real historical aggregation off the ledger / payment tables.
- **Payments interface** — add `verifyWebhook` + `createRefund` to `PaymentProvider`; generalize the Stripe-only refund to fees/invoice/wallet; finish `bankak` once the BoK spec lands.
- **i18n migration** — add `lang` to `FeeStructure`, `Scholarship`, `ExpenseCategory`, `ChartOfAccount`, `Fine`; route display through `getText` / `getFields`; wire the 11 `validation.ts` factories to `ValidationHelper`.
- **Code-reuse / perf** — consolidate the duplicated DataTable + columns + list-params patterns across sub-modules; audit N+1 in dashboard and report aggregations; verify the Decimal whole-units-vs-cents convention per model against `lib/format.ts` (`formatMoney` vs `formatCurrency`) to prevent off-by-100 bugs.
- **PDF** — wire the invoice PDF (map `UserInvoice` fields to the `file/generate/invoice.tsx` template + add a download button); add payslip PDF for payroll.
- **Testing** — cover the 11 untested sub-modules, money-movers first (payroll, expenses, wallet, then the others).

## Sub-module Ship Issues

- [ ] [Accounts](./accounts/ISSUE.md)
- [ ] [Banking](./banking/ISSUE.md)
- [ ] [Budget](./budget/ISSUE.md)
- [ ] [Dashboard](./dashboard/ISSUE.md)
- [ ] [Expenses](./expenses/ISSUE.md)
- [ ] [Fees](./fees/ISSUE.md)
- [ ] [Invoice](./invoice/ISSUE.md)
- [ ] [Payroll](./payroll/ISSUE.md)
- [ ] [Permissions](./permissions/ISSUE.md)
- [ ] [Receipt](./receipt/ISSUE.md)
- [ ] [Reports](./reports/ISSUE.md)
- [ ] [Salary](./salary/ISSUE.md)
- [ ] [Timesheet](./timesheet/ISSUE.md)
- [ ] [Wallet](./wallet/ISSUE.md)

> Note: where a sub-module README still claims it posts journal entries (salary, payroll, invoice, expenses, wallet), that is captured in P0 above; correcting each sub-README is a tracked follow-up, not done this docs pass.

## Recent Work (2026-06-13 — Admission+Finance production-readiness pass)

### Schema

- `InvoiceStatus` extended with `PARTIAL` — tracks invoices partially paid via multi-installment allocation.
- `UserInvoice` gains `amountPaid` (Decimal) + `sentAt` (DateTime) — enables partial-payment tracking + email audit trail.
- Indexes added: `invoices(schoolId)`, `AdmissionInquiry(convertedToApplicationId)`, `ApplicationSession(convertedToApplicationId)`.
- Prisma model files renamed: `finance-fees.prisma` → `fees.prisma`, `finance-invoices.prisma` → `invoices.prisma`, etc. (bare names, no `finance-` prefix). Migration of record: `prisma/migrations/20260612200000_invoice_partial_payment_and_indexes`.

### 4-Level Fee Inheritance (owner's core spec)

The fee system now enforces a strict four-level cascade:

1. **Level 1 — Onboarding auto-provision**: when a school completes the pricing step, fee structures are automatically provisioned per-grade (one FeeStructure per grade per fee type). Zero manual setup required.
2. **Level 2 — Per-grade fine-tune**: ADMIN/ACCOUNTANT edits a grade's FeeStructure (amount, due date, installment plan). Applies to new assignments only.
3. **Level 3 — `propagateFeeStructureChange` cascade**: when a grade-level structure is edited, the action cascades the change to all existing uncollected `FeeAssignment` rows for students in that grade — preserving any per-student discount that was already set. Collected assignments are never touched.
4. **Level 4 — `updateFeeAssignmentDiscount` per-student fine-tune**: ADMIN/ACCOUNTANT adjusts a specific student's discount (amount or %) without touching the grade structure or other students.

### Invoice

- Access scoping fixed: ADMIN and ACCOUNTANT now see all invoices for their school (school-wide), not just their own user's invoices. STUDENT/GUARDIAN see only their own.
- OVERDUE status mirrored from fee-overdue cron to `UserInvoice` — invoice list reflects late payments without manual refresh.
- `amountPaid` + `PARTIAL` status surfaced in the invoice detail view and list columns.
- `sendInvoiceEmail` action: sender address fixed (no longer hardcoded `onboarding@resend.dev`), action-button URL is now absolute.
- Linked payments displayed in the invoice detail panel.

### Fees

- `createFeePaymentCheckout` is gateway-aware: AED-currency schools are routed to Tap; others remain Stripe-default.
- Currency snapshot recorded on `FeeAssignment` at creation time.
- Fee-overdue cron (`/api/cron/fee-overdue`) is now per-tenant (iterates all schools, not just one).

### Receipts

- Receipt PDF route (`/api/payment/[paymentId]/receipt`) is status-guarded (PAID/CLEARED only), i18n-ready, includes school name + currency.
- My-fees receipt link wired — students/guardians can download receipts directly from `/finance/fees/my`.
- Expense-receipt upload `FormData` mismatch fixed.

### Reminders / Crons

- New `/api/cron/fee-due` (daily): fires upcoming-due + offer-expiry reminder notifications per tenant.
- Fee-overdue cron: mirrors OVERDUE to `UserInvoice` rows; per-channel preference enforced for bulk dispatch.
- Direct-email path added for guest applicants (no account yet).
- New `/api/cron/process-document-jobs` (`*/10`): runs the AI document-extraction queue.

### Deferred (open)

- True server-side search on merit/enrollment tables (currently per-page client filter).
- Issue #269: fee-structure-creation-as-modal UX.
- Onboarding re-provision on tuition-change (Level 1 only fires once today).
- `application-status-banner-client.tsx` + `INQUIRY_SOURCES`/`DEFAULT_GRADES` i18n migration.
- `payment/content.tsx` dead-file cleanup.
- True PARTIAL → PAID transition from `recordPayment` edge cases.

## Recent Work (2026-05-28 — Aldar UAE P0+P1+P2+P3, see [#356](https://github.com/databayt/hogwarts/issues/356))

- **P0 demo-able** — `formatCurrency` big-bang (currency required across ~30 files), Stripe wallet auto-unlock, parent-side gateway picker on fee assignment page, Aldar demo seed (`pnpm db:seed:aldar`).
- **P1 production gates** — currency snapshot columns on Payment + Fee tables (live + backfilled), Tap webhook fails-closed on missing secret, `Payment.gatewayMethod` preserves Tap source provenance, `PaymentMethod` enum extended (APPLE_PAY/GOOGLE_PAY/MADA/KNET/ATM_DEPOSIT), server-side payment receipt PDF at `/api/payment/[paymentId]/receipt`.
- **P2 feature parity** — `PaymentStatus.PENDING_VERIFICATION` + offline-payment capture fields (depositSlipUrl/bankBranch/IBAN), `markPaymentCleared` server action with `$transaction`-wrapped status flip + ledger post + invoice sync + notifications, ATM-deposit form variant, reconciliation report (Payments / Gateway / Ledger 3-column diff), branded receipt PDF (school logo + signature).
- **P3 polish** — 5 Stripe webhook events added (subscription updated/deleted, invoice.payment_failed, payment_intent.succeeded/failed — the succeeded handler retroactively enriches `Payment.gatewayMethod` with the wallet identity), Tap webhook FAILED/DECLINED dispatches retry notification, sidebar reconciliation links thread `/${locale}` prefix, payment-method names localized en + ar.
- Migration records at `prisma/migrations/20260528000000_aldar_payment_p1/` and `20260528010000_aldar_payment_p2/`.

## Recent Work (2026-05-21)

- Documentation overhaul: public `/docs/finance` hub + 14 sub-block pages (EN); README matrix reconciled; this ISSUE.md rebuilt as the verified gap register with an Improvements & Optimizations section.
- Verified (file:line) the orphaned-posting P0, dashboard mock trends, payroll flat-15% tax, fee-payment fire-and-forget posting.

## Recent Work (2026-04-20, prior cycle)

- Locale-aware currency + date formatting across 16 sites; 24 orphan AR dictionary keys added; error-code pattern + client ERROR_MAP in banking/invoice/receipt/fees/payroll; dictionary-driven notifications; `finance/CLAUDE.md` created.

## Smoke Test Results (2026-04-20, prior cycle — demo.databayt.org as `accountant@databayt.org`)

| Module                                                                                | AR  | EN  | Finding                                                                                     |
| ------------------------------------------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------------------- |
| dashboard                                                                             | ✅  | ✅  | KPI cards + charts render; AR uses `ر.س` (SAR) auto-formatted from `ar-SA` locale           |
| invoice                                                                               | ✅  | ✅  | Arabic columns/placeholders; `View` button + `No results.` copy not translated              |
| fees (overview)                                                                       | ⚠️  | ✅  | AR renders main tabs + KPI; secondary cards hardcoded English                               |
| fees/fines                                                                            | ⚠️  | ✅  | AR table + statuses translated; fine type enum badges + DB-stored reason text still English |
| banking                                                                               | ✅  | ✅  | Empty-state localized; dashboard widget renders                                             |
| salary                                                                                | ✅  | ✅  | 6 tabs localized, currency formatter works with Arabic numerals                             |
| accounts, budget, expenses, payroll, permissions, receipt, reports, timesheet, wallet | —   | —   | Not smoke-tested this pass -- queued for next cycle                                         |

## Dependencies

- Next.js 16, React 19, Prisma 6, TypeScript 5
- Stripe (@stripe/stripe-js, stripe server SDK)
- Plaid (plaid + react-plaid-link)
- @react-pdf/renderer (fees receipt PDF wired; invoice PDF not yet)
- date-fns (with ar/enUS locales)
- resend (invoice email)
- nuqs (URL state for DataTables)

## Acceptance Criteria

Every sub-module must:

1. Use `getTenantContext()` for `schoolId` (never raw session)
2. Check RBAC via `checkCurrentUserPermission()` for mutations
3. Return `ActionResponse<T>` via `actionError(ACTION_ERRORS.*)` -- no hardcoded English
4. Wrap multi-record writes in `db.$transaction`
5. Support Arabic + English through `getDictionary(lang)`
6. Accept `currency` (from `School.currency`) and `lang` props for all money/date rendering
