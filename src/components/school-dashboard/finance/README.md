---
epic: 01
sprint: Q3-2026
title: Finance (school dashboard)
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 79
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-05-25
---

## Finance Block -- Comprehensive School Finance Management

### Overview

The Finance Block is a feature-based financial management system for multi-tenant school operations. It implements double-entry bookkeeping with **14 specialized sub-modules** covering invoicing, fees, payroll, budgeting, banking, and more. All modules enforce `schoolId` scoping for tenant isolation.

~45k LOC total. Currency per-school via `School.currency`. Locale-aware formatting via `finance/lib/format.ts`. Server-side notifications dispatch through school's `preferredLanguage` dictionary.

### Honest Status Matrix

This matrix is the readiness view, mirrored in `ISSUE.md` and at `/docs/finance`. The **Ledger** column is the key honesty signal — it now tracks whether a money event can actually _reach_ the ledger from the UI, not merely whether a posting function has a caller.

> **2026-07-19 — security + ledger-integrity pass (see `ISSUE.md` for the full
> record).** Supersedes parts of the 07-17 banner below: **payroll's ledger is
> now REACHABLE** (Disburse Salaries on `runs/[id]` → `processPayments` →
> `postSalaryPayment`; payslip view + PDF exist), **fines and
> scholarship/early-payment discounts now post** (new
> `createFinePaymentEntry` / `createFeeAdjustmentEntry` rules), and the whole
> block's actions are permission-gated (`requireFinanceActor` /
> `checkFinancePermission` threaded through salary, timesheet, budget, wallet,
> accounts, reports, dashboard, payroll, fees fetchers, expenses, receipt,
> banking — `lib/accounting/actions.ts` is no longer a public "use server"
> surface). `/finance/permissions` finally has a route. **Wallet remains the
> one unreachable money path** (`wallet/new` is a stub; `refundWallet` also
> has no posting rule — do not wire it without one).

> **2026-07-17 — this matrix was wrong in three directions. Verify before trusting it.**
>
> 1. It rated salary/payroll i18n "✅" while their nav bars, headings and `metadata.title` were
>    hardcoded English, and `PayrollStatus`/`SlipStatus`/`PayFrequency` rendered as raw enums.
> 2. It said nothing about RBAC — yet **27 of the block's 30 db-querying `page.tsx` files had no
>    permission gate at all**, so any authenticated student could read the balance sheet, P&L,
>    trial balance, general ledger, and the full staff payroll. Fixed 2026-07-17; see `guard.ts`.
> 3. Its **"❌ orphaned" ledger markers were stale** — every posting function has had a real caller
>    since 2026-06-21 (`ISSUE.md` line 71 records it; this file was never updated). But `ISSUE.md`'s
>    "all 6 wired" is **also** misleading, for the reason below.
>
> **What matters is reachability, not whether a caller exists.** `postSalaryPayment` is called by
> `processPayments`, and `postWalletTopup` by `topupWallet` — but **nothing calls those two actions**:
> no UI, no cron, no API route. `/finance/payroll/disbursement` and `/finance/payroll/process` are
> **404 — never built**, and `/finance/wallet/new` is a "coming soon" stub. So payroll and wallet money
> **never reaches the ledger**: the general ledger, balance sheet, P&L and trial balance omit salary
> expense entirely — the largest cost a school has. `scripts/migrate-ledger-cents-to-whole-units.ts`
> independently observed the same thing ("postWalletTopup is wired but has produced no rows").
>
> The **Nav** column is the honest signal for salary/payroll: their navigation advertised 35 routes
> with **no component behind them** — and that unbuilt disbursement UI is _why_ payroll's ledger
> posting is dead. The two failures share one root cause.

| Sub-module  | Readiness | Ledger wired                        | Nav            | i18n | Tests  | Docs |
| ----------- | --------- | ----------------------------------- | -------------- | ---- | ------ | ---- |
| invoice     | 90%       | 🟢 `markInvoicePaid` → posts        | ✅ all resolve | 🟢   | 🟢 153 | ✅   |
| fees        | 85%       | 🟢 payment + assignment (no rollbk) | ✅ all resolve | ✅   | 🟡 13  | ✅   |
| budget      | 85%       | ➖ n/a                              | ✅ all resolve | ✅   | ❌     | ✅   |
| receipt     | 85%       | ➖ n/a                              | ✅ all resolve | ✅   | ❌     | ✅   |
| banking     | 80%       | ➖ n/a                              | ✅ all resolve | ⚠️   | 🟡 5   | ✅   |
| dashboard   | 80%       | ➖ n/a (trends are mock)            | ✅ all resolve | ✅   | ❌     | ✅   |
| expenses    | 80%       | 🟢 `markExpensePaid` → posts        | ✅ all resolve | ⚠️   | ❌     | ✅   |
| accounts    | 75%       | 🟢 engine home                      | ✅ all resolve | ⚠️   | 🟡 10  | ✅   |
| permissions | 75%       | ➖ n/a                              | ➖             | ⚠️   | ❌     | ✅   |
| reports     | 75%       | 🔗 reads ledger (no salary/wallet)  | ✅ all resolve | ⚠️   | ❌     | ✅   |
| timesheet   | 75%       | ➖ n/a                              | ✅ all resolve | ⚠️   | ❌     | ✅   |
| wallet      | 75%       | 🔴 wired but UNREACHABLE            | ✅ all resolve | ⚠️   | ❌     | ✅   |
| salary      | 55%       | ➖ n/a                              | ✅ 2 real tabs | 🟢   | 🟡     | ✅   |
| payroll     | 70%       | 🟢 disburse → posts (2026-07-19)    | ✅ 2 real tabs | 🟢   | 🟡     | ✅   |

Legend -- **Ledger**: 🟢 reaches the ledger from the UI · 🔴 posting fn is wired to an action nothing can invoke · 🔗 consumes ledger · ➖ not a money-mover. **Nav**: ✅ every link resolves · 🔴 most advertised routes don't exist (now rendered disabled + "coming soon"). **i18n**: 🟢 verified in a browser on /ar · ✅ believed ready · ⚠️ validation strings still hardcoded English. **Tests**: 🟢 strong · 🟡 partial · ❌ none.

**salary/payroll readiness was restated 75%/65% → 40%/35%.** Nothing regressed; the old numbers
counted a navigation shell as a feature. What actually exists: payroll = one runs list (+detail,
+create stub); salary = one structures list (+detail, +create stub). Slips, processing, approval,
disbursement, tax settings, allowances, deductions, calculator, increments, advances and every
salary/payroll report are **unbuilt** — there is no component for any of them, and an employee has
**no way to see their own payslip**.

> **i18n caveat:** the i18n column tracks UI/validation strings only. Separately, **no finance Prisma model has a `lang` field**, so DB-stored finance text (`Fine.reason`, `Scholarship` / `ExpenseCategory` / `ChartOfAccount` names, `FeeStructure` name/description) can't use the platform's `getText` convention. Tracked in `ISSUE.md` P1.

Each sub-module has its own `ISSUE.md` with MVP checklist, known issues (P1/P2/P3), and test gaps. Root `ISSUE.md` is the verified gap register across the block.

### Capabilities by Role

- **Admin**: Full access to all 14 finance sub-modules, permission management, reports, accounting configuration
- **Accountant**: Full access including journal entries, payroll processing, report generation
- **Developer**: Platform-wide access across all schools
- **Teacher/Staff**: View own salary and payslips, submit expenses, clock in/out for timesheets
- **Student/Guardian**: View and pay fees, view wallet balance, download receipts

### Routes

| Route                           | Page                       | Status |
| ------------------------------- | -------------------------- | ------ |
| `/{lang}/finance`               | Finance hub                | Ready  |
| `/{lang}/finance/dashboard`     | Financial overview         | Ready  |
| `/{lang}/finance/invoice/...`   | Invoice management         | Ready  |
| `/{lang}/finance/receipt/...`   | Receipt management         | Ready  |
| `/{lang}/finance/banking/...`   | Banking & reconciliation   | Ready  |
| `/{lang}/finance/fees/...`      | Student fees               | Ready  |
| `/{lang}/finance/salary/...`    | Salary structures          | Ready  |
| `/{lang}/finance/payroll/...`   | Payroll processing         | Ready  |
| `/{lang}/finance/timesheet/...` | Time tracking              | Ready  |
| `/{lang}/finance/wallet/...`    | Digital wallets            | Ready  |
| `/{lang}/finance/budget/...`    | Budget planning            | Ready  |
| `/{lang}/finance/expenses/...`  | Expense management         | Ready  |
| `/{lang}/finance/accounts/...`  | Chart of accounts & ledger | Ready  |
| `/{lang}/finance/reports/...`   | Financial reporting        | Ready  |

### File Structure

```
src/components/school-dashboard/finance/
├── CLAUDE.md                       # Block-agent context
├── ISSUE.md                        # Root umbrella issue tracker
├── README.md                       # This file
├── content.tsx                     # Main finance hub page
├── lib/
│   ├── format.ts                   # Locale-aware currency/date formatters
│   ├── permissions.ts              # Shared permission utilities
│   ├── dashboard-components.tsx    # Shared dashboard widgets
│   └── accounting/                 # Double-entry bookkeeping engine
│       ├── types.ts
│       ├── utils.ts
│       ├── posting-rules.ts
│       ├── seed-accounts.ts
│       ├── actions.ts
│       └── index.ts
├── accounts/         # Chart of accounts & general ledger  + ISSUE.md
├── banking/          # Bank accounts & reconciliation      + ISSUE.md
├── budget/           # Budget planning & variance          + ISSUE.md
├── dashboard/        # Financial overview dashboard        + ISSUE.md
├── expenses/         # Expense tracking & approval         + ISSUE.md
├── fees/             # Student fee management              + ISSUE.md
├── invoice/          # Invoice & billing                   + ISSUE.md
├── payroll/          # Payroll processing                  + ISSUE.md
├── permissions/      # Finance permission management UI    + ISSUE.md
├── receipt/          # Receipt generation                  + ISSUE.md
├── reports/          # Financial reporting                 + ISSUE.md
├── salary/           # Salary structures                   + ISSUE.md
├── timesheet/        # Staff time tracking                 + ISSUE.md
└── wallet/           # Digital wallets                     + ISSUE.md
```

### Status

**Overall completion:** ~79% (average of the matrix readiness column) · **Top blockers:** 5 of 6 ledger posting functions orphaned (P0), test coverage (11 of 14 sub-modules have none), validation-helper migration pending for 11 sub-modules. See `ISSUE.md` for the verified gap register.

### Design Principles

1. **Feature-based architecture**: Each sub-module is self-contained with `types.ts`, `validation.ts`, `config.ts`, `actions.ts`, `content.tsx`, `ISSUE.md`
2. **Double-entry bookkeeping**: A balanced-journal-entry engine lives at `lib/accounting/` (`posting-rules.ts` maps domain events to debit/credit lines). Today only **fee payments** are wired to it (`postFeePayment`); the posting functions for salary, expense, invoice, fee-assignment, and wallet exist but have no callers yet (see `ISSUE.md` P0). Do not assume a money event hits the ledger without checking
3. **Multi-tenant**: Row-level isolation using `schoolId` in every query
4. **Hybrid permissions**: Role-based defaults + granular `FinancePermission` model (12 modules x 7 actions)
5. **Mirror pattern**: Routes at `src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/<module>/` import from `src/components/school-dashboard/finance/<module>/content.tsx`
6. **Locale-aware formatting**: `formatCurrency` / `formatMoney` / `formatDate` from `finance/lib/format.ts` -- never hardcode `$`, `SDG`, or English month names
7. **Dictionary-driven notifications**: Server actions load `finance.notifications.*` via `getDictionary(school.preferredLanguage)` -- no bilingual ternaries

### Integration Points

- **Prisma schema**: `prisma/models/finance-*.prisma` (finance-core, finance-fees, finance-payroll, finance-banking, finance-budgets, finance-invoices, finance-reports)
- **Shared permissions**: `finance/lib/permissions.ts`
- **Accounting engine**: `finance/lib/accounting/`
- **Tenant context**: `src/lib/tenant-context.ts`
- **Auth**: `src/auth.ts`
- **Notifications**: `src/components/school-dashboard/notifications/`
- **Translation**: `src/components/translation/` + `@/components/internationalization/helpers`

### Where to Start

- New contributor → read this README, then the `ISSUE.md` of the sub-module you'll touch
- Public docs → the user-facing mirror is `/docs/finance` (hub) + a page per sub-block (`/docs/finance-payroll`, `/docs/finance-accounts`, …, plus `/docs/fees`, `/docs/invoice`). Keep the `/docs/finance` status matrix in sync with the one above
- Adding a feature → confirm it's catalogued in the relevant `ISSUE.md` before coding
- Fixing a bug → update the sub-module `ISSUE.md` once shipped
- Money math change → read `lib/accounting/` first; double-entry invariants must hold

### Agents & Skills

- `agent:revenue` — fees · billing · payroll · pricing
- `agent:prisma` — finance schema (`finance-*.prisma`) + multi-tenant scoping
- `agent:guardian` — OWASP + tenant boundary audit
- `skill:/security` — security sweep
- `skill:/guard` — auth + validation sweep
- `skill:/check` — quality gate before ship
