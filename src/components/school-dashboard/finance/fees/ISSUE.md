# Fees -- Readiness & Open Work

> 85% ready · Fee structures, assignments, payments, fines, scholarships

## MVP Checklist

- [x] Fee structure CRUD
- [x] Fee assignment (single + bulk)
- [x] Payment recording with partial payment tracking (via notes)
- [x] Fines and scholarships
- [x] Sibling discount calculation
- [x] Dictionary-driven notifications (`finance.notifications.feeDue*`, `paymentReceived*`)
- [x] Error codes via `actionError(ACTION_ERRORS.FEE_*)`
- [x] Smoke test: `/ar/finance/fees` + `/ar/finance/fees/fines` render with Arabic tabs, columns, currency (2026-04-20, demo.databayt.org)
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] Fee defaulters list (#56)

## Known Issues

### P1

- [ ] Fines overview cards hardcode English titles (`Student Assignments`, `Fine Reports`, `Fines & Penalties`, `Scholarships`) -- see `content.tsx` card section
- [ ] Fine type enum badges (`LATE FEE`, `DAMAGE FINE`, `LIBRARY FINE`, `DISCIPLINE FINE`) not translated on AR side -- map via `dictionary.finance.fees.fineTypes.*`
- [ ] Fine reason text (`Late payment penalty`, `School property damage`, etc.) stored English-only in seed data -- resolve via `getDisplayText()` or require `lang` field on Fine model
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
