## Expenses -- Tracking & Approval Workflow

### Overview

Expense submission, multi-level approval workflow, receipt attachment, budget integration, and reimbursement processing. Supports category management and bulk operations.

### Capabilities by Role

- **Admin/Accountant**: Full access -- view all, create, approve, process payments, manage categories
- **Teacher/Staff**: Submit own expenses, view own history, edit/delete drafts
- **Student/Guardian**: No access

### Routes

| Route                             | Page                | Status |
| --------------------------------- | ------------------- | ------ |
| `.../finance/expenses`            | Expenses overview   | Ready  |
| `.../finance/expenses/all`        | All expenses list   | Ready  |
| `.../finance/expenses/new`        | Submit expense      | Ready  |
| `.../finance/expenses/[id]`       | Expense detail      | Ready  |
| `.../finance/expenses/categories` | Category management | Ready  |

### File Structure

```
expenses/
├── actions.ts       # Server actions (CRUD, approve, reject, process payment)
├── config.ts        # Expense categories, status enums
├── content.tsx      # Main expenses page (server component)
├── content-old.tsx  # Legacy content (pending removal)
├── types.ts         # TypeScript interfaces
└── validation.ts    # Zod schemas
```

### Status

**Completion:** 70% | **Blockers:** `content-old.tsx` legacy file needs removal; OCR receipt scanning not implemented; email notifications for approval chain not wired

### Integration Points

- Deducts from budget allocations on approval
- Creates journal entries via `finance/lib/accounting/`
- Reimbursements can be added to payroll
- See [finance master README](../README.md) for architecture details
