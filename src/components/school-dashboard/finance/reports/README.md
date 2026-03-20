## Reports -- Financial Reporting & Analytics

### Overview

Financial statement generation (P&L, balance sheet, cash flow, trial balance), budget vs actual comparisons, and custom report building with export to PDF/Excel/CSV.

### Capabilities by Role

- **Admin/Accountant**: Full access -- generate all reports, create custom reports, schedule, export
- **Teacher**: View department-level reports (with custom permission)
- **Staff/Student/Guardian**: No access

### Routes

| Route                               | Page                   | Status |
| ----------------------------------- | ---------------------- | ------ |
| `.../finance/reports`               | Reports overview       | Ready  |
| `.../finance/reports/all`           | All reports list       | Ready  |
| `.../finance/reports/profit-loss`   | Income statement (P&L) | Ready  |
| `.../finance/reports/balance-sheet` | Balance sheet          | Ready  |
| `.../finance/reports/trial-balance` | Trial balance          | Ready  |

### File Structure

```
reports/
├── actions.ts      # Server actions (generate statements, custom reports, export)
├── config.ts       # Report type enums, schedule options
├── content.tsx     # Main reports page (server component)
├── types.ts        # TypeScript interfaces
└── validation.ts   # Zod schemas
```

### Status

**Completion:** 60% | **Blockers:** Cash flow statement not yet implemented as a route; custom report builder UI not built; scheduled report generation (cron) not wired; export to PDF/Excel not implemented

### Integration Points

- Reads from journal entries and account balances in `finance/accounts/`
- Budget variance data from `finance/budget/`
- Revenue data from `finance/fees/` and `finance/invoice/`
- See [finance master README](../README.md) for architecture details
