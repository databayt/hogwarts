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

> Last updated: 2026-07-19 (security + money-integrity pass) · 14 sub-modules

## Recent Work (2026-07-19 — finance+management security & ledger-integrity pass)

Four-agent audit (money-paths, authz, management blocks, i18n/nav) followed by
fix waves. Commit `1e4660a58` + follow-up. Verified: tsc 0, finance+school
suites green.

### Security (P0/P1, all fixed)

- **`lib/accounting/actions.ts` is no longer `"use server"`.** All 12 exports
  were public POST endpoints taking caller-supplied `schoolId` with only an
  any-session check — a cross-tenant ledger read/write vector. Now an internal
  `server-only` module (webhooks still post session-less via `actorUserId`
  sentinels); the 6 dead duplicate exports were deleted. The trust model is
  documented in the file header: callers pass a schoolId they already verified.
- **`banking/actions/bank.actions.ts`** — `getAccounts`/`getAccount`/
  `syncTransactions` had ZERO auth and returned the Plaid `accessToken`;
  `getAccount` additionally sat behind a cross-user `unstable_cache`. Now
  session+ownership scoped, `omit: { accessToken: true }` everywhere, cache
  removed. Side effect fixed: `getAccounts` now returns the `{success, data}`
  shape `banking/dashboard/content.tsx` always expected — the banking
  dashboard had been permanently rendering its empty state. Dead
  `transfer.actions.ts`/`transaction.actions.ts` (unsafe, zero importers)
  deleted.
- **Receipt AI** (`receipt/ai/extract-receipt-data.ts`) de-servered — paid
  Claude OCR with client-supplied schoolId is internal-only now. Receipt
  actions gained owner-or-`receipt/*` permission gates (list self-scopes for
  non-privileged callers).
- **Module-permission gates threaded through every previously-open module**:
  salary (all 14 actions), timesheet (incl. `approveTimesheet`), budget,
  wallet, accounts (manual journal entry create/post!), finance reports
  (balance sheet / P&L / trial balance), finance dashboard stats, payroll
  reads + `deletePayrollRun`, fees `fetchXRows` table fetchers, expenses
  (owner-or-edit + self-scoped list). Payslip reads are owner-or-payroll/view.
- **`/finance` hub gated** as reports-grade data (`resolveFinanceAccess("reports")`)
  — it aggregated school-wide revenue/expense/payroll totals for every role.
- **`/finance/permissions` route created** — the 854-line grant/revoke console
  existed with no page; granular STAFF/TEACHER grants were unreachable.
- `banking/reconciliation` checked the wrong module (`"fees"` → `"banking"`).

### Ledger integrity (new money paths wired)

- **Fines now post**: `payFine` → `postFinePayment` → DR Cash / CR Other
  Revenue (`fine:<id>` idempotency key); double-pay guarded (`isPaid` check).
  Previously a live UI path collected real cash with zero ledger trace.
- **Discount drift closed**: `applyScholarship` and the early-payment discount
  in `recordPayment` reduce `finalAmount` AFTER `postFeeAssignment` posted the
  pre-discount receivable — the ledger's AR was permanently overstated. Both
  now post `postFeeAdjustment` → DR Student Fees Revenue / CR Student Fees
  Receivable with unique refs (`feeadj:scholarship:<sch>:<fa>`,
  `feeadj:earlybird:<fa>`). New posting rules + balance unit tests.
- **Stripe reconciliation column fixed**: `banking/reconciliation` read
  `payload["amount"]` off the raw Stripe Event envelope (field doesn't exist)
  → every Stripe payment showed as a discrepancy. Now reads
  `data.object.amount_total` (cents→units) for `fee_payment` sessions only.

### Status changes vs the 2026-07-17 matrix

- **payroll: ledger REACHABLE** since `b6b85685d` (2026-07-19) — "Disburse
  Salaries" on `runs/[id]` fires `processPayments` → `postSalaryPayment`.
  Payslip view + PDF exist (`/finance/payroll/my`, `/slips/[id]`).
- **wallet: still UNREACHABLE** — `wallet/new` remains a (now-localized)
  coming-soon stub; `topupWallet` has no UI caller. `refundWallet` additionally
  has NO posting rule (would desync cash if ever wired) — do not wire it
  without adding one.
- **Fine/scholarship/earlybird money events: WIRED** (see above).
- Purchases (`purchase-invoice.ts`) remain intentionally unposted (needs a
  DR Cash / CR Revenue point-of-sale rule — still open).

### Still open after this pass

- `refundWallet` posting rule + a general refund write-path (Refund model +
  validation exist; zero server actions create a Refund row).
- Purchase (course/catalog/video) DR Cash / CR Revenue posting rule.
- Overtime PAY: hours aggregate onto slips but `overtime` earnings is
  hardcoded 0; `OVERTIME_MULTIPLIERS` config is dead. Needs a policy decision.
- `checkFinancePermission` short-circuits ADMIN/ACCOUNTANT/DEVELOPER before
  the FinancePermission table — partial _restriction_ of an accountant is
  architecturally impossible (grants for STAFF/TEACHER work fine).
- STAFF policy inconsistency: `canSeeAllSchoolInvoices` includes STAFF;
  `FINANCE_ADMIN_ROLES` does not.
- Reconciliation ledger column is still pro-rata allocated across sources
  (needs `Payment.journalEntryId` per-row mapping — field exists).
- i18n: hardcoded `metadata` titles being converted block-wide to
  `generateMetadata` (2026-07-19); breadcrumbs render raw URL segments on /ar
  platform-wide (no `platform.breadcrumb` dictionary namespace exists); crons
  (`fee-due`, `fee-overdue`) still use `isAr ?` ternaries.
  > This file is the **engineering source of truth** for finance readiness. The public-facing mirror is `/docs/finance` (hub) + a page per sub-block. The hub's status matrix and `README.md`'s matrix are kept identical to the banner below.
  >
  > **Aldar UAE payment readiness:** consolidated trace lives at [hogwarts#356](https://github.com/databayt/hogwarts/issues/356) — payment-method enum extended (APPLE_PAY/GOOGLE_PAY/MADA/KNET/ATM_DEPOSIT), `PENDING_VERIFICATION` flow, currency snapshot on Payment/FeeAssignment/FeeStructure/Receipt, reconciliation report live at `/finance/banking/reconciliation`, server-side receipt PDF.

## Status banner

| Sub-module  | Readiness | Ledger wired                                    | i18n | Tests  | Docs |
| ----------- | --------- | ----------------------------------------------- | ---- | ------ | ---- |
| invoice     | 95%       | 🟡 `postInvoicePayment` wired (markInvoicePaid) | ⚠️   | 🟢 131 | ✅   |
| fees        | 96%       | 🟢 payments + assignments (no rollback)         | ✅   | 🟡 17+ | ✅   |
| budget      | 85%       | ➖ n/a                                          | ✅   | ❌     | ✅   |
| receipt     | 90%       | ➖ n/a                                          | ✅   | ❌     | ✅   |
| banking     | 85%       | 🔗 reconciliation live                          | ⚠️   | 🟡 5   | ✅   |
| dashboard   | 80%       | ➖ n/a (trends are mock)                        | ✅   | ❌     | ✅   |
| expenses    | 80%       | 🟡 `postExpensePayment` wired (markExpensePaid) | ⚠️   | ❌     | ✅   |
| accounts    | 75%       | 🟢 engine home (fee payments only)              | ⚠️   | 🟡 10  | ✅   |
| permissions | 75%       | ➖ n/a                                          | ⚠️   | ❌     | ✅   |
| reports     | 75%       | 🔗 reads ledger (fee-only data)                 | ⚠️   | ❌     | ✅   |
| salary      | 75%       | ➖ n/a                                          | ✅   | ❌     | ✅   |
| timesheet   | 75%       | ➖ n/a                                          | ⚠️   | ❌     | ✅   |
| wallet      | 75%       | 🟡 `postWalletTopup` wired (no rollback)        | ⚠️   | ❌     | ✅   |
| payroll     | 65%       | 🟡 `postSalaryPayment` wired (processPayments)  | ✅   | ❌     | ✅   |

Legend — **Ledger**: 🟢 posts journal entries · 🟡 posts but not transactional · ❌ posting fn exists but has zero callers · 🔗 consumes the ledger · ➖ not a money-mover. **i18n**: ✅ ready · ⚠️ validation strings still hardcoded English (separate from the cross-cutting DB-`lang` gap below). **Tests**: 🟢 strong · 🟡 partial · ❌ none.

**Overall ≈ 88%** (average of the readiness column after the 2026-06-13 admission+finance production-readiness pass).

## MVP Checklist

- [x] Currency driven by `School.currency` everywhere -- no `$` or `SDG` hardcodes
- [x] All `date-fns format()` calls pass locale from `date-fns/locale`
- [x] Server actions use `actionError(ACTION_ERRORS.*)` + client `ERROR_MAP`
- [x] Notification dispatch uses `finance.notifications.*` keys (no bilingual ternaries)
- [x] Locale-aware formatters in `lib/format.ts`
- [x] Public docs: hub + per-sub-block pages (`/docs/finance`, EN) — 2026-05-21
- [x] All 6 ledger posters wired — feePayment, feeAssignment, walletTopup, invoicePayment (markInvoicePaid), expensePayment (markExpensePaid), salaryPayment (processPayments)
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

- ✅ **All 6 domain posting functions are now wired (2026-06-21).** `postFeePayment` (fees + Stripe/Tap), `postFeeAssignment` (`assignFee`/`bulkAssignFees` — the accrual fix that stopped the receivable going negative), `postWalletTopup` (wallet), `postInvoicePayment` (`markInvoicePaid` → DR Cash / CR Accounts Receivable), `postExpensePayment` (`markExpensePaid` → DR expense / CR cash), and `postSalaryPayment` (`processPayments` disbursement → DR Salary Expense / CR Cash + Tax/SS/AP). The double-entry ledger now reflects every finance money event. Note: invoice partial-payment-to-ledger is a follow-up (the ledger keys on invoice id, so partials need a per-payment ref). The expense list (`expenses/all`) now surfaces Approve/Reject + Mark-paid via `ExpenseRowActions`, so `markExpensePaid` + `approveExpense` are reachable (both gated by `expenses/approve`).
- ✅ **Second adversarial review pass (2026-06-21).** A follow-up multi-agent review of the whole session diff confirmed 8 defects (5 finance), all fixed: **(P0)** `reverseJournalEntry` silently no-op'd — passing the original entry's `sourceRecordId` made the new idempotency guard match the ORIGINAL and return it without posting the offsetting lines; now keyed on `reversal:${id}` (balanced AND idempotent). **(P1)** a negative `netSalary` (deductions > gross−tax) posted a NEGATIVE Cash credit that inverted the balance update and inflated Cash — `createSalaryPaymentEntry` now clamps `netAmount` to ≥0 so the over-deduction flows into Accounts Payable and the entry stays balanced. **(P2)** `processPayments` flipped the run to terminal PAID _before_ posting the ledger, so a crash/timeout mid-loop was unrecoverable (retry blocked by the APPROVED guard) — ledger posting now runs BEFORE the atomic gate flip (idempotent on retry); notifications moved to the winner only. **(P2)** `markInvoicePaid` computed `remaining` from a pre-lock snapshot — a concurrent webhook partial-payment could over-post; the read + flip are now in one `$transaction` that recomputes `remaining` from a fresh read.
- ✅ **Adversarial review hardening (2026-06-21 `e9c5d36ca`).** A multi-agent review of the session's finance diff confirmed 12 defects, all fixed: `schoolId` added to the `markInvoicePaid`/`sendInvoiceEmail` updates (P0 multi-tenant); concurrent double-post races closed via conditional updates in `markInvoicePaid`/`markExpensePaid`/`processPayments` **plus a DB-enforced `@@unique([schoolId, sourceModule, sourceRecordId])` on `JournalEntry`** + a P2002 idempotent-replay catch in `createJournalEntry`; `generateSalarySlips` now taxes the taxable base (was gross); `markInvoicePaid` posts the remaining balance + respects prior partial payments; `markExpensePaid` gated by `expenses/approve`; the 4 dashboard stat cards fixed (`dashboard-components.formatCurrency` no longer ÷100); RTL discount sign via `Intl`. **Migration LIVE on prod (2026-06-21):** the `@@unique` on JournalEntry was applied Neon-branch-first (tested on `br-jolly-block-adtzmbb3`, promoted to prod; old `_idx` dropped, `_key` unique created; 0 duplicate rows, 200 rows unchanged). No longer deploy-pending.
- ✅ **`createSalaryPaymentEntry` rebalanced (was a NEW P0; fixed 2026-06-21 `771166fc7`).** Removed the bogus standalone payroll-tax-expense debit. Now: DR Salary Expense (gross), CR Cash (net), CR Tax Payable / CR Social Security Payable (if any), CR Accounts Payable for the residual (gross − net − tax − ss). The residual line makes it balance for any deduction mix (insurance, loans, …). Unit-tested (withholding case asserts balance + no payroll-tax-expense line).
- **`toCents` ×100 ledger inflation — FIXED in code (`916327882`); migration validated as a NO-OP safety net 2026-06-20.** The posting rules stored `toCents(amount)` while `LedgerEntry` is `Decimal(12,2)` whole units. Whole-units confirmed correct (Payment.amount is whole units; `banking/reconciliation` reads `LedgerEntry.debit` raw vs Payment sums; `fromCents` unused; no reader ÷100). `toCents` dropped from all six rules; `posting-rules.test.ts` green. **Prod check (square-hall-52214783, read-only): all 200 journal entries are SEEDED whole-unit demo data (`sourceRecordId=NULL`, no matching Payment, values like 45,686 fees / 146,371 salaries) — ZERO toCents-inflated rows.** They were created directly, not by the posting rules. So the code fix is **safe to deploy on its own**. `scripts/migrate-ledger-cents-to-whole-units.ts` is now **self-verifying + fees-scoped** (deflates only fee entries whose cash leg == `Payment.amount`×100; idempotent; physically cannot touch seeded data) — its DRY-RUN against prod reports "nothing in scope" for all 7 schools. Run it post-deploy only to sweep any real fee payment that posted through the old code in the pre-deploy window (expected no-op); Neon-branch-first per the script header.
- **`finance/content.tsx` + `salary/content.tsx` rendered amounts at 1/100 — FIXED 2026-06-20 (`5ad229722`).** They summed whole-unit data (`Payment.amount` Decimal(10,2); salary `baseSalary`) but formatted with the `÷100 formatCurrency`. Both swapped to `formatMoney`. These were the **only two** importers of the `÷100 formatCurrency`, so no genuinely-cents caller remains for that variant (candidate for deletion in a later cleanup).
- **`postFeePayment` is fire-and-forget with no rollback (by design).** On post failure it logs but does **not** roll back the recorded payment; the newly-wired `postFeeAssignment`/`postWalletTopup` follow the same deliberate pattern. The rollback/reconciliation story is tracked separately from wiring the posters.

### P1 -- functional / misleading

- **Dashboard trend charts are `Math.random()` mock data** (`dashboard/actions.ts:278-288` — `generateTrend()` for revenues/expenses/profit/collection). KPI totals are real DB aggregations; only the sparkline trends are fabricated.
- ✅ **Payroll tax now uses progressive brackets** (2026-06-20 `e637129ee`) — a marginal `calculateProgressiveTax` over `payroll/config.TAX_BRACKETS` replaces the flat 15% in both `payroll/actions.ts` and `salary/actions.ts`; unit-tested. Follow-up: payroll taxes gross incl. non-taxable allowances (salary correctly taxes taxableIncome); `SOCIAL_SECURITY_RATE` still unused.
- ✅ **Invoice PDF + branded RTL email — DONE (2026-06-21 `eb4e88574`).** Adapter + Download button were already wired; added the school logo into the PDF (`getInvoiceById` → `InvoiceForPdf` → adapter → template) and rebuilt the email on `@react-email/components` (RTL, logo/name header, itemized table, signature footer, en/ar labels). Remaining polish: Print button, DataTable row PDF action, PDF-footer signature.
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

## Recent Work (2026-07-19 — ship-readiness audit: routes, i18n, seed, UI)

Full-block audit ahead of first client use (routes crawled EN as admin against
the local demo; i18n + seed audited by agents; fixes browser-verified).
Complements the same-day security pass above. tsc 0; i18n suite 276 passed
(the 2 ratchet fails are `/documents` + `/exams/new`, outside finance).

### Route health (fixed)

- **`/finance/receipt` crashed** into the finance error boundary — Prisma
  `Decimal` `transactionAmount` serializes to a string across the RSC
  boundary, then `receipt-card` called `.toFixed()` on it. `getReceipts`/
  `getReceiptById` now normalize via `toClientReceipt()`. Page renders all
  seeded receipts.
- **`/finance/banking/payment-transfer` was dead on load** — `form.tsx`
  wrapped `AccountSelect` in a MODULE-LEVEL `useMemo` (invalid hook call at
  import time). Now a plain function component; route renders.
- **Every finance route showed "Settings" as its page H1** (dashboard,
  receipt, wallet… any segment without its own deeper `PageHeadingSetter`) —
  `finance/layout.tsx` read `dictionary.school.settings` ("uses settings
  dictionary for now"). Now reads `finance.title` (Finance/المالية).

### Dashboard correctness (`dashboard/actions.ts` rewritten to DB aggregation)

- `getCachedDashboardData` fetched RAW ROWS (all invoices + students-with-
  assignments-with-payments…) → ~6.7MB payload, over `unstable_cache`'s 2MB
  limit → unhandled rejection spam on every load + no caching. Now 12
  aggregate/groupBy queries; Decimals converted to numbers INSIDE the cached
  fn (cache-hit revival returns strings otherwise).
- **Fee metrics could never match**: filter was `academicYear:
new Date().getFullYear().toString()` (`"2026"`) while data stores
  `"YYYY-YYYY"`. Now resolved from latest `SchoolYear.yearName` (same rule as
  fee-provisioning).
- `FinanceDashboardContent` gates via `resolveFinanceAccess("reports")` and
  renders `FinanceAccessDenied` instead of throwing into the error boundary;
  `getRecentTransactions` takes `lang` and no longer server-builds the
  English "Fee payment from X" sentence / "Student Fees" category.

### i18n (agent audit: 2,467-key EN/AR parity = 100%; fixes applied)

- `en/finance.json` `common.delete` was literally `"حذف"` → `"Delete"`.
- `createFeeStructure` returned raw joined English Zod messages as `error`
  (and `fees/form.tsx` toasted it verbatim in both locales) → returns
  `ACTION_ERRORS.VALIDATION_ERROR`; form maps codes, never raw.
- Raw enum table cells now use the same translated maps as their filters:
  fees `payment-columns` (method + status), `assignment-columns` (status).
- `fees/drift-banner.tsx` had zero dictionary wiring → new `finance.feeDrift`
  group (EN+AR), `<bdi>` around values.
- `banking/transaction-history/table.tsx`: content passed the WHOLE
  dictionary while the table read flat keys — every lookup silently fell back
  to English. Now receives the `bankingTransactions` slice + 10 leftover
  literals wired (export menu, pagination, "All Accounts", aria labels).
- `banking/payment-transfer/form.tsx` rendered the server's raw English
  `error.message` → maps `error.code` to new `banking.transferError*` keys
  (EN+AR); initial empty-code state no longer shows a phantom error alert.
- `receipt/table.tsx` + `invoice/dashboard/data-table.tsx` empty/pagination
  strings wired (`receiptPage.*`, `finance.common.noResults`).
- Section dashboards (wallet, expenses, budget, payroll) formatted money with
  DEFAULT `"USD"`/en-US — now thread `School.currency` + locale (SDG renders
  correctly; was `$` on all four).

### Seed

- **New `prisma/seeds/wallet.ts`** — wallet was the only finance module with
  ZERO seed (all 5 routes empty): school wallet + 30 student wallets + ~140
  Arabic-description transactions with coherent running balances; idempotent
  count-guard; registered as `db:seed:single wallet` and in the main walk
  after Banking. Verified locally: 31 wallets / 140 txns / SDG.
- Seed-audit findings (agent, documented for follow-up): dashboard month
  window shows zeros against stale seed dates (payments 2024, payroll runs 2025) — real schools entering live data are unaffected; 876 current-year
  PAID `FeeAssignment`s have no Payment trail (seed `take: 600` without
  `orderBy` exhausts on 2024-2025); `ensure-demo` fast path never verifies
  finance tables.

### Still open after this pass

- ChartOfAccount / JournalEntry / seeded DB content renders English on /ar —
  finance models still lack `lang` + localize() routing (long-standing P1).
- `banking/transaction-history` shows a raw `getAccounts` result regression
  risk if shapes change again — covered by the security pass's shape fix.
- Ratchet fails on `/documents` + `/exams/new` (other blocks' sessions).
- Local-only noise: stray FY 2026-2027 fiscal year + 6k `ENR-` invoice burst
  in the local DB are test artifacts, not prod state.

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
