# Budget -- Readiness & Open Work

> 85% ready · Budget categories, allocation, variance tracking

## 2026-08-14 — performance pass (local, not deployed)

- [x] Overview stats folded into one `Promise.all`, and the school row no
      longer loads ahead of the deny gate (a denied user cost a query). The school row, the counts
      and the aggregates were fetched in three serial steps though none depends on
      the one before it.

- [x] Overview gate collapsed from 5 sequential `checkCurrentUserPermission`
      calls to one `resolveFinanceAccess("budget", BUDGET_ACTIONS)`. Each of those calls
      re-ran `auth()` and its own user lookup; they now share one session read
      and one per-request-memoized user row (see `../lib/permissions.ts`).
      Deny UI and every permission outcome are unchanged.

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
