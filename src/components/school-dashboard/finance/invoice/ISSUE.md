# Invoice Block -- Issues & Backlog

Status legend: [x] done, [~] in progress, [ ] todo

## Recently Completed (2026-06-13 — Admission+Finance production-readiness pass)

- [x] `InvoiceStatus` extended with `PARTIAL` — webhook multi-installment allocation credits oldest-unpaid invoice first; status flips UNPAID → PARTIAL → PAID as payments arrive.
- [x] `UserInvoice.amountPaid` (Decimal) added — tracks cumulative paid amount per invoice; used by allocation logic and surfaced in detail view + list.
- [x] `UserInvoice.sentAt` (DateTime) added — records when `sendInvoiceEmail` last fired; shown in detail panel as email audit trail.
- [x] Invoice access scoping fixed: ADMIN + ACCOUNTANT now see all school invoices (school-wide list); STUDENT/GUARDIAN see only their own. Prior behavior returned only the logged-in user's invoices for all roles.
- [x] OVERDUE status mirrored from fee-overdue cron to `UserInvoice` rows — invoice list stays current without manual refresh.
- [x] `sendInvoiceEmail` sender address fixed (was hardcoded `onboarding@resend.dev`); action-button URL is now absolute (was relative, broke email clients).
- [x] Linked payments panel shown in invoice detail view.
- [x] `amountPaid` + `PARTIAL` status surfaced in invoice list columns and detail view.
- [x] Indexes added: `invoices(schoolId)` for school-wide list query performance.
- [x] Prisma model file renamed: `finance-invoices.prisma` → `invoices.prisma`.

## Recently Completed (2026-03-21)

### Architecture Cleanup

- [x] Remove 9 dead files (zod-schema.ts, types/invoice.ts, dashboard.ts, hooks.ts, auth.ts, email.ts, settings.ts, invoice.ts, actions/user.ts)
- [x] Remove 5 unused functions from actions.ts (testInvoiceConnection, associateUserWithSchool, getCurrentUser, logout, ExtendedUser/ExtendedSession types)
- [x] Relocate deleteCurrentUser to src/lib/actions/user.ts

### Multi-Tenant Safety

- [x] Replace raw `auth()` + session casting with `getTenantContext()` in all actions
- [x] Add `requireAuthAndTenant()` + `isAuthError()` centralized auth helper
- [x] Add RBAC via `checkCurrentUserPermission()` on create/update/delete/send

### Code Quality

- [x] Deduplicate createInvoice/createInvoiceWithAutoNumber via shared `createInvoiceCore()`
- [x] Wrap create operations in `db.$transaction` (prevents orphan addresses)
- [x] Fix deleteInvoice: returns `ActionResponse` instead of throwing
- [x] Fix `revalidatePath("/invoice")` -> `"/finance/invoice"`
- [x] Replace `any` types with `InvoiceSearchParams` interface
- [x] All actions return `ActionResponse<T>`

### Type & Data Fixes

- [x] Add `schoolId` and `wizardStep` to types.ts Invoice interface
- [x] Fix util.ts: status enum aligned to Prisma (`PAID`/`UNPAID`/`OVERDUE`/`CANCELLED`)
- [x] Fix util.ts: field names aligned to Prisma (`item_name` not `description`)
- [x] Fix validation.ts: quantity `min(0)` -> `min(1)`

### Test Coverage

- [x] actions.test.ts -- auth, RBAC, CRUD, email, dashboard stats (763 LOC)
- [x] create-from-enrollment.test.ts -- admission integration (343 LOC)
- [x] wizard-actions.test.ts -- wizard flow, tenant isolation (359 LOC)
- [x] validation.test.ts -- Zod schema edge cases (254 LOC)
- [x] util.test.ts -- all calculation/formatting utilities (340 LOC)
- [x] 131 tests passing, 0 TypeScript errors

---

## Remaining Work

### P1: PDF & Print (infrastructure exists at `file/generate/` and `file/print/`, needs wiring)

- [ ] Create `mapInvoiceToGenerateData()` adapter function
  - Maps `UserInvoice` (Prisma) → `InvoiceData` (`file/generate/types.ts`)
  - Field mapping: `item_name` → `description`, `price` → `unitPrice`
  - Fetches school data (name, logo, address) from `School` model
  - Fetches logo from `UserInvoiceSettings.invoiceLogo`
  - Fetches signature from `UserInvoiceSignature` (name + image)
- [ ] Add "Download PDF" button to `invoice/view-content.tsx` using `useGenerate().generateInvoice()`
- [ ] Add "Print" button to `invoice/view-content.tsx` using `usePrint().printById()`
- [ ] Add PDF download action to DataTable action menu in `columns.tsx`
- [ ] Wire school logo from `UserInvoiceSettings.invoiceLogo` into PDF `schoolLogo` field
- [ ] Wire signature from `UserInvoiceSignature` into PDF footer section

### P1: Email Template Upgrade

- [ ] Add school name and logo to email header (fetch from `UserInvoiceSettings`)
- [ ] Add itemized breakdown table to email body (currently only shows total)
- [ ] Add signature image/name to email footer
- [ ] Replace hardcoded sender `"Invoice App <onboarding@resend.dev>"` with school-specific email or verified domain
- [ ] Add RTL support for Arabic recipients (direction, Rubik font)
- [ ] Migrate from plain React JSX to React Email primitives (`@react-email/components`)

### P1: Settings → Output Wiring

- [ ] Fetch `UserInvoiceSettings` + `UserInvoiceSignature` in PDF generation flow
- [ ] Fetch logo and signature in email sending flow (`sendInvoiceEmail`)
- [ ] Display school logo in `invoice/view-content.tsx` header
- [ ] Display signature in invoice view footer

### P1: CSV Export Wiring

- [ ] Wire Export button in `all.tsx` to `exportInvoiceToCSV()` from `util.ts`

### P1: Ledger Posting Not Wired

- [ ] Invoice payments don't post to the ledger -- `postInvoicePayment` exists in `finance/lib/accounting/` but has zero callers (umbrella ISSUE.md P0)

### P2: Stubs to Complete

- [ ] Implement `bulk-generate.tsx` -- generate invoices from `FeeAssignment` records for a class/year

### P2: i18n Migration

- [ ] Migrate `InvoiceSchemaZod` consumers to `createInvoiceSchema(dictionary)` (6 files: form.tsx, 3 steps/, actions.ts)
- [ ] Migrate `onboardingSchema` consumers to `createOnboardingSchema(dictionary)` (2 files: onboarding/content.tsx, user-edit-profile.tsx)
- [ ] Remove hardcoded English fallbacks in form.tsx toast messages
- [ ] Add dictionary keys for all invoice UI text
- [ ] Translate email template text via dictionary

### P3: Missing Features

- [ ] Recurring invoice scheduling (data model exists in util.ts `calculatePaymentSchedule`)
- [x] ~~Partial payment tracking (amountPaid field exists in PDF template but not in Prisma model)~~ — `UserInvoice.amountPaid` now in Prisma schema + PARTIAL status (2026-06-13)
- [ ] Invoice duplication (clone existing invoice)
- [ ] Invoice preview before email send
- [ ] Share invoice via link (generate public URL)
- [ ] True PARTIAL → PAID transition from `recordPayment` edge cases (deferred)

### P4: UI Improvements

- [ ] Mobile-responsive invoice form
- [ ] Better empty states for invoice list
- [ ] Column customization in DataTable
- [ ] Bulk selection + batch status update

### P5: Performance

- [ ] Composite index already exists: `@@unique([schoolId, invoice_no])` -- verify query plans use it
- [ ] Optimize `getDashboardStats` with materialized aggregations
- [ ] Lazy load chart components
- [ ] Add optimistic UI updates for status changes

### P6: Notifications Integration

- [ ] In-app notification on invoice creation (for recipient)
- [ ] In-app notification on payment received
- [ ] Email payment reminder automation (overdue invoices)
- [ ] Email delivery tracking (open/click via Resend webhooks)

### P7: Security Hardening

- [ ] Audit logging for invoice mutations
- [ ] Rate limiting on sendInvoiceEmail
- [ ] Field-level encryption for sensitive financial data

### P8: Testing Gaps

- [ ] E2E tests for complete invoice workflow
- [ ] Component tests for form.tsx multi-step flow
- [ ] Component tests for table.tsx with mock data
- [ ] Integration tests for wizard/ sub-module actions

## Acceptance Criteria

All new implementations must:

1. Use `getTenantContext()` for schoolId (not raw session)
2. Check RBAC via `checkCurrentUserPermission()` for mutations
3. Return `ActionResponse<T>` from all server actions
4. Use `db.$transaction` for multi-record writes
5. Include unit tests with mocked Prisma/auth/tenant
6. Support both Arabic and English via dictionary
7. Follow the existing patterns in `actions.ts` and `wizard/actions.ts`

## Dependencies

- Next.js 16, React 19, Prisma 6, TypeScript 5
- react-hook-form + zod (form validation)
- @tanstack/react-table (DataTable)
- @react-pdf/renderer (PDF generation -- installed, not wired)
- nuqs (URL search params)
- resend (email delivery)
- date-fns (date formatting)

## Smoke Test Results (2026-04-20, demo.databayt.org)

- [x] `/ar/finance/invoice` -- "الفواتير" title, Arabic columns (فاتورة #, العميل, الإجمالي, الحالة, تاريخ الاستحقاق, تاريخ الإنشاء), placeholders translated, empty state loads
- [x] Dates show Arabic format (٢٠٢٦/٠٤/٢٠) via `formatDate(locale)` util
- [ ] "View" button + "No results." empty-state copy not translated on filtered list
- [ ] Page `<title>` metadata still English ("Fees & Penalties", "Dashboard: Salary Management") -- generateMetadata needs locale arg
