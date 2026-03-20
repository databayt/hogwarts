## Payroll -- Processing & Disbursement

### Overview

Payroll run processing with progressive tax calculation, benefits/deductions, payslip generation, and approval workflow. Calculates income tax, Social Security, Medicare, and employer contributions.

### Capabilities by Role

- **Admin/Accountant**: Full access -- process payroll runs, approve, generate payslips, mark as paid
- **Teacher/Staff**: View own payslips and salary history
- **Student/Guardian**: No access

### Routes

| Route                           | Page               | Status |
| ------------------------------- | ------------------ | ------ |
| `.../finance/payroll`           | Payroll overview   | Ready  |
| `.../finance/payroll/runs`      | Payroll runs list  | Ready  |
| `.../finance/payroll/runs/new`  | Create payroll run | Ready  |
| `.../finance/payroll/runs/[id]` | Payroll run detail | Ready  |

### File Structure

```
payroll/
├── actions.ts      # Server actions (process run, approve, generate payslips)
├── config.ts       # Tax brackets, payroll status enums
├── content.tsx     # Main payroll page (server component)
├── types.ts        # TypeScript interfaces (PayrollRun, PayrollItem, etc.)
└── validation.ts   # Zod schemas
```

### Status

**Completion:** 65% | **Blockers:** No table/columns/form components yet (UI is in content.tsx); payslip PDF generation not implemented; W-2 / compliance reports not built

### Integration Points

- Reads salary structures from `finance/salary/`
- Reads approved timesheets from `finance/timesheet/`
- Creates journal entries (DR: Salary Expense, CR: Cash/Tax Payable) via `finance/lib/accounting/`
- Disbursement tracked via `finance/banking/`
- See [finance master README](../README.md) for architecture details
