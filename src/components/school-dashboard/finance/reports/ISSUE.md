# Reports -- Readiness & Open Work

> 75% ready · Balance sheet, P&L, trial balance, cash flow

## MVP Checklist

- [x] Balance sheet generator
- [x] Profit & Loss statement
- [x] Trial balance
- [x] Cash flow statement
- [x] General ledger drill-down
- [x] Custom report date range
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] Scheduled report export
- [ ] Cross-year comparison

## Known Issues

### P1

- [ ] Report exports (PDF / XLSX / CSV) wired to DataTable but not styled / branded
- [ ] No report email delivery
- [ ] Currency conversion for multi-currency schools broken

### P2

- [ ] Custom report builder UI (pick columns, filters, groupings)
- [ ] Report saved views
- [ ] Report parameter memory (last-used date range)

### P3

- [ ] Report annotations (user can pin notes on rows)
- [ ] Report sharing links (read-only URL)
- [ ] Benchmark reports across departments / years

## Test Gaps

- [ ] Balance sheet invariants (assets = liabilities + equity)
- [ ] P&L period aggregation correctness
- [ ] Trial balance debit = credit total
- [ ] Report export format integrity
