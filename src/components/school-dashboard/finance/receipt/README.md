## Receipt -- Generation & Tracking

### Overview

Expense-receipt capture: upload a photo or PDF of a receipt and an AI pipeline extracts merchant, date, amount, and line items for expense tracking. Schematic.io gates the feature by plan. This is **distinct** from the payment receipt issued on a fee payment, which is rendered by `fees/receipt-pdf.tsx`.

### Capabilities by Role

- **Admin/Accountant**: Upload receipts, view all, retry extraction, delete
- **Other roles**: No direct access

### Routes

| Route                             | Page                    | Status |
| --------------------------------- | ----------------------- | ------ |
| `.../finance/receipt`             | Receipt list            | Ready  |
| `.../finance/receipt/[id]`        | Receipt detail          | Ready  |
| `.../finance/receipt/manage-plan` | Receipt plan management | Ready  |

### File Structure

```
receipt/
├── actions.ts         # Server actions (generate, void, reprint, search)
├── content.tsx        # Main receipts page (server component)
├── types.ts           # TypeScript interfaces
├── validation.ts      # Zod schemas
├── table.tsx          # Receipt data table
├── columns.tsx        # Column definitions
├── receipt-card.tsx   # Receipt card display
├── receipt-detail.tsx # Receipt detail view
└── upload-form.tsx    # OCR receipt upload form
```

### Status

**Completion:** 85% | **Blockers:** No "edit extracted data" UI (delete + re-upload on misread); OCR fallback for low-quality images pending; receipt-to-expense linking is manual

### Integration Points

- AI extraction pipeline at `receipt/ai/extract-receipt-data.ts`
- Schematic.io plan / entitlement gating at `receipt/schematic/`
- Attaches to expense records (manual today)
- See [finance master README](../README.md) for architecture details
