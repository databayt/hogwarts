# Invoice Block -- Issues & Backlog

Status legend: [x] done, [~] in progress, [ ] todo

## Recently Completed (2026-07-19 — Production-readiness + integrations + Milan print/share pass)

### Bug fixes

- [x] **Registration-fee invoice desync** — `confirmEnrollment` recorded the Payment + ledger but never synced the invoice; `allocatePaymentToInvoices` gained a `tx` param (uncommitted rows are invisible to the plain client) and is now called inside the enrollment transaction.
- [x] List "Edit" action was dead UI (opened a ModalContext modal no ancestor mounts) — now routes into the wizard.
- [x] 4 broken links fixed: view `returnTo` + paid-page `/${lang}/invoice` (404), dashboard `/finance/invoice/overdue` (→ `?status=OVERDUE`), 2× quick-action `/finance/invoice/create` (→ `/finance/invoice/invoice/create`).
- [x] `InvoiceHistorySection` no longer shows fabricated SAR rows to students/guardians with no data (real empty state; `getDefaultInvoicesByRole` deleted).
- [x] Currency: drafts default to `School.currency` (was hardcoded USD); analysis revenue stat uses school currency (was hardcoded SAR); wizard currency options derive from the canonical `lib/utils` list.
- [x] Draft invoices get a prefilled sequential number at creation (a second `""`-numbered draft used to violate `@@unique([schoolId, invoice_no])`); duplicate numbers surface `INVOICE_DUPLICATE_NUMBER`.
- [x] Locale-prefixed wizard redirects (was relying on the proxy locale-guess fallback hop).
- [x] Removed the orphaned `invoice/paid/[invoiceId]` flow (bypassed the ledger via legacy `updateInvoice`).
- [x] Stale `createInvoiceFromEnrollment` test imports/mocks removed (export deleted 2026-07-12; docs updated).

### Guard migration (finance/CLAUDE.md 2026-07-17 convention)

- [x] Mutations gate through `requireFinanceActor`; `content.tsx` uses `resolveFinanceAccess` + inline `FinanceAccessDenied`. Reads stay deliberately owner-scoped (students/guardians self-service) — documented on `requireAuthAndTenant`.

### Integrations

- [x] **Itemized invoices**: single-installment invoices now carry one line per non-zero FeeStructure component (+`otherFees`), reconciled to `finalAmount` via the invoice `discount` field / an Adjustment line; labels from `finance.feeComponents` (en+ar).
- [x] **Transport route fees → billing**: `finance/fees/transport-provisioning.ts` (`fees:create` gated) + "Provision to billing" dialog on the transportation fees page; idempotent at structure/assignment/invoice layers.
- [x] **Purchases → PAID invoice**: Stripe webhook video/catalog/course branches create `PUR-<sessionId>` invoices (retry-idempotent; school-less checkouts skipped; never fails the webhook).

### Print & Share (Milan minimalist-monospace redesign)

- [x] `InvoiceSheet` print-first document (IBM Plex Mono EN, Arabic faces for AR prose, logical-property RTL); detail view converted from modal to full page with toolbar.
- [x] "Print" button via `window.print()` + existing global print CSS (clean A4, chrome stripped).
- [x] **Share via link shipped** (P3 item): `share.ts` trio + public `/[lang]/invoice/[token]` route (noindex) + share dialog (toggle, copy, WhatsApp/email channels). Revoke preserves the token.
- [x] PDF template restyled to the same design (verified IBM Plex Mono TTFs; Rubik for AR); data contract unchanged.
- [x] `sendInvoiceEmail` links the public page when sharing is enabled.

### Cleanup

- [x] ~40% of block files deleted (legacy modal form + steps/, duplicate dashboard island, profile components, stubs incl. `bulk-generate.tsx`/`all.tsx`, root `config.ts`, Mongoose-era `/api/invoice` + `/api/email` stubs, unvalidated legacy actions `createInvoice`/`createInvoiceWithAutoNumber`/`updateInvoice`/`getInvoices`/`getNextInvoiceNumber`).
- [x] Tests: share / purchase-invoice / transport-provisioning / itemization / allocation-tx suites added; 532 green across finance+admission+lib. tsc 0, build clean.

### Deferred (new follow-ups from this pass)

- [ ] **Purchase ledger posting** — purchases need DR Cash / CR Revenue; no posting rule exists (`createPurchaseRevenueEntry` + actor-less wrapper like `postFeePayment`'s webhook pattern). Invoices are created without journal entries until then.
- [ ] confirmEnrollment registration-fee end-to-end test (allocator tx behavior is unit-pinned; the full-transaction integration case is not).
- [ ] Public share page: show school payment instructions (Bankak/Cashi manual rail) so a parent can act on the invoice.

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

### P1: PDF & Print

- [x] PDF data adapter — `mapInvoiceToInvoiceData` (`invoice-pdf-data.ts`): `UserInvoice` → `InvoiceData`, item_name→description, price→unitPrice; tested
- [x] "Download PDF" button on the invoice view (`DownloadInvoiceButton` → `useGenerate().generateInvoice`)
- [x] Wire school logo (`UserInvoiceSettings.invoiceLogo`) into PDF `schoolLogo` — `getInvoiceById` fetches it → `InvoiceForPdf` → adapter → template (template already renders it RTL + Rubik) (2026-06-21 `eb4e88574`)
- [x] "Print" button — shipped 2026-07-19 via `window.print()` + global print CSS (the `usePrint()` iframe toolkit stays unused by design)
- [ ] PDF download action in the DataTable row menu (`columns.tsx`)
- [ ] Signature in the PDF footer — `InvoiceData` has no signature field (Certificate/ReportCard do); needs a type + template addition

### P1: Email Template Upgrade — DONE (2026-06-21 `eb4e88574`)

- [x] School logo (or name) header — `sendInvoiceEmail` fetches `UserInvoiceSettings`
- [x] Itemized breakdown table + subtotal/discount/tax/total/amount-due (currency-formatted)
- [x] Signature image + name footer (`UserInvoiceSignature`)
- [x] School-specific sender via `EMAIL_FROM` env (was hardcoded `onboarding@resend.dev`)
- [x] RTL for Arabic recipients (Html `dir`, Arabic-capable font stack, per-direction alignment) + self-contained en/ar label map
- [x] Migrated to `@react-email/components`

### P1: Settings → Output Wiring

- [x] Fetch logo in the PDF flow (`getInvoiceById`) + logo & signature in the email flow (`sendInvoiceEmail`)
- [x] School logo shown in the on-screen view — `InvoiceSheet` renders `schoolLogo` (2026-07-19); signature remains PDF/email-only

### P1: CSV Export Wiring

- [ ] Add an Export CSV button to the invoice list (`table.tsx`) wired to `exportInvoiceToCSV()` from `util.ts` (its old host `all.tsx` was dead code, deleted 2026-07-19)

### P1: Ledger Posting Not Wired

- [x] Invoice payments post to the ledger — `markInvoicePaid` records full payment (amountPaid=total, status=PAID) and posts `postInvoicePayment` (DR Cash / CR Accounts Receivable); `MarkInvoicePaidButton` on the invoice view. Partial-payment-to-ledger is a follow-up (the ledger keys on invoice id). (2026-06-21 `5b789ec28`)

### P2: Stubs to Complete

- [x] ~~`bulk-generate.tsx`~~ — stub deleted 2026-07-19; bulk generation already exists via `ensureInvoicesForAssignment` (enrollment) + `provisionTransportFees` (transport). A per-class re-sweep UI can come later if needed.

### P2: i18n Migration

- [x] ~~`InvoiceSchemaZod` consumers~~ — schema + its dead consumers (form.tsx, steps/) deleted 2026-07-19; live validation is wizard-scoped i18n factories
- [x] `onboardingSchema` consumer migrated — `onboarding/content.tsx` uses `createOnboardingSchema(dictionary)` with the static schema only as pre-load fallback (`user-edit-profile.tsx` deleted)
- [ ] Remove remaining `|| "English"` fallback literals across the block (dictionary keys exist with full parity; fallbacks are dead paths but violate convention)

### P3: Missing Features

- [ ] Recurring invoice scheduling (data model exists in util.ts `calculatePaymentSchedule`)
- [x] ~~Partial payment tracking (amountPaid field exists in PDF template but not in Prisma model)~~ — `UserInvoice.amountPaid` now in Prisma schema + PARTIAL status (2026-06-13)
- [ ] Invoice duplication (clone existing invoice)
- [ ] Invoice preview before email send
- [x] Share invoice via link (generate public URL) — shipped 2026-07-19 (`share.ts` + `/[lang]/invoice/[token]` + share dialog)
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

- [ ] E2E tests for complete invoice workflow (wizard → view → share → public page → print)
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
