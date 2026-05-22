## Invoice -- Billing & Invoice Management

### Overview

Full invoice lifecycle management from draft to payment, with bulk generation, email delivery via Resend, wizard-based creation, and payment tracking. Includes a standalone invoice dashboard, onboarding flow, settings, and user profile management. All server actions enforce multi-tenant isolation via `getTenantContext()` and RBAC via `checkCurrentUserPermission()`.

### Capabilities by Role

- **Admin**: Full access -- create, edit, delete, send email, export, manage settings
- **Accountant**: Create, edit, send email, export (no delete)
- **Teacher/Staff**: View own salary invoices
- **Student/Guardian**: View fee invoices, check payment status

### Routes

| Route                                  | Page                        | Status |
| -------------------------------------- | --------------------------- | ------ |
| `.../finance/invoice`                  | Invoice list (DataTable)    | Ready  |
| `.../finance/invoice/create`           | Create invoice (modal form) | Ready  |
| `.../finance/invoice/add/[id]/details` | Wizard: details step        | Ready  |
| `.../finance/invoice/add/[id]/items`   | Wizard: items step          | Ready  |
| `.../finance/invoice/settings`         | Invoice settings            | Ready  |
| `.../finance/invoice/onboarding`       | Setup wizard                | Ready  |

### File Structure

```
invoice/
├── __tests__/                  # 5 test files, 131 tests, 2059 LOC
│   ├── actions.test.ts         # Server action tests (auth, RBAC, CRUD, email)
│   ├── create-from-enrollment.test.ts  # Admission integration tests
│   ├── util.test.ts            # Utility function tests
│   ├── validation.test.ts      # Zod schema tests
│   └── wizard-actions.test.ts  # Wizard flow tests
├── actions.ts                  # Server actions (getTenantContext + RBAC + $transaction)
├── config.ts                   # Step definitions, currency options
├── content.tsx                 # Server component (main list page)
├── types.ts                    # TypeScript interfaces (Invoice, Address, Item)
├── validation.ts               # Zod schemas (InvoiceSchemaZod + i18n factory)
├── list-params.ts              # URL search param config (nuqs)
├── form.tsx                    # Multi-step create/edit form (3 steps)
├── table.tsx                   # Invoice DataTable
├── columns.tsx                 # Column definitions
├── card.tsx                    # Invoice card component
├── featured.tsx                # Featured invoice display
├── all.tsx                     # All invoices list view
├── create.tsx                  # Invoice creation flow
├── bulk-generate.tsx           # Bulk invoice generation
├── send-invoice-email.tsx      # Email template (Resend)
├── chart-invoice.tsx           # Invoice analytics chart
├── loading.tsx                 # Loading skeleton
├── submit-button.tsx           # Submit button with loading state
├── logo.tsx                    # Invoice logo component
├── util.ts                     # Calculation, formatting, status utilities
├── currency-format.ts          # Currency formatting helpers
├── email.config.ts             # Resend email configuration
├── user.ts                     # User-related helpers
├── user-profile.tsx            # User profile display
├── user-profile-dropdown.tsx   # Profile dropdown
├── user-edit-profile.tsx       # Profile editing
├── get-avatar-name.ts          # Avatar name extraction
├── dashboard-header.tsx        # Dashboard header
├── dashboard-sidebar.tsx       # Dashboard sidebar
├── steps/                      # Form wizard steps
│   ├── basic-information.tsx   # Step 1: From/To addresses
│   ├── client-items.tsx        # Step 2: Items, dates, currency
│   └── review-submit.tsx       # Step 3: Review & submit
├── dashboard/                  # Invoice dashboard sub-module
│   ├── actions.ts
│   ├── card.tsx
│   ├── chart-invoice.tsx
│   ├── config.ts
│   ├── content.tsx
│   ├── data-table.tsx
│   └── header.tsx
├── invoice/                    # Detail views
│   ├── create-edit-content.tsx
│   ├── paid-content.tsx
│   └── view-content.tsx
├── onboarding/                 # Onboarding wizard
│   ├── actions.ts
│   ├── card.tsx
│   └── content.tsx
├── settings/                   # Invoice settings
│   ├── actions.ts
│   ├── card.tsx
│   ├── content.tsx
│   └── imagebase64.ts
└── wizard/                     # Multi-step invoice creation wizard
    ├── actions.ts              # Wizard CRUD (correct tenant pattern)
    ├── config.ts
    ├── use-invoice-wizard.ts
    ├── details/
    │   ├── actions.ts
    │   ├── content.tsx
    │   ├── form.tsx
    │   └── validation.ts
    └── items/
        ├── actions.ts
        ├── content.tsx
        ├── form.tsx
        └── validation.ts
```

### Server Action Exports (actions.ts)

| Function                      | Auth | RBAC             | Tx  | Purpose                                             |
| ----------------------------- | ---- | ---------------- | --- | --------------------------------------------------- |
| `createInvoice`               | Yes  | `invoice:create` | Yes | Create invoice with addresses + items               |
| `createInvoiceWithAutoNumber` | Yes  | `invoice:create` | Yes | Auto-generate invoice number, then create           |
| `getNextInvoiceNumber`        | Yes  | --               | --  | Get next `INV-XXXXXX` number                        |
| `updateInvoice`               | Yes  | `invoice:edit`   | --  | Update invoice by ID                                |
| `deleteInvoice`               | Yes  | `invoice:delete` | --  | Delete invoice (returns error, not throws)          |
| `getInvoices`                 | Yes  | --               | --  | Paginated list (excludes wizard drafts)             |
| `getInvoicesWithFilters`      | Yes  | --               | --  | Filtered + sorted + paginated list                  |
| `getInvoiceById`              | Yes  | --               | --  | Single invoice with Decimal conversion              |
| `sendInvoiceEmail`            | Yes  | `invoice:export` | --  | Send invoice via Resend                             |
| `updateUser`                  | Yes  | --               | --  | Update user profile (firstName, lastName, currency) |
| `updateSettings`              | Yes  | --               | --  | Upsert invoice settings (signature, details)        |
| `getSettings`                 | Yes  | --               | --  | Get user's invoice settings                         |
| `getDashboardStats`           | Yes  | --               | --  | Aggregated stats (30-day window)                    |
| `createInvoiceFromEnrollment` | No   | --               | Yes | Create invoice from admission (internal)            |

### Key Patterns

- **Auth + Tenant**: `requireAuthAndTenant()` helper returns `{ userId, schoolId }` or `ActionResponse` error
- **Type guard**: `isAuthError(ctx)` narrows the return type
- **Transactions**: Create operations use `db.$transaction` for atomicity (addresses + invoice + items)
- **Validation**: `InvoiceSchemaZod` (static) for forms; `createInvoiceSchema(dictionary)` for i18n
- **Status enum**: `InvoiceStatus` from `@prisma/client` (`PAID | UNPAID | OVERDUE | CANCELLED`)

### Output Infrastructure

| Capability          | Infrastructure                                  | Location                        | Wired?                 |
| ------------------- | ----------------------------------------------- | ------------------------------- | ---------------------- |
| A4 PDF download     | `@react-pdf/renderer` InvoiceTemplate (524 LOC) | `file/generate/invoice.tsx`     | No                     |
| PDF generation hook | `useGenerate().generateInvoice(data)`           | `file/generate/use-generate.ts` | No                     |
| Browser print       | `usePrint()` hook (hidden iframe, A4, RTL)      | `file/print/use-print.ts`       | No                     |
| Print button        | `PrintButton` component                         | `file/print/print-button.tsx`   | No                     |
| Email send          | Resend + inline-styled React template           | `send-invoice-email.tsx`        | Yes                    |
| CSV export          | `exportInvoiceToCSV()` function                 | `util.ts`                       | Partial (no UI button) |

**PDF template features:** RTL/LTR fonts (Rubik/Inter), school logo+header, invoice details, line items table, totals (subtotal/tax/discount/total/paid/balance), notes, bank details footer, 4 template styles.

**Field mapping needed:** Invoice block uses `item_name`/`price`, PDF template expects `description`/`unitPrice`. A `mapInvoiceToGenerateData()` adapter is required.

### Settings → Output Data Flow

```
Settings UI → UserInvoiceSettings (invoiceLogo) + UserInvoiceSignature (name, image)
                    ↓ NOT WIRED
PDF Template expects: schoolLogo, schoolName, schoolAddress
Email Template expects: (no branding fields at all)
View Component expects: (no branding)
```

Logo and signature are configurable and stored in DB but never appear in any output.

### Cross-Block Integration

| Consumer             | Location                                       | What It Reads                                                                                |
| -------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Admission enrollment | `admission/actions.ts` → `confirmEnrollment()` | Calls `createInvoiceFromEnrollment()`                                                        |
| Student dashboard    | `dashboard/student.tsx`                        | `InvoiceHistorySection` ("Fee Payments")                                                     |
| Guardian dashboard   | `dashboard/parent.tsx`                         | `InvoiceHistorySection` ("Fee Payments")                                                     |
| Accountant dashboard | `dashboard/accountant.tsx`                     | Invoice count/payment rate metrics                                                           |
| Finance hub          | `finance/content.tsx`                          | `db.userInvoice.count()` for stats                                                           |
| BillingSDK           | `billingsdk/invoice-history.tsx`               | Shared `InvoiceHistory` table component                                                      |
| Accounting engine    | `finance/lib/accounting/`                      | `postInvoicePayment` exists but **unwired** -- no journal entries yet (umbrella ISSUE.md P0) |

### Fee-to-Invoice Flow

```
FeeStructure → FeeAssignment (PENDING, finalAmount)
    → confirmEnrollment() reads pending fee assignments
    → createInvoiceFromEnrollment() maps name→item_name, finalAmount→price
    → UserInvoice (ENR- prefix, UNPAID, due +30 days)
```

No FK between FeeAssignment and UserInvoice -- connection is runtime only.

### Status

**Completion:** 90% | **Test Coverage:** 131 tests (5 files, 2059 LOC) | **TS Errors:** 0

### Stubs

- `bulk-generate.tsx` -- "Bulk invoice generation is currently unavailable" (blocked on deleted `actions-enhanced.ts`)
- `all.tsx` Export button -- not wired to `exportInvoiceToCSV()`
