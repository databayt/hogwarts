## Finance Block -- Comprehensive School Finance Management

### Overview

The Finance Block is a feature-based financial management system for multi-tenant school operations. It implements double-entry bookkeeping with 14 specialized sub-blocks covering invoicing, fees, payroll, budgeting, banking, and more. All modules enforce `schoolId` scoping for tenant isolation.

### Capabilities by Role

- **Admin**: Full access to all 14 finance sub-blocks, permission management, reports, and accounting configuration
- **Accountant**: Full access to all sub-blocks including journal entries, payroll processing, and report generation
- **Developer**: Platform-wide access across all schools
- **Teacher/Staff**: View own salary and payslips, submit expenses, clock in/out for timesheets
- **Student/Guardian**: View and pay fees, view wallet balance, download receipts

### Routes

| Route                                                            | Page                       | Status |
| ---------------------------------------------------------------- | -------------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance`               | Finance hub                | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/dashboard`     | Financial overview         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/invoice/...`   | Invoice management         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/receipt/...`   | Receipt management         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/banking/...`   | Banking & reconciliation   | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/fees/...`      | Student fees               | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/salary/...`    | Salary structures          | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/payroll/...`   | Payroll processing         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/timesheet/...` | Time tracking              | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/wallet/...`    | Digital wallets            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/budget/...`    | Budget planning            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/expenses/...`  | Expense management         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/accounts/...`  | Chart of accounts & ledger | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/finance/reports/...`   | Financial reporting        | Ready  |

### File Structure

```
src/components/school-dashboard/finance/
├── content.tsx                    # Main finance hub page
├── lib/
│   ├── permissions.ts             # Shared permission utilities
│   ├── dashboard-components.tsx   # Shared dashboard widgets
│   └── accounting/                # Double-entry bookkeeping engine
│       ├── types.ts
│       ├── utils.ts
│       ├── posting-rules.ts
│       ├── seed-accounts.ts
│       ├── actions.ts
│       └── index.ts
├── accounts/                      # Chart of accounts & general ledger
├── banking/                       # Bank accounts & reconciliation
├── budget/                        # Budget planning & variance
├── dashboard/                     # Financial overview dashboard
├── expenses/                      # Expense tracking & approval
├── fees/                          # Student fee management
├── invoice/                       # Invoice & billing
├── payroll/                       # Payroll processing
├── permissions/                   # Finance permission management UI
├── receipt/                       # Receipt generation
├── reports/                       # Financial reporting
├── salary/                        # Salary structures
├── timesheet/                     # Staff time tracking
└── wallet/                        # Digital wallets
```

### Status

**Completion:** 80% | **Blockers:** Invoice sub-block optimized (90%, 131 tests); other sub-blocks still need test coverage

### Design Principles

1. **Feature-Based Architecture**: Each sub-block is self-contained with `types.ts`, `validation.ts`, `config.ts`, `actions.ts`, `content.tsx`
2. **Double-Entry Bookkeeping**: All financial transactions create balanced journal entries via `lib/accounting/`
3. **Multi-Tenant**: Row-level isolation using `schoolId` in every query
4. **Hybrid Permissions**: Role-based defaults + granular `FinancePermission` model (12 modules x 7 actions)
5. **Mirror Pattern**: Routes at `src/app/.../finance/<module>/` import from `src/components/school-dashboard/finance/<module>/content.tsx`

### Integration Points

- **Prisma schema**: `prisma/models/finance.prisma`
- **Shared permissions**: `src/components/school-dashboard/finance/lib/permissions.ts`
- **Accounting engine**: `src/components/school-dashboard/finance/lib/accounting/`
- **Tenant context**: `src/lib/tenant-context.ts`
- **Auth**: `src/auth.ts`
