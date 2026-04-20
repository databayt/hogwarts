## Finance Block -- Comprehensive School Finance Management

### Overview

The Finance Block is a feature-based financial management system for multi-tenant school operations. It implements double-entry bookkeeping with **14 specialized sub-modules** covering invoicing, fees, payroll, budgeting, banking, and more. All modules enforce `schoolId` scoping for tenant isolation.

~45k LOC total. Currency per-school via `School.currency`. Locale-aware formatting via `finance/lib/format.ts`. Server-side notifications dispatch through school's `preferredLanguage` dictionary.

### Honest Status Matrix

| Sub-module  | Code | i18n | Tests | Docs | Readiness |
| ----------- | ---- | ---- | ----- | ---- | --------- |
| accounts    | OK   | WARN | MISS  | OK   | 75% ready |
| banking     | OK   | WARN | PART  | OK   | 80% ready |
| budget      | OK   | OK   | MISS  | OK   | 85% ready |
| dashboard   | OK   | OK   | MISS  | OK   | 90% ready |
| expenses    | OK   | WARN | MISS  | OK   | 80% ready |
| fees        | OK   | OK   | MISS  | OK   | 85% ready |
| invoice     | OK   | OK   | OK    | OK   | 90% ready |
| payroll     | OK   | OK   | MISS  | OK   | 80% ready |
| permissions | OK   | WARN | MISS  | OK   | 75% ready |
| receipt     | OK   | OK   | MISS  | OK   | 85% ready |
| reports     | OK   | WARN | MISS  | OK   | 75% ready |
| salary      | OK   | OK   | MISS  | OK   | 85% ready |
| timesheet   | OK   | WARN | MISS  | OK   | 75% ready |
| wallet      | OK   | WARN | MISS  | OK   | 75% ready |

Legend: **OK** = complete · **PART** = partial · **WARN** = gaps catalogued · **MISS** = not started.

Each sub-module has its own `ISSUE.md` with MVP checklist, known issues (P1/P2/P3), and test gaps. Root `ISSUE.md` rolls up priorities across the block.

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

**Overall completion:** ~82% weighted average · **Blockers:** test coverage (only invoice has tests), validation-helper migration pending for 11 sub-modules.

### Design Principles

1. **Feature-based architecture**: Each sub-module is self-contained with `types.ts`, `validation.ts`, `config.ts`, `actions.ts`, `content.tsx`, `ISSUE.md`
2. **Double-entry bookkeeping**: All financial transactions create balanced journal entries via `lib/accounting/`
3. **Multi-tenant**: Row-level isolation using `schoolId` in every query
4. **Hybrid permissions**: Role-based defaults + granular `FinancePermission` model (12 modules x 7 actions)
5. **Mirror pattern**: Routes at `src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/<module>/` import from `src/components/school-dashboard/finance/<module>/content.tsx`
6. **Locale-aware formatting**: `formatCurrency` / `formatMoney` / `formatDate` from `finance/lib/format.ts` -- never hardcode `$`, `SDG`, or English month names
7. **Dictionary-driven notifications**: Server actions load `finance.notifications.*` via `getDictionary(school.preferredLanguage)` -- no bilingual ternaries

### Integration Points

- **Prisma schema**: `prisma/models/finance.prisma`
- **Shared permissions**: `finance/lib/permissions.ts`
- **Accounting engine**: `finance/lib/accounting/`
- **Tenant context**: `src/lib/tenant-context.ts`
- **Auth**: `src/auth.ts`
- **Notifications**: `src/components/school-dashboard/notifications/`
- **Translation**: `src/components/translation/` + `@/components/internationalization/helpers`

### Where to Start

- New contributor → read this README, then the `ISSUE.md` of the sub-module you'll touch
- Adding a feature → confirm it's catalogued in the relevant `ISSUE.md` before coding
- Fixing a bug → update the sub-module `ISSUE.md` once shipped
- Money math change → read `lib/accounting/` first; double-entry invariants must hold
