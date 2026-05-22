## Timesheet -- Staff Time Tracking

### Overview

Time tracking via pay periods and per-day entries (hours, overtime, leave) with a submit → approve workflow, intended to feed payroll. No clock-in UI or automatic overtime detection yet; entries are added manually.

### Capabilities by Role

- **Admin/Accountant**: Full access -- view all timesheets, approve, manage entries
- **Teacher/Staff**: Clock in/out, view and edit own timesheets, submit for approval
- **Student/Guardian**: No access

### Routes

| Route                               | Page                   | Status |
| ----------------------------------- | ---------------------- | ------ |
| `.../finance/timesheet`             | Timesheet overview     | Ready  |
| `.../finance/timesheet/periods`     | Timesheet periods list | Ready  |
| `.../finance/timesheet/entries`     | Time entries list      | Ready  |
| `.../finance/timesheet/entries/new` | Manual time entry      | Ready  |

### File Structure

```
timesheet/
├── actions.ts      # Server actions (clock in/out, approve, submit)
├── config.ts       # Overtime rules, period frequency enums
├── content.tsx     # Main timesheet page (server component)
├── types.ts        # TypeScript interfaces
└── validation.ts   # Zod schemas
```

### Status

**Completion:** 75% | **Blockers:** Manual-entry form is a placeholder; GPS/QR clock-in not implemented; no overtime detection; not yet consumed by payroll (payroll hardcodes days worked)

### Integration Points

- Approved timesheets are **intended** to feed `finance/payroll/` runs, but that link is not wired yet -- payroll currently hardcodes days worked
- Hourly rates from `finance/salary/` structures
- Labor costs tracked against `finance/budget/`
- See [finance master README](../README.md) for architecture details
