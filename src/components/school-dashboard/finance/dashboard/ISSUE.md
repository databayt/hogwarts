# Dashboard -- Readiness & Open Work

> 90% ready · KPI cards, revenue/expense charts, cash flow, transactions list

## MVP Checklist

- [x] KPI cards role-scoped (Admin/Accountant/Teacher/Student/Guardian)
- [x] Revenue, expense, cash-flow charts
- [x] Recent transactions list
- [x] Bank accounts summary
- [x] Budget overview
- [x] Currency driven by `School.currency` (not hardcoded `SDG`/`$`)
- [x] Date formatting passes locale from `date-fns/locale`
- [x] `formatMoney` / `formatCurrency` in `lib/format.ts`
- [x] AR dictionary parity for `common.error*` keys
- [ ] Real-time cache refresh (currently full-page SSR)
- [ ] Test coverage

## Known Issues

### P1

- [ ] Chart rendering performance on very large fiscal year data (>10k transactions)
- [ ] Dashboard-wide currency switcher (currently read-only from school settings)

### P2

- [ ] Custom KPI selection per user
- [ ] Dashboard snapshot export (PDF / PNG)

### P3

- [ ] Comparison mode: this period vs last period
- [ ] Predictive cash-flow forecast

## Test Gaps

- [ ] KPI aggregation correctness across date ranges
- [ ] Role-based visibility (Teacher doesn't see total revenue)
- [ ] Currency formatting in both `ar-SA` and `en-US`
