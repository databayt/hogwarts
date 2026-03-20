## Fees -- Student Fee Management

### Overview

Comprehensive student fee management covering fee structure definitions, student assignments, payment processing, scholarships, fines, and late fee automation. The most feature-rich sub-block with full table/form/column components.

### Capabilities by Role

- **Admin/Accountant**: Full CRUD on structures, assignments, payments, scholarships, fines; waive late fees
- **Teacher**: View class fee status (read-only)
- **Student**: View own fees and payment history
- **Guardian**: View children's fees, make payments

### Routes

| Route                               | Page                    | Status |
| ----------------------------------- | ----------------------- | ------ |
| `.../finance/fees`                  | Fees overview           | Ready  |
| `.../finance/fees/structures`       | Fee structure list      | Ready  |
| `.../finance/fees/structures/new`   | Create fee structure    | Ready  |
| `.../finance/fees/structures/[id]`  | Edit fee structure      | Ready  |
| `.../finance/fees/assignments`      | Fee assignments list    | Ready  |
| `.../finance/fees/assignments/new`  | Assign fees to students | Ready  |
| `.../finance/fees/assignments/[id]` | Assignment detail       | Ready  |
| `.../finance/fees/payments`         | Payment list            | Ready  |
| `.../finance/fees/payments/new`     | Record payment          | Ready  |
| `.../finance/fees/payments/[id]`    | Payment detail          | Ready  |
| `.../finance/fees/fines`            | Fines list              | Ready  |
| `.../finance/fees/fines/new`        | Create fine             | Ready  |
| `.../finance/fees/scholarships`     | Scholarships list       | Ready  |

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
├── fine-table.tsx          # Fine data table
├── fine-columns.tsx        # Fine column definitions
├── scholarship-table.tsx   # Scholarship data table
└── scholarship-columns.tsx # Scholarship column definitions
```

### Status

**Completion:** 85% | **Blockers:** Late fee automation cron job not configured; family billing / sibling discount not implemented; payment gateway integration pending

### Integration Points

- Creates journal entries (DR: Fees Receivable, CR: Fee Revenue) via `finance/lib/accounting/`
- Generates invoices and receipts via sibling sub-blocks
- Wallet payments supported
- See [finance master README](../README.md) for architecture details
