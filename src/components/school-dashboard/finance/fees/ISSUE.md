# Fees -- Readiness & Open Work

> 96% ready · Fee structures, assignments, payments, fines, scholarships
>
> Last updated: 2026-06-13
> Aldar UAE source of truth: [hogwarts#356](https://github.com/databayt/hogwarts/issues/356)

## 4-Level Fee Inheritance (owner's core spec — shipped 2026-06-13)

The fee system enforces a strict four-level cascade. All four levels are now implemented:

| Level | Name                                      | Trigger                                            | Scope                                                                                                                    |
| ----- | ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1     | Onboarding auto-provision                 | School completes pricing step in onboarding wizard | Auto-creates one `FeeStructure` per grade per fee type; zero manual setup                                                |
| 2     | Per-grade fine-tune                       | ADMIN/ACCOUNTANT edits a grade's FeeStructure      | Applies to new assignments only; does not retroactively touch existing students                                          |
| 3     | `propagateFeeStructureChange` cascade     | Grade FeeStructure is updated                      | Cascades to all uncollected `FeeAssignment` rows for that grade, preserving each student's existing per-student discount |
| 4     | `updateFeeAssignmentDiscount` per-student | ADMIN/ACCOUNTANT adjusts one student's discount    | Touches only that `FeeAssignment`; grade structure and other students unchanged                                          |

**Key invariant**: collected (paid/partially-paid) assignments are never overwritten by Level 3 cascade.
**Currency snapshot**: recorded on `FeeAssignment` at creation time (Level 1+2); cannot drift if school changes currency later.
**Gateway-aware checkout**: `createFeePaymentCheckout` auto-routes AED-currency schools to Tap; others use Stripe.

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
- [x] **4-level fee inheritance** — onboarding auto-provision (L1), per-grade tune (L2), `propagateFeeStructureChange` cascade preserving per-student discounts (L3), `updateFeeAssignmentDiscount` per-student (L4)
- [x] **Gateway-aware fee checkout** — Tap for AED, Stripe otherwise
- [x] **Fee-overdue cron** now per-tenant (iterates all schools); mirrors OVERDUE to `UserInvoice`
- [x] **New `/api/cron/fee-due` (daily)** — upcoming-due + offer-expiry reminders per tenant
- [x] **Receipt link in my-fees view** — students/guardians can download PDF from `/finance/fees/my`
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] More test coverage (markPaymentCleared has 4; offline reference-field capture + reconciliation report uncovered)
- [ ] Fee defaulters list (#56)
- [ ] Issue #269: fee-structure-creation-as-modal UX (deferred)
- [ ] Onboarding re-provision on tuition-change (Level 1 only fires once today — deferred)

## Known Issues

### P1

- [ ] Fines overview cards hardcode English titles (`Student Assignments`, `Fine Reports`, `Fines & Penalties`, `Scholarships`) -- see `content.tsx` card section
- [ ] Fine type enum badges (`LATE FEE`, `DAMAGE FINE`, `LIBRARY FINE`, `DISCIPLINE FINE`) not translated on AR side -- map via `dictionary.finance.fees.fineTypes.*`
- [ ] Fine reason text (`Late payment penalty`, `School property damage`, etc.) stored English-only in seed data -- resolve via `getText()` or require `lang` field on Fine model
- [ ] Installment plans (schema: `FeePaymentPlan` exists, no UI flow)
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
