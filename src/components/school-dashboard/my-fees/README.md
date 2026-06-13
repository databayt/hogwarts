---
epic: 01
sprint: Q3-2026
title: My Fees (student/guardian fee view)
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-06-13
---

## My Fees — Student / Guardian fee summary and receipt download

### Overview

`/finance/fees/my` is the student- and guardian-facing fee view. It lists all
`FeeAssignment` rows for the current user's enrolled children, shows payment
status and due dates, and provides a direct link to download the PDF receipt
for each paid or cleared payment.

### File Structure

```
my-fees/
├── content.tsx     # Server component — fetches FeeAssignment rows, passes school name + currency + lang to table
├── queries.ts      # Read-only DB queries (scoped by schoolId + userId/studentId)
├── actions.ts      # Server actions (pay, request waiver)
└── form.tsx        # Client component (payment initiation form)
```

### Key Behaviours (as of 2026-06-13)

- **School name + currency passed to receipt link**: the PDF receipt route
  (`/api/payment/[paymentId]/receipt`) requires school context for the branded
  header. `content.tsx` fetches `School.name` + `School.currency` and passes
  them through so the receipt renders correctly for any tenant.
- **Working receipt link**: each paid/cleared row has a download button wired
  to `/api/payment/[paymentId]/receipt`. The route is status-guarded (only
  PAID / CLEARED payments return a PDF — pending/failed return 403).
- **PARTIAL status displayed**: invoices partially paid via installments now
  show a `PARTIAL` badge with the `amountPaid` progress so students can see
  how much remains.
- **OVERDUE mirrored**: the fee-overdue cron mirrors OVERDUE onto
  `UserInvoice` rows; this view reflects the latest status without stale data.

### RBAC

- Route accessible to: `STUDENT`, `GUARDIAN`.
- ADMIN / ACCOUNTANT see the full school-wide fees list at `/finance/fees`,
  not this view.

### Dependencies

- `@/lib/tenant-context` — `getTenantContext()` for schoolId
- `@/components/school-dashboard/finance/fees/` — shared fee types + config
- `/api/payment/[paymentId]/receipt` — PDF receipt generation route
- `UserInvoice.amountPaid` + `InvoiceStatus.PARTIAL` — partial payment display

### Open / Deferred

- True server-side search / pagination (currently client-side per-page filter).
- WhatsApp payment-reminder channel for fee-due events (BUG-10, deferred).
