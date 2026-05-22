## Salary -- Structure Management

### Overview

Salary structure definitions for all staff -- base salary, allowances, deductions, and pay scales -- plus a calculator and increment workflow. Feeds the payroll sub-block for processing. No salary history yet: creating a new structure deactivates the prior one.

### Capabilities by Role

- **Admin/Accountant**: Full CRUD on salary structures and scales, approve changes
- **Teacher/Staff**: View own salary structure only
- **Student/Guardian**: No access

### Routes

| Route                                | Page                    | Status |
| ------------------------------------ | ----------------------- | ------ |
| `.../finance/salary`                 | Salary overview         | Ready  |
| `.../finance/salary/structures`      | Salary structures list  | Ready  |
| `.../finance/salary/structures/new`  | Create salary structure | Ready  |
| `.../finance/salary/structures/[id]` | Edit salary structure   | Ready  |

### File Structure

```
salary/
├── actions.ts      # Server actions (CRUD, approve, calculate compensation)
├── config.ts       # Allowance/benefit type enums, pay scales
├── content.tsx     # Main salary page (server component)
├── queries.ts      # Read-only database queries
├── list-params.ts  # URL search param config (nuqs)
├── types.ts        # TypeScript interfaces
├── validation.ts   # Zod schemas
├── table.tsx       # Salary structure data table
└── columns.tsx     # Column definitions
```

### Status

**Completion:** 75% | **Blockers:** No dedicated form component (creation may be inline); pay scale management UI not built; salary revision approval workflow not implemented

### Integration Points

- Active structures consumed by `finance/payroll/` for processing
- Salary costs deduct from `finance/budget/` salary allocation
- Salary itself writes **no** journal entries; the ledger entry would come from payroll disbursement, whose `postSalaryPayment` is not yet wired (umbrella `ISSUE.md` P0)
- See [finance master README](../README.md) for architecture details
