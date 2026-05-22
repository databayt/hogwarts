## Fees -- Student Fee Management

### Overview

Comprehensive student fee management covering fee structure definitions, student assignments, payment processing, scholarships, fines, and late fee automation. The most feature-rich sub-block with full table/form/column components.

### Capabilities by Role

- **Admin/Accountant**: Full CRUD on structures, assignments, payments, scholarships, fines; waive late fees
- **Teacher**: View class fee status (read-only)
- **Student**: View own fees and payment history
- **Guardian**: View children's fees, make payments

### Routes

| Route                                | Page                             | Status |
| ------------------------------------ | -------------------------------- | ------ |
| `.../finance/fees`                   | Fees overview                    | Ready  |
| `.../finance/fees/structures`        | Fee structure list               | Ready  |
| `.../finance/fees/structures/new`    | Create fee structure             | Ready  |
| `.../finance/fees/structures/[id]`   | Edit fee structure               | Ready  |
| `.../finance/fees/assignments`       | Fee assignments list             | Ready  |
| `.../finance/fees/assignments/new`   | Assign fees to students          | Ready  |
| `.../finance/fees/assignments/[id]`  | Assignment detail + installments | Ready  |
| `.../finance/fees/payments`          | Payment list                     | Ready  |
| `.../finance/fees/payments/new`      | Record payment                   | Ready  |
| `.../finance/fees/payments/[id]`     | Payment detail + receipt PDF     | Ready  |
| `.../finance/fees/fines`             | Fines list                       | Ready  |
| `.../finance/fees/fines/new`         | Create fine                      | Ready  |
| `.../finance/fees/fines/[id]`        | Fine detail + waive/pay          | Ready  |
| `.../finance/fees/scholarships`      | Scholarships list                | Ready  |
| `.../finance/fees/scholarships/new`  | Create scholarship               | Ready  |
| `.../finance/fees/scholarships/[id]` | Scholarship detail/edit          | Ready  |
| `.../finance/fees/reports`           | Fee collection report            | Ready  |
| `.../finance/fees/my`                | Student/Guardian portal          | Ready  |

### File Structure

```
fees/
├── actions.ts              # Server actions (structures, assignments, payments, fines, scholarships)
├── config.ts               # Fee categories, frequency enums
├── content.tsx             # Main fees page (server component)
├── queries.ts              # Read-only database queries
├── list-params.ts          # URL search param config (nuqs)
├── types.ts                # TypeScript interfaces
├── validation.ts           # Zod schemas
├── form.tsx                # Fee structure form
├── table.tsx               # Fee structure data table
├── columns.tsx             # Fee structure column definitions
├── assignment-form.tsx     # Fee assignment form
├── assignment-table.tsx    # Assignment data table
├── assignment-columns.tsx  # Assignment column definitions
├── payment-form.tsx        # Payment recording form
├── payment-table.tsx       # Payment data table
├── payment-columns.tsx     # Payment column definitions
├── fine-form.tsx           # Fine creation form
├── fine-detail.tsx         # Fine detail with waive/pay actions
├── fine-table.tsx          # Fine data table
├── fine-columns.tsx        # Fine column definitions
├── scholarship-form.tsx    # Scholarship create/edit form
├── scholarship-table.tsx   # Scholarship data table
├── scholarship-columns.tsx # Scholarship column definitions
├── installment-timeline.tsx # Installment tracking with progress
├── receipt-pdf.tsx         # PDF receipt generation (@react-pdf)
├── payment-detail-actions.tsx # Client wrapper for receipt download
├── pay-online-button.tsx   # Stripe checkout trigger (client component)
└── my-fees.tsx             # Student/Guardian fee portal view
```

### Status

**Completion:** 85% | **Blockers:** Fee-payment ledger posting is fire-and-forget (not rolled back on failure); installment-plan UI pending; fine-type/scholarship text not `lang`-tagged

### Integration Points

- Posts journal entries via `finance/lib/accounting/` on payment (`postFeePayment` -- the only wired poster in the block). Posting is fire-and-forget and not rolled back on failure (umbrella `ISSUE.md` P0)
- Generates invoices and receipts via sibling sub-blocks
- Wallet payments supported
- See [finance master README](../README.md) for architecture details
