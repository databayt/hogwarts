# Payroll -- Readiness & Open Work

> 65% ready · Payroll runs, salary slips, approval, disbursement

## 2026-08-14 — performance pass (local, not deployed)

- [x] Overview stats folded into one `Promise.all` (school row + six counts).
- [x] **"This month" was computed in the SERVER's timezone.** The monthly
      payroll total bounded its aggregate with `new Date()` + `setDate(1)` +
      `setHours(0,0,0,0)`, which resolve against the server's zone — UTC on
      Vercel. For any school east or west of UTC the boundary sat hours away
      from the school's real month start, so slips near the edge landed in the
      wrong month's figure. Now derived from `School.timezone` via
      `schoolCalendarDayOf` + `schoolWallTimeToUtc`; for a UTC+4 school the
      boundary moves from `2026-08-01T00:00Z` to `2026-07-31T20:00Z`.
      Same bug class as the conference scheduling fix — the helpers in
      `src/lib/timezone.ts` exist for exactly this.
      **Sibling risk: any other finance figure scoped to "this month" or
      "today" that builds its bound with `new Date()` + `setHours` has it too.**

- [x] Overview gate collapsed from 4 sequential `checkCurrentUserPermission`
      calls to one `resolveFinanceAccess("payroll", PAYROLL_ACTIONS)`. Each of those calls
      re-ran `auth()` and its own user lookup; they now share one session read
      and one per-request-memoized user row (see `../lib/permissions.ts`).
      Deny UI and every permission outcome are unchanged.

## MVP Checklist

- [x] Payroll run creation + processing
- [x] Salary slip generation per teacher
- [x] Approval workflow with rejection → DRAFT rollback
- [x] Disbursement marks slips PAID
- [x] Dictionary-driven notifications (`payrollReadyForApproval*`, `payrollApproved*`, `payrollRejected*`, `salaryPaid*`)
- [x] Error codes via `actionError(ACTION_ERRORS.PAYROLL_*)`
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] Payslip PDF generation
- [ ] Bank-transfer batch files (SWIFT / ACH)

## Known Issues

### P1

- [x] Ledger posting wired -- `processPayments` (disbursement) posts `postSalaryPayment` per paid slip after the unbalanced posting rule was fixed (DR Salary Expense / CR Cash + Tax/SS/AP); idempotent, unit-tested (2026-06-21 `771166fc7`)
- [ ] No payslip PDF -- staff has no document to download
- [ ] Disbursement is single-step "PAID"; no actual bank file export
- [x] Withholding tax now progressive — marginal `calculateProgressiveTax` over `config.TAX_BRACKETS` (was flat 15%); unit-tested (2026-06-20 `e637129ee`)

### P2

- [ ] Multi-currency payroll (expat staff paid in USD)
- [ ] Overtime rules engine
- [ ] Pro-rata salary for partial-month joiners

### P3

- [ ] Year-end tax statement generation
- [ ] Compare planned vs actual payroll cost by department

## Test Gaps

- [ ] Approval / rejection state transitions
- [ ] Disbursement idempotency (same run can't disburse twice)
- [ ] Journal entry integrity (debit = credit for each slip)
- [ ] Tax + allowance + deduction math
