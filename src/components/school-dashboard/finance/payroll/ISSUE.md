# Payroll -- Readiness & Open Work

> 80% ready · Payroll runs, salary slips, approval, disbursement

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

- [ ] No payslip PDF -- staff has no document to download
- [ ] Disbursement is single-step "PAID"; no actual bank file export
- [ ] Withholding tax brackets hard-coded to 0 -- country-specific rules missing

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
