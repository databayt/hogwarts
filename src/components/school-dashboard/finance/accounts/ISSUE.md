# Accounts -- Readiness & Open Work

> 75% ready · Chart of accounts, GL codes, journal entries

## MVP Checklist

- [x] CRUD for Account / AccountType / GL codes
- [x] Tenant isolation on every query (`schoolId`)
- [x] RBAC enforcement via `checkCurrentUserPermission`
- [x] Journal entry listing with double-entry balance enforcement
- [x] Dictionary-backed UI labels
- [ ] Migrate `validation.ts` to `ValidationHelper` factory (scaffold exists, consumers don't call it)
- [ ] Test coverage (currently 0 tests)
- [ ] Multi-currency journal entries (current: single currency per journal)
- [ ] Period-close workflow (archive old entries, lock fiscal year)

## Known Issues

### P1

- [ ] `validation.ts` still uses hardcoded Zod messages in `actions.ts` consumer
- [ ] No audit trail for chart-of-accounts edits (regulatory need)

### P2

- [ ] Sub-ledger (customer / vendor) drill-down from GL
- [ ] Account reconciliation against bank statement

### P3

- [ ] Account hierarchy tree view
- [ ] Export chart of accounts to CSV

## Test Gaps

- [ ] `actions.test.ts` -- create/update/delete, tenant isolation, permission denial
- [ ] Journal balance invariant -- assert debit total = credit total in every entry
- [ ] Posting-rule integration -- fee payment → journal entry end-to-end
