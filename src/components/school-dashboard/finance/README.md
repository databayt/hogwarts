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

This matrix is the authoritative readiness view; it is kept identical to the banner in `ISSUE.md` and the matrix at `/docs/finance`. The **Ledger** column is the key honesty signal -- only fee payments reach the general ledger today.

| Sub-module  | Readiness | Ledger wired                       | i18n | Tests  | Docs |
| ----------- | --------- | ---------------------------------- | ---- | ------ | ---- |
| invoice     | 90%       | ❌ `postInvoicePayment` orphaned   | ⚠️   | 🟢 131 | ✅   |
| fees        | 85%       | 🟡 fee payments only (no rollback) | ✅   | 🟡 13  | ✅   |
| budget      | 85%       | ➖ n/a                             | ✅   | ❌     | ✅   |
| receipt     | 85%       | ➖ n/a                             | ✅   | ❌     | ✅   |
| banking     | 80%       | ➖ n/a                             | ⚠️   | 🟡 5   | ✅   |
| dashboard   | 80%       | ➖ n/a (trends are mock)           | ✅   | ❌     | ✅   |
| expenses    | 80%       | ❌ `postExpensePayment` orphaned   | ⚠️   | ❌     | ✅   |
| accounts    | 75%       | 🟢 engine home (fee payments only) | ⚠️   | 🟡 10  | ✅   |
| permissions | 75%       | ➖ n/a                             | ⚠️   | ❌     | ✅   |
| reports     | 75%       | 🔗 reads ledger (fee-only data)    | ⚠️   | ❌     | ✅   |
| salary      | 75%       | ➖ n/a                             | ✅   | ❌     | ✅   |
| timesheet   | 75%       | ➖ n/a                             | ⚠️   | ❌     | ✅   |
| wallet      | 75%       | ❌ `postWalletTopup` orphaned      | ⚠️   | ❌     | ✅   |
| payroll     | 65%       | ❌ `postSalaryPayment` orphaned    | ✅   | ❌     | ✅   |

Legend -- **Ledger**: 🟢 posts · 🟡 posts but not transactional · ❌ posting fn exists but zero callers · 🔗 consumes ledger · ➖ not a money-mover. **i18n**: ✅ ready · ⚠️ validation strings still hardcoded English. **Tests**: 🟢 strong · 🟡 partial · ❌ none.

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
