## Timesheet -- Staff Time Tracking

### Overview

Time tracking for hourly-paid staff, substitute teachers, and part-time employees. Provides clock in/out, manual time entry, overtime calculation, approval workflow, and payroll integration.

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

**Completion:** 60% | **Blockers:** No table/columns/form components (UI is in content.tsx); GPS/QR clock-in not implemented; calendar view not built; overtime calculation engine not verified

### Integration Points

- Approved timesheets automatically included in `finance/payroll/` runs
- Hourly rates from `finance/salary/` structures
- Labor costs tracked against `finance/budget/`
- See [finance master README](../README.md) for architecture details
