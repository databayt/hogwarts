# Finance -- Readiness & Open Work

> Last updated: 2026-04-20 · 85% ready · 14 sub-modules

**Status banner**

| Sub-module  | Code | i18n | Tests | Docs |
| ----------- | ---- | ---- | ----- | ---- |
| accounts    | ✅   | ⚠️   | ❌    | ✅   |
| banking     | ✅   | ⚠️   | 🟡    | ✅   |
| budget      | ✅   | ✅   | ❌    | ✅   |
| dashboard   | ✅   | ✅   | ❌    | ✅   |
| expenses    | ✅   | ⚠️   | ❌    | ✅   |
| fees        | ✅   | ✅   | ❌    | ✅   |
| invoice     | ✅   | ⚠️   | 🟢    | ✅   |
| payroll     | ✅   | ✅   | ❌    | ✅   |
| permissions | ✅   | ⚠️   | ❌    | ✅   |
| receipt     | ✅   | ✅   | ❌    | ✅   |
| reports     | ✅   | ⚠️   | ❌    | ✅   |
| salary      | ✅   | ✅   | ❌    | ✅   |
| timesheet   | ✅   | ⚠️   | ❌    | ✅   |
| wallet      | ✅   | ⚠️   | ❌    | ✅   |

Legend: ✅ = ready · ⚠️ = validation schemas still use hardcoded English · 🟢 = 131 tests passing · 🟡 = tenant isolation tests only · ❌ = none

## MVP Checklist

- [x] Currency driven by `School.currency` everywhere -- no `$` or `SDG` hardcodes
- [x] All `date-fns format()` calls pass locale from `date-fns/locale`
- [x] 24 orphan AR dictionary keys filled (banking + common.error\*)
- [x] Server actions use `actionError(ACTION_ERRORS.*)` + client `ERROR_MAP`
- [x] Notification dispatch uses `finance.notifications.*` keys (no bilingual ternaries)
- [x] Locale-aware formatters in `lib/format.ts`
- [ ] 11 `validation.ts` factories wired to `ValidationHelper` in consumers
- [ ] Playwright MCP smoke on `demo.databayt.org` for 14 sub-module flows (AR + EN)
- [ ] Test coverage for accounts / budget / expenses / payroll / permissions / receipt / reports / salary / timesheet / wallet
- [ ] PDF rendering for invoice + receipt
- [ ] Plaid live-credential sandbox run

## Known Issues (roll-up)

See per-sub-module `ISSUE.md` for detail.

**P0 (shipping blockers)**: none at the block level

**P1 (needs attention)**

- Invoice PDF wiring (#52) -- infrastructure exists at `file/generate/`, not connected
- Fee defaulters list (#56) -- no UI for overdue fee view
- Stripe Connect live webhook wiring (#42) -- sandbox only
- Test coverage gap -- 12 of 14 sub-modules have zero tests
- `validation.ts` factories still uncalled by consumers in 11 sub-modules

**P2 (backlog)**

- Recurring invoices
- Bulk import for expenses (CSV)
- Installment plans for fees
- Salary increment automation
- Payslip PDF generation
- Scheduled report exports
- Wallet refund workflow
- Audit log for permission changes

## Sub-module Ship Issues

- [ ] [Accounts](./accounts/ISSUE.md)
- [ ] [Banking](./banking/ISSUE.md)
- [ ] [Budget](./budget/ISSUE.md)
- [ ] [Dashboard](./dashboard/ISSUE.md)
- [ ] [Expenses](./expenses/ISSUE.md)
- [ ] [Fees](./fees/ISSUE.md)
- [ ] [Invoice](./invoice/ISSUE.md)
- [ ] [Payroll](./payroll/ISSUE.md)
- [ ] [Permissions](./permissions/ISSUE.md)
- [ ] [Receipt](./receipt/ISSUE.md)
- [ ] [Reports](./reports/ISSUE.md)
- [ ] [Salary](./salary/ISSUE.md)
- [ ] [Timesheet](./timesheet/ISSUE.md)
- [ ] [Wallet](./wallet/ISSUE.md)

## Test Coverage

| Module     | LOC tests | Status                         |
| ---------- | --------- | ------------------------------ |
| invoice    | 2059      | 131 tests passing, 0 TS errors |
| banking    | ~200      | tenant-isolation only          |
| all others | 0         | none                           |

## Recent Work (2026-04-20)

- Locale-aware currency + date formatting across 16 sites
- 24 orphan AR dictionary keys added
- `en-US` locale pin removed in invoice action
- Error-code pattern + client ERROR_MAP in banking, invoice, receipt, fees, payroll
- Bilingual ternary sentences replaced with dictionary-driven notifications
- `finance/CLAUDE.md` created
- `school-dashboard/CLAUDE.md` sub-module count corrected (13 → 14)

## Dependencies

- Next.js 16, React 19, Prisma 6, TypeScript 5
- Stripe (@stripe/stripe-js, stripe server SDK)
- Plaid (plaid + react-plaid-link)
- @react-pdf/renderer (invoice/receipt PDF -- not wired yet)
- date-fns (with ar/enUS locales)
- resend (invoice email)
- nuqs (URL state for DataTables)

## Acceptance Criteria

Every sub-module must:

1. Use `getTenantContext()` for `schoolId` (never raw session)
2. Check RBAC via `checkCurrentUserPermission()` for mutations
3. Return `ActionResponse<T>` via `actionError(ACTION_ERRORS.*)` -- no hardcoded English
4. Wrap multi-record writes in `db.$transaction`
5. Support Arabic + English through `getDictionary(lang)`
6. Accept `currency` (from `School.currency`) and `lang` props for all money/date rendering
