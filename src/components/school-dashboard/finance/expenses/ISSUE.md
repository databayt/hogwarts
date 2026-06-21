# Expenses -- Readiness & Open Work

> 80% ready · Expense tracking, approval workflow, categorisation

## MVP Checklist

- [x] Expense CRUD with `schoolId` isolation
- [x] Category assignment
- [x] Approval state machine
- [x] Integration with budget allocation
- [ ] Migrate `validation.ts` to `ValidationHelper` factory
- [ ] Test coverage
- [ ] Bulk CSV import
- [ ] Expense-to-receipt linking (OCR matching)

## Known Issues

### P1

- [x] Ledger posting wired -- `markExpensePaid` (APPROVED→PAID, +paidAt) posts `postExpensePayment` (DR expense / CR cash); idempotent, unit-tested. Backend only: the expenses block has no list/row-action UI yet (`approveExpense` is also UI-orphaned), so the trigger awaits an expense list build. (2026-06-21 `5b789ec28`)
- [ ] Approval routing rules (by amount threshold, by category)
- [ ] Email notification on approval state change
- [ ] Bulk categorisation / reassign category

### P2

- [ ] Recurring expenses (rent, subscriptions)
- [ ] Mileage expense calculator
- [ ] Per-diem expense templates

### P3

- [ ] AI-assisted categorisation
- [ ] Expense policy violation flagging

## Test Gaps

- [ ] Expense CRUD + tenant isolation
- [ ] Approval state transitions (draft → pending → approved → paid)
- [ ] Budget deduction on approval
