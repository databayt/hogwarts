# Wallet -- Readiness & Open Work

> 75% ready · Student / staff digital wallets, topup, spend, balances

## MVP Checklist

- [x] Wallet CRUD per user
- [x] Balance accrual from payments
- [x] Topup flow
- [x] Tenant isolation
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] Refund workflow
- [ ] Low-balance alerts
- [ ] Wallet-to-bank sweeps

## Known Issues

### P1

- [ ] Ledger posting not wired -- `postWalletTopup` has zero callers, top-ups don't post (umbrella ISSUE.md P0)
- [ ] No refund flow -- overpaid topups must be reversed manually via journal entry
- [ ] No low-balance threshold alerts (parent / student unaware until transaction fails)
- [ ] Wallet-to-bank sweep (move excess wallet funds back to linked bank) not implemented

### P2

- [ ] Spending limit per day / per transaction
- [ ] Transaction history filter (date range, merchant, category)
- [ ] Auto-topup rule (when balance < X, topup Y)

### P3

- [ ] Family wallet (shared among siblings)
- [ ] Wallet-to-wallet peer transfer
- [ ] QR-code payment at school canteen / uniform shop

## Test Gaps

- [ ] Topup + balance accrual correctness
- [ ] Spend rejects when balance insufficient
- [ ] Refund flow preserves journal-entry parity
- [ ] Tenant isolation on balance queries
