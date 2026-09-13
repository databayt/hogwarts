# Salary -- Readiness & Open Work

> 75% ready · Salary structures, allowances, deductions, bands

## 2026-09-13 — phone grid (local, not pushed)

- Salary structures' table/grid toggle switched to nothing; it renders `TableGrid` cards now
  (teacher, base salary in the row's currency, active + pay-frequency chips, effective date,
  the row's own actions menu) and a phone opens on them. `columns.tsx` still formats
  `effectiveFrom` with `ar-SA` (Hijri) — open.

## 2026-08-14 — performance pass (local, not deployed)

- [x] Overview gate collapsed from four serialized `checkCurrentUserPermission`
      calls to one `resolveFinanceAccess("salary", SALARY_ACTIONS)`.
- [x] Overview stats collapsed from three round-trips to one `Promise.all`
      (school row + four counts + the salary aggregate were serialized).
- [x] KPI tiles abbreviate money via `formatCompactMoney` (SDG 16.4m,
      SDG 164.5k). `columns.tsx` keeps exact per-row currency.

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
