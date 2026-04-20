# Banking -- Readiness & Open Work

> 80% ready · Plaid integration, bank account linking, transfers, my-banks

## MVP Checklist

- [x] Plaid Link integration scaffolded
- [x] Bank account listing per tenant
- [x] Tenant isolation (all `schoolId`-scoped)
- [x] `bank-actions.tsx` uses `ERROR_MAP` + error codes (not raw English messages)
- [x] Payment-transfer flow + Dwolla SDK
- [x] AR dictionary parity (20 orphan keys filled)
- [ ] Plaid sandbox credential run on `demo.databayt.org` (needs live creds)
- [ ] Migrate `lib/validation.ts` + `payment-transfer/validation.ts` to `ValidationHelper`
- [ ] Test coverage beyond tenant isolation

## Known Issues

### P1

- [ ] Plaid live-credential flows blocked -- no dev sandbox wired in
- [ ] Dwolla webhook handler missing (status updates reach dashboard async)
- [ ] Reconciliation UI for monthly statements

### P2

- [ ] Support for ACH / SWIFT / SEPA rails alongside Plaid Link
- [ ] Bank statement import (CSV / PDF via OCR)

### P3

- [ ] Multi-bank transfer rules engine
- [ ] Recurring transfer scheduler

## Test Gaps

- [ ] Plaid callback stub tests
- [ ] Transfer failure retry logic
- [ ] Multi-bank balance aggregation
