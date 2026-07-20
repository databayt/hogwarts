## Invoice -- Billing & Invoice Management

### Overview

Full invoice lifecycle from draft to payment: wizard-based creation, auto-generation from enrollment/transport/purchases, itemized line items, a print-first document view (Milan minimalist-monospace design), public share links, PDF download, email delivery via Resend, and ledger posting on payment. Server actions gate through `finance/guard.ts` (`requireFinanceActor`); reads are deliberately owner-scoped so students/guardians reach their own invoices (see `requireAuthAndTenant` doc-comment in `actions.ts`).

### Capabilities by Role

- **Admin / Accountant / Developer**: full access — create, edit via wizard, delete, mark paid, share, send email, settings
- **Student/Guardian**: view own invoices only (list scoping + dashboard "Fee Payments" section + own-invoice detail/PDF); no mutations
- **Anyone with a share link**: view + print the public invoice page (token is the credential)

### Routes

| Route                                    | Page                                           | Status |
| ---------------------------------------- | ---------------------------------------------- | ------ |
| `.../finance/invoice`                    | Invoice list (DataTable, `?status=` filter)    | Ready  |
| `.../finance/invoice/analysis`           | Stats dashboard (school-currency revenue stat) | Ready  |
| `.../finance/invoice/invoice/create`     | Creates draft → redirects into wizard          | Ready  |
| `.../finance/invoice/invoice/edit/[id]`  | Redirects into wizard details                  | Ready  |
| `.../finance/invoice/invoice/view/[id]`  | Full-page InvoiceSheet + toolbar (print/share) | Ready  |
| `.../finance/invoice/add/[id]/details`   | Wizard: details step (number prefilled)        | Ready  |
| `.../finance/invoice/add/[id]/items`     | Wizard: items step (server-recomputed totals)  | Ready  |
| `.../finance/invoice/settings`           | Invoice branding (logo + signature)            | Ready  |
| `.../finance/invoice/onboarding`         | Profile/currency setup                         | Ready  |
| `/[lang]/invoice/[token]` (public, root) | Shared invoice — view + print, no auth         | Ready  |

### File Structure

```
invoice/
├── actions.ts                  # Reads (owner-scoped) + delete/send/markPaid/settings (guard-gated)
├── share.ts                    # shareInvoice / getSharedInvoice / revokeInvoiceShare
├── purchase-invoice.ts         # PAID invoice from Stripe checkout (webhook-only, NOT "use server")
├── invoice-sheet.tsx           # Print-first Milan-design document (server, presentational)
├── invoice-share-dialog.tsx    # Public-link toggle + copy + WhatsApp/email channels
├── invoice-print-button.tsx    # window.print() (global print CSS strips chrome)
├── content.tsx                 # List page (resolveFinanceAccess + FinanceAccessDenied)
├── table.tsx / columns.tsx     # DataTable (Edit routes into the wizard)
├── types.ts                    # TS interfaces
├── validation.ts               # Onboarding schemas only (wizard has its own validation)
├── list-params.ts              # nuqs URL state
├── send-invoice-email.tsx      # Resend template (bilingual; links public page when shared)
├── email.config.ts             # Resend client
├── invoice-pdf-data.ts         # UserInvoice → InvoiceData adapter for the PDF
├── download-invoice.tsx        # Download-PDF / Send / Mark-paid buttons
├── util.ts                     # Calc/format/status helpers + CSV export (no UI button)
├── loading.tsx                 # Skeleton
├── dashboard/                  # Analysis page (content/card/chart/config/data-table/header)
├── invoice/view-content.tsx    # Full-page detail: toolbar + InvoiceSheet + linked payments
├── onboarding/                 # Profile + currency form
├── settings/                   # Branding (logo/signature upload)
└── wizard/                     # THE creation/edit flow (details + items steps)
    ├── actions.ts              # Draft create (school currency + prefilled number)
    ├── config.ts               # Wizard config; currency options derive from lib/utils
    ├── use-invoice-wizard.ts
    ├── details/  (actions/content/form/validation)
    └── items/    (actions/content/form/validation — server recomputes totals)
```

Tests: `src/tests/school-dashboard/finance/invoice/` (actions, wizard-actions, share, purchase-invoice, mark-invoice-paid, invoice-pdf-data, util, validation) + `src/tests/lib/fee-invoice-sync.test.ts` (itemization) + `src/tests/school-dashboard/finance/lib/invoice-allocation.test.ts`.

### Server Action Exports (actions.ts)

| Function                 | Gate                                   | Purpose                                              |
| ------------------------ | -------------------------------------- | ---------------------------------------------------- |
| `getInvoicesWithFilters` | auth+tenant, owner-scoped              | Filtered list (privileged roles see all; others own) |
| `getInvoiceById`         | auth+tenant, owner-scoped              | Detail + linked payments + branding + share fields   |
| `deleteInvoice`          | `requireFinanceActor(invoice, delete)` | Delete + orphan-address cleanup                      |
| `sendInvoiceEmail`       | `requireFinanceActor(invoice, export)` | Resend email (public link when shared)               |
| `markInvoicePaid`        | `requireFinanceActor(invoice, edit)`   | Race-safe flip + `postInvoicePayment` ledger entry   |
| `updateUser`             | auth (own row)                         | Profile firstName/lastName/currency                  |
| `updateSettings`         | auth+tenant (own row)                  | Branding logo + signature                            |
| `getSettings`            | auth+tenant (own row)                  | Branding read (feeds PDF)                            |
| `getDashboardStats`      | auth+tenant, owner-scoped              | 30-day stats + school currency                       |

Share trio lives in `share.ts` (`shareInvoice`/`revokeInvoiceShare` gated `invoice:edit`; `getSharedInvoice` public by design — token lookup only, minimal select).

### Invoice Generation Paths (all auto-paths idempotent)

| Source                        | Entry                                                   | Result                                                             |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Manual                        | wizard (`createDraftInvoice` → details → items)         | Draft in school currency, prefilled sequential number              |
| Enrollment / student creation | `lib/fee-auto-assign.ts` → `lib/fee-invoice-sync.ts`    | `ENR-` invoices per assignment; **itemized** per fee component     |
| Transport route fees          | `finance/fees/transport-provisioning.ts` (admin button) | Per route+month FeeStructure → assignments → invoices              |
| Course/catalog/video purchase | Stripe webhook → `purchase-invoice.ts`                  | `PUR-<sessionId>` PAID invoice (skipped when checkout school-less) |

Registration fees collected at offer acceptance are allocated onto their invoice inside `confirmEnrollment`'s transaction via `allocatePaymentToInvoices(…, tx)` — the `tx` parameter is load-bearing (uncommitted rows).

### Itemization (fee-invoice-sync)

Single-installment invoices break into one line per non-zero `FeeStructure` component (tuition, admission, registration, exam, library, laboratory, sports, transport, hostel + `otherFees`), labeled via `finance.feeComponents` dictionary in the school's language. `sub_total` = component sum; scholarship gap goes to the invoice `discount` field; above-list billing adds an Adjustment line; zero components fall back to the lump-sum line. Multi-installment invoices keep "Installment N of M" lines.

### Output Infrastructure

| Capability      | Infrastructure                                              | Wired? |
| --------------- | ----------------------------------------------------------- | ------ |
| Print (browser) | `window.print()` + global `@media print` chrome-strip       | Yes    |
| A4 PDF download | `@react-pdf` InvoiceTemplate (Milan design, IBM Plex Mono)  | Yes    |
| Public share    | `shareToken` route `/[lang]/invoice/[token]` + share dialog | Yes    |
| Email send      | Resend bilingual template                                   | Yes    |
| CSV export      | `util.ts::exportInvoiceToCSV()`                             | No UI  |

Branding: per-user `UserInvoiceSettings.invoiceLogo` overrides the school logo in the PDF, email, sheet, and public page. The settings page mirrors this: with no custom logo it previews the inherited `School.logoUrl` (caption "موروث من شعار المدرسة"), and `getSettings` returns `schoolLogo` alongside `invoiceLogo` for that purpose.

### Status

**Completion:** ~97% — remaining items tracked in `ISSUE.md` (purchase ledger posting rule, invoice lifecycle notifications, i18n fallback debt).
