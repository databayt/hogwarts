# Fees -- Readiness & Open Work

> 92% ready · Fee structures, assignments, payments, fines, scholarships
>
> Aldar UAE source of truth: [hogwarts#356](https://github.com/databayt/hogwarts/issues/356)

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
- [x] **Server-side receipt PDF** at `/api/payment/[paymentId]/receipt` (Aldar P1.5) — branded with school logo (P2.4)
- [x] **17 tests passing** in `__tests__/actions.test.ts` (+4 markPaymentCleared)
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] More test coverage (markPaymentCleared has 4; offline reference-field capture + reconciliation report uncovered)
- [ ] Fee defaulters list (#56)

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
