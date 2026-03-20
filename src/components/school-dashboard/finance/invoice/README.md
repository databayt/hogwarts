## Invoice -- Billing & Invoice Management

### Overview

Full invoice lifecycle management from draft to payment, with bulk generation, recurring templates, email delivery, and payment tracking. Includes a standalone invoice dashboard, onboarding wizard, and settings. This is the largest sub-block by file count and has legacy code pending cleanup.

### Capabilities by Role

- **Admin**: Full access -- create, edit, delete, approve, export, manage settings and templates
- **Accountant**: Create, edit, approve, export (no delete)
- **Teacher/Staff**: View own salary invoices, download PDFs
- **Student/Guardian**: View fee invoices, check payment status, download receipts

### Routes

| Route                                          | Page              | Status |
| ---------------------------------------------- | ----------------- | ------ |
| `.../finance/invoice/(dashboard)`              | Invoice dashboard | Ready  |
| `.../finance/invoice/list`                     | Invoice list      | Ready  |
| `.../finance/invoice/invoice/create`           | Create invoice    | Ready  |
| `.../finance/invoice/invoice/edit/[invoiceId]` | Edit invoice      | Ready  |
| `.../finance/invoice/invoice/view/[id]`        | View invoice      | Ready  |
| `.../finance/invoice/invoice/paid/[invoiceId]` | Mark as paid      | Ready  |
| `.../finance/invoice/add/[id]/details`         | Add details step  | Ready  |
| `.../finance/invoice/add/[id]/items`           | Add items step    | Ready  |
| `.../finance/invoice/settings`                 | Invoice settings  | Ready  |
| `.../finance/invoice/onboarding`               | Setup wizard      | Ready  |

### File Structure

```
invoice/
├── actions.ts              # Main server actions
├── config.ts               # Invoice status enums, defaults
├── content.tsx             # Main content page
├── content-enhanced.tsx    # Enhanced RBAC-aware dashboard
├── types.ts                # TypeScript interfaces (InvoiceRow, Invoice, Address, Item)
├── validation.ts           # Zod schemas
├── zod-schema.ts           # Additional validation schemas
├── list-params.ts          # URL search param config (nuqs)
├── form.tsx                # Invoice create/edit form
├── table.tsx               # Invoice data table
├── columns.tsx             # Column definitions
├── card.tsx                # Invoice card component
├── featured.tsx            # Featured invoice display
├── all.tsx                 # All invoices list view
├── create.tsx              # Invoice creation flow
├── bulk-generate.tsx       # Bulk invoice generation
├── send-invoice-email.tsx  # Email sending UI
├── chart-invoice.tsx       # Invoice analytics chart
├── loading.tsx             # Loading skeleton
├── submit-button.tsx       # Submit button with loading state
├── hooks.ts                # Custom React hooks
├── logo.tsx                # Invoice logo component
├── util.ts                 # Utility functions
├── currency-format.ts      # Currency formatting helpers
├── invoice.ts              # Invoice business logic
├── dashboard.ts            # Dashboard data logic
├── dashboard-header.tsx    # Dashboard header
├── dashboard-sidebar.tsx   # Dashboard sidebar
├── email.ts                # Email template logic
├── email.config.ts         # Email configuration
├── settings.ts             # Settings management
├── auth.ts                 # Invoice-specific auth helpers
├── user.ts                 # User-related helpers
├── user-profile.tsx        # User profile display
├── user-profile-dropdown.tsx # Profile dropdown
├── user-edit-profile.tsx   # Profile editing
└── get-avatar-name.ts      # Avatar name extraction
```

### Status

**Completion:** 70% | **Blockers:** Legacy code needs cleanup (mixed old/new patterns); duplicate creation logic; some `any` types in actions; PDF generation not fully implemented; no test coverage

### Integration Points

- Creates journal entries (DR: Accounts Receivable, CR: Revenue) via `finance/lib/accounting/`
- Links to receipts, fees, and payment processing
- Bulk generation targets students by class or fee structure
- See [finance master README](../README.md) for architecture details
