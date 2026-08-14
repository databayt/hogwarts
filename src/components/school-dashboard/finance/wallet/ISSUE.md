# Wallet -- Readiness & Open Work

> 75% ready · Student / staff digital wallets, topup, spend, balances

## 2026-08-14 — performance pass (local, not deployed)

- [x] Overview gate collapsed from 5 sequential `checkCurrentUserPermission`
      calls to one `resolveFinanceAccess("wallet", WALLET_ACTIONS)`. Each of those calls
      re-ran `auth()` and its own user lookup; they now share one session read
      and one per-request-memoized user row (see `../lib/permissions.ts`).
      Deny UI and every permission outcome are unchanged.

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

- [x] Ledger posting wired (2026-06-21) -- `topupWallet` now calls `postWalletTopup` (fire-and-forget by design, same as the other posters); top-ups post a balanced journal entry
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
