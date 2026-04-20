# Budget -- Readiness & Open Work

> 85% ready · Budget categories, allocation, variance tracking

## MVP Checklist

- [x] Category CRUD with `schoolId` isolation
- [x] Allocation + spent tracking
- [x] Variance calculation (allocated vs spent)
- [x] Factory validation `createBudgetSchema(v)` exported from `validation.ts`
- [x] Dictionary-backed UI
- [ ] Consumer `form.tsx` / `actions.ts` call the factory (currently legacy static `budgetSchema` still imported)
- [ ] Test coverage
- [ ] Budget approval workflow
- [ ] Multi-period budgets (quarterly / annual)

## Known Issues

### P1

- [ ] Variance-alert notifications (threshold crossed → dispatch) -- not wired
- [ ] Budget vs actual report page (data exists, no UI)

### P2

- [ ] Recurring budget templates (roll over year on year)
- [ ] Budget revision history (track changes, revert)

### P3

- [ ] Budget import from spreadsheet
- [ ] Category benchmarking across schools (platform-admin only)

## Test Gaps

- [ ] Category CRUD + tenant isolation
- [ ] Variance math (overspent, underspent, on-track thresholds)
- [ ] Allocation across sub-categories
