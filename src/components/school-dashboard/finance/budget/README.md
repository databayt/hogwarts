## Budget -- Planning & Variance Analysis

### Overview

Budget creation, allocation, and real-time variance tracking system. Supports budget transfers, revision history, and spending forecasts with alert thresholds.

### Capabilities by Role

- **Admin/Accountant**: Full CRUD on budgets, approve transfers, run forecasts, close budgets
- **Teacher/Staff**: View department-level budget (with custom permission)
- **Student/Guardian**: No access

### Routes

| Route                     | Page                     | Status |
| ------------------------- | ------------------------ | ------ |
| `.../finance/budget`      | Budget overview          | Ready  |
| `.../finance/budget/all`  | All budgets list         | Ready  |
| `.../finance/budget/new`  | Create budget            | Ready  |
| `.../finance/budget/[id]` | Budget detail & variance | Ready  |

### File Structure

```
budget/
├── actions.ts      # Server actions (CRUD, transfers, forecasts)
├── config.ts       # Budget categories, status enums
├── content.tsx     # Main budget page (server component)
├── types.ts        # TypeScript interfaces
└── validation.ts   # Zod schemas
```

### Status

**Completion:** 85% | **Blockers:** AI-powered forecast not yet connected to real historical data; revision history UI not built

### Integration Points

- Expenses module deducts from allocations on approval
- Payroll commits against salary allocation
- Variance data feeds into `finance/reports/`
- See [finance master README](../README.md) for architecture details
