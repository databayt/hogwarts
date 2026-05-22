# Salary -- Readiness & Open Work

> 75% ready · Salary structures, allowances, deductions, bands

## MVP Checklist

- [x] Salary structure CRUD (basic + allowances + deductions)
- [x] Currency-aware salary ranges via `getSalaryRanges(locale, currency)` factory
- [x] Tenant isolation
- [x] Dictionary-backed UI labels
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] Increment automation
- [ ] Country-specific tax brackets

## Known Issues

### P1

- [ ] `config.ts` salary range seed is static -- no UI to edit bands
- [ ] No salary history -- previous structure vanishes on update
- [ ] Allowance rules are lump-sum; no formulas (e.g., `housing = 20% of basic`)

### P2

- [ ] Annual increment scheduler
- [ ] Promotion-driven salary change workflow
- [ ] Bonus-on-top-of-structure handling

### P3

- [ ] Benchmarking vs market data
- [ ] Compensation report per department
- [ ] Salary negotiation tracker (offer → counter → accepted)

## Test Gaps

- [ ] Structure CRUD + tenant isolation
- [ ] Currency conversion for expat structures
- [ ] Derived fields (gross = basic + allowances, net = gross - deductions)
