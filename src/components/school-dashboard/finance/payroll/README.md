## Payroll -- Processing & Disbursement

### Overview

Payroll run processing, payslip generation, and an approval → disbursement workflow. **Tax is a hardcoded flat 15%** (`actions.ts:286`); progressive brackets and social-security rates live in `config.ts` but are unused. No payslip PDF yet.

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
- Ledger posting (`postSalaryPayment`) exists in `finance/lib/accounting/` but is **not yet wired** -- disbursement marks slips PAID without journal entries (umbrella `ISSUE.md` P0)
- Disbursement tracked via `finance/banking/`
- See [finance master README](../README.md) for architecture details
