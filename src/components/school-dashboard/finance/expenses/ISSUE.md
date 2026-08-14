# Expenses -- Readiness & Open Work

> 80% ready · Expense tracking, approval workflow, categorisation

## 2026-08-14 — performance pass (local, not deployed)

- [x] Overview stats folded into one `Promise.all`, and the school row no
      longer loads ahead of the deny gate (a denied user cost a query). The school row, the counts
      and the aggregates were fetched in three serial steps though none depends on
      the one before it.

- [x] Overview gate collapsed from 5 sequential `checkCurrentUserPermission`
      calls to one `resolveFinanceAccess("expenses", EXPENSES_ACTIONS)`. Each of those calls
      re-ran `auth()` and its own user lookup; they now share one session read
      and one per-request-memoized user row (see `../lib/permissions.ts`).
      Deny UI and every permission outcome are unchanged.

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

- [x] Ledger posting wired + surfaced -- `markExpensePaid` (APPROVED→PAID, +paidAt) posts `postExpensePayment` (DR expense / CR cash); idempotent, unit-tested. The expense list (`expenses/all`) now has `ExpenseRowActions`: PENDING→Approve/Reject (`approveExpense`), APPROVED→Mark paid (`markExpensePaid`). Both actions also gained the `expenses/approve` permission gate. (2026-06-21 `5b789ec28`, `92d0ffbe6`)
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
