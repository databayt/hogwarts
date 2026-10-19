# Fees -- Readiness & Open Work

> 96% ready · Fee structures, assignments, payments, fines, scholarships
>
> Last updated: 2026-06-13
> Aldar UAE source of truth: [hogwarts#356](https://github.com/databayt/hogwarts/issues/356)

## 2026-10-19 — record-payment picker (local, not pushed)

Measured every fees route on the dev server (admin, demo): warm renders are
100–300 ms. The outlier was `/finance/fees/payments/new` at **945 KB of HTML**:
it put every open assignment (3,780 in demo) with all its payments into one
Radix Select. Now 196 KB.

- `getPayableAssignments` (queries.ts): newest 20, or the server search
  (each word must hit a name part, GR/student number or fee name; words typed
  in the display language map back to stored words through the translation
  cache, by position). Paid totals from one `payment.groupBy`.
- The picker is a cmdk combobox (`searchPayableAssignments` action, 250 ms
  debounce, controlled highlight so Enter works after async results).
- **Bugs fixed on the way:** OVERDUE assignments were not payable from this
  form (only PENDING/PARTIAL); the page passed no currency, so an SDG school
  read US$; the assignments table's "Record payment" opened the form blank —
  it now deep-links `?assignment=<id>` and arrives preselected.

## 2026-10-04 — fees by grade (class removal S12, local, not pushed)

- A fee structure charges a grade: `FeeStructure.gradeId` (migration
  `20261004190000_fee_grade`, **owed on prod**, then backfill
  `prisma/sql/class-removal/03-fee-structures-grade.sql` — auto rows from
  `sourceSignals.gradeId`, class-linked rows from their class's grade; 12 of 12
  locally). Provisioning writes the grade and drops the class link on re-sync;
  it no longer needs a class in the grade.
- Matching (auto-assign, previews, the admission offer): school-wide = no grade
  and no class; admin rows for the student's grade; auto rows by
  `sourceSignals.gradeId`. No class lookups left.
- Fee admin create/update take `gradeId` and check it is this school's (a
  `classId` was written unchecked before). The list's column shows the grade.

## 2026-09-13 — phone grid + school currency (local, not pushed)

- Structures, assignments, payments, fines and scholarships had a table/grid toggle that switched
  to nothing. Each now renders `TableGrid` cards (`../../shared/table-grid.tsx`): the grid reads
  the table instance, so a toolbar status filter narrows cards the same way, and each card's
  menu is the row's own actions cell (`RowActions`). A phone opens on the grid; `?view=` wins.
- **Every width:** no list page passed a currency, so the columns defaulted to USD and an SDG
  school read every fee amount as US$. Pages call `getFeeCurrency(schoolId)` (queries.ts).
- Scholarship cards show a PERCENTAGE award as a percentage. The desktop column still formats
  `coverageAmount` as money for every type, and its type filter offers FULL/PARTIAL/MERIT_BASED
  … while the enum is PERCENTAGE/FIXED_AMOUNT/FULL — open.
- Columns still format dates with `ar-SA` (Hijri) — open.

## 2026-08-15 — family payment journey (local, not deployed)

Traced from the admission side ("family pays → is told → sees receipt"). See
`content/docs-en/admission.mdx` → "The journey, audited end to end" for the
full table. Fees-block half:

- [x] **`finance/lib/payment-notify.ts` — `notifyFeePaymentReceived`.** One
      fan-out (student + every linked guardian, school language, receipt URL,
      copy from `finance.notifications.*` via `notification-copy.ts`). Wired
      into the **Stripe and Tap fee-payment webhooks**, which notified the
      student ONLY with an inline `isAr` ternary — the parent who had just paid
      online heard nothing. `recordPayment` still carries its own inline copy
      of the same fan-out (file was mid-edit in another session) — it should
      adopt the helper next.
- [x] Family surface links: the enrollment `fee_due` notice now points at
      `/finance/fees/my` (pay online, receipts) instead of `/my-fees`
      (preferences only); `/my-fees` gained a "Pay & view invoices" CTA; the
      "View" assignment link and the payment-number link on `my-fees.tsx`
      removed — both landed STUDENT/GUARDIAN on `FinanceAccessDenied`.
- [x] `fee-invoice-sync.ts`: `UserInvoice.currency` inherits
      `FeeAssignment.currency` (the B7 snapshot) instead of re-reading the
      live school currency.
- [x] `provisionStudent` now surfaces `ensureStudentFeeAssignments`'s
      non-throwing outcomes (`NO_FEE_STRUCTURE_MATCH`, `FEES_SKIPPED_NO_GRADE`)
      to the wizard / CSV import — the return value was discarded at every
      call site.
- [ ] **Instalment reminders + OVERDUE detection depend on
      `FeeStructure.paymentSchedule`** (`fee-due` A1 gate, `fee-overdue`
      `hasOverdueScheduleEntry`). Admin-created structures leave it null, so a
      single-instalment or unscheduled fee never reminds, never flips OVERDUE,
      never accrues a late fee — although every `UserInvoice.due_date` is
      right there. Fix: an invoice-due-date path in both crons. _Not touched
      here — both crons were being edited by another session._
- [ ] Fee due dates / "today" windows are pure UTC (`buildQuarterlySchedule`
      `Date.UTC(startYear, 8, 1)`, `todayBounds`) — the payroll timezone bug's
      sibling. `src/lib/timezone.ts` has the helpers.
- [ ] Refunds: `PaymentStatus.REFUNDED` is displayed, never set — no
      `refundPayment` action / provider method.
- [ ] Withdrawal / archive does not void open assignments or invoices.
- [ ] Two family fee surfaces (`/my-fees` prefs vs `/finance/fees/my` pay) —
      merge or redirect eventually.

## 2026-08-14 — performance pass (local, not deployed)

- [x] **Overview gate collapsed from five serialized permission checks to one.**
      `content.tsx` used five sequential `checkCurrentUserPermission` calls; each
      re-ran `auth()` and its own `db.user.findUnique`. Now a single
      `resolveFinanceAccess("fees", FEES_ACTIONS)` — one session read, all five
      actions evaluated concurrently against a per-request-memoized user row
      (see `../lib/permissions.ts`).
- [x] **Overview stats collapsed from three round-trips to one.** The school
      row, five counts and three aggregates share no dependency and now run in
      one `Promise.all`.
- [x] **`@react-pdf/renderer` split out of the initial JS.** `receipt-pdf.tsx`
      dynamic-imports the renderer and `receipt-document` inside the click
      handler, so the PDF graph is fetched only when a receipt is downloaded.
- [x] **KPI tiles abbreviate money** — `formatCompactMoney` (SDG 10.6m,
      SDG 164.5k) instead of full digits. Tables, fines, payments and
      installment rows keep exact `formatCurrency`.

### Behavior change to be aware of

`selfHealFeeProvisioning` now runs **after** the `canView` gate instead of
before it. It still runs ahead of every count that reads the rows it repairs
(the reason it exists), but a user who cannot view fees no longer triggers it.
Admins — the only audience that ever benefited — are unaffected.

## Fee cascade — school → grade → student (rebuilt 2026-10-17)

The June "4-level inheritance" was a chain of one-time copies: a grade edit
lost its grade and was overwritten by the next Sync, a school-fee change never
reached existing students, a per-student price (`customAmount`) was stored and
never read, grade changes double-billed, and re-pricing set every instalment
invoice to the full amount (4× on quarterly fees). Rebuilt as a live cascade:

| Level   | Source of truth                         | Override flag                       | Re-priced by                                                    |
| ------- | --------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| School  | `School.tuitionFee`                     | —                                   | `updateSchoolPricing` → `provisionSchoolFees("recompute")`       |
| Grade   | auto `FeeStructure` (one per grade)     | `isLocked` (set on any amount edit) | `provisionSchoolFees` → `repriceStructureAssignments`            |
| Student | `FeeAssignment`                         | `customAmount != null`              | `repriceStructureAssignments` skips it; `recomputeAssignment`   |

- `src/lib/fee-reprice.ts` — `repriceStructureAssignments` (skips own-price,
  paid, cancelled), `recomputeAssignment`, `releaseGradeFees`.
- `resyncAssignmentInvoices` (fee-invoice-sync) re-splits open instalments by
  weight; settled ones keep their amounts. Schedules scale to `finalAmount`.
- Grade change / promotion: `ensureStudentFeeAssignments` cancels this year's
  unpaid old-grade fee first (last year's arrears stay); a cancelled fee
  revives if the student returns. `executePromotions` assigns the new grade's
  fee for the latest year when it is newer than the batch year.
- New year: `createSchoolYear` provisions the latest year (`new-scope`);
  fine-tuned grade fees carry over locked.
- UI: grade picker + Fine-tuned / Reset on the structure form;
  **Student price** card (own price, reset, discount) on
  `/finance/fees/assignments/[id]` (`fees:approve`).
- `applyScholarship` prices from the scholarship's coverage, clamped.
- `assignFee` / `bulkAssignFees` verify tenant ownership, price from the
  cascade, and create invoices.
- Removed the dead `listings/students/profile` fee tab + its unguarded actions.
- Data heal (apply branch-first): `prisma/migrations/20261017180000_fee_grade_heal`.

Open: `PricingRule` has no editor; re-pricing posts no ledger delta; auto-assign
posts no `postFeeAssignment`; admin school-wide structures stay additive on top
of the grade fee; `markInvoicePaid` bypasses `FeeAssignment.status`.

## MVP Checklist

- [x] Fee structure CRUD
- [x] Fee assignment (single + bulk)
- [x] Payment recording with partial payment tracking (via notes)
- [x] Fines and scholarships
- [x] Sibling discount calculation
- [x] Dictionary-driven notifications (`finance.notifications.feeDue*`, `paymentReceived*`, `paymentCleared*`)
- [x] Error codes via `actionError(ACTION_ERRORS.FEE_*)`
- [x] Smoke test: `/ar/finance/fees` + `/ar/finance/fees/fines` render with Arabic tabs, columns, currency (2026-04-20, demo.databayt.org)
- [x] **Currency snapshot on FeeStructure/FeeAssignment/Payment** (Aldar P1.1) — backfilled 38/5906/600
- [x] **Parent-side gateway picker** at `/finance/fees/assignments/[id]` (Aldar P0.4) — auto-routes AE → Tap-first
- [x] **Offline bank-transfer + ATM-deposit pending→cleared flow** (Aldar P2.1+P2.2) — `PENDING_VERIFICATION` status, deposit slip URL, bank branch, sender IBAN, `markPaymentCleared` action
- [x] **Server-side receipt PDF** at `/api/payment/[paymentId]/receipt` (Aldar P1.5) — branded with school logo (P2.4); status-guarded + i18n + school name/currency
- [x] **17+ tests passing** in `__tests__/actions.test.ts` (+4 markPaymentCleared)
- [x] **Fee cascade school → grade → student** — live inheritance with override flags (rebuilt 2026-10-17, see above)
- [x] **Gateway-aware fee checkout** — Tap for AED, Stripe otherwise
- [x] **Fee-overdue cron** now per-tenant (iterates all schools); mirrors OVERDUE to `UserInvoice`
- [x] **New `/api/cron/fee-due` (daily)** — upcoming-due + offer-expiry reminders per tenant
- [x] **Receipt link in my-fees view** — students/guardians can download PDF from `/finance/fees/my`
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] More test coverage (markPaymentCleared has 4; offline reference-field capture + reconciliation report uncovered)
- [ ] Fee defaulters list
- [ ] Issue #269: fee-structure-creation-as-modal UX (deferred)
- [ ] Onboarding re-provision on tuition-change (Level 1 only fires once today — deferred)

## Known Issues

### P1

- [ ] Fines overview cards hardcode English titles (`Student Assignments`, `Fine Reports`, `Fines & Penalties`, `Scholarships`) -- see `content.tsx` card section
- [ ] Fine type enum badges (`LATE FEE`, `DAMAGE FINE`, `LIBRARY FINE`, `DISCIPLINE FINE`) not translated on AR side -- map via `dictionary.finance.fees.fineTypes.*`
- [ ] Fine reason text (`Late payment penalty`, `School property damage`, etc.) stored English-only in seed data -- resolve via `getText()` or require `lang` field on Fine model
- [ ] Installment plans — **correction (2026-07-17): `FeePaymentPlan` does NOT
      exist.** Grepped the whole schema + generated client: nothing. What exists is
      `FeeStructure.paymentSchedule` (free-form JSON) + the read-only
      `installment-timeline.tsx` derived from it. Real installment plans
      (per-installment invoices, per-installment late fees) are a from-scratch
      effort, not a UI on top of an existing model.
- [ ] Fee reminders via WhatsApp (hook exists in `src/lib/whatsapp/`)
- [ ] Scholarship auto-apply based on merit / need criteria
- [ ] Fee waiver workflow distinct from scholarship

### P2

- [ ] Per-grade / per-class fee templates
- [ ] Fee refund on withdrawal
- [ ] Late fee auto-calculation

### P3

- [ ] Fee forecast vs actual report
- [ ] Class-level collection rate dashboards

## Test Gaps

- [ ] Sibling discount calc (edge case: 3+ siblings, partial enrollment)
- [ ] Scholarship coverage types (percentage / fixed / full)
- [ ] Payment partial → full transition
- [ ] Fine waive vs delete rules
