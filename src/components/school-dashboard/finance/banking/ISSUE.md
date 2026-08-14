# Banking -- Readiness & Open Work

> 80% ready · Plaid integration, bank account linking, transfers, my-banks

## 2026-08-14 — performance pass + findings (local, not deployed)

- [x] Total-balance stat tile abbreviates money. `AnimatedCounter` gained a
      `compact` prop; the dashboard hero passes it, so the count-up animates in
      `SDG 16.4m` rather than nine digits. Amounts under 10,000 stay exact.
- [x] Reviewed the server path and left it alone: `getAccounts` / `getAccount`
      are already `react` `cache()`-memoized and the dashboard already resolves
      the school row, profile and accounts in one `Promise.all`.

### Found, NOT fixed — needs a decision

1. **Transaction history shows at most 5 transactions per account.**
   `transaction-history/content.tsx` builds its list from `getAccounts()`,
   whose include is `transactions: { take: 5 }`. The table then paginates that
   list client-side at 20/page, so the pager is decorative and the page
   silently omits history. This is a correctness bug, not a performance one —
   fixing it means a real paginated query (`skip`/`take` + a total count) and
   moving the table from client-side to server-side pagination.
2. **`payment-transfer/content.tsx:139` hardcodes USD.** A local
   `formatCurrency` helper ignores `School.currency`, so the available-balance
   tile prints the wrong symbol for every non-USD school. Violates the
   per-school-currency rule in the block `CLAUDE.md`. Needs `currency` threaded
   into the component.
3. **`TotalBalanceBox` → `DoughnutChart` is dead code.** Nothing imports
   `TotalBalanceBox`; it is the only consumer of `DoughnutChart`, which is the
   only consumer of `chart.js` and `react-chartjs-2`. Deleting the two files
   would make both dependencies removable. Left in place — dropping packages
   changes the lockfile and is the owner's call.

## MVP Checklist

- [x] Plaid Link integration scaffolded
- [x] Bank account listing per tenant
- [x] Tenant isolation (all `schoolId`-scoped)
- [x] `bank-actions.tsx` uses `ERROR_MAP` + error codes (not raw English messages)
- [x] Payment-transfer flow + Dwolla SDK
- [x] AR dictionary parity (20 orphan keys filled)
- [x] Dashboard renders in `School.currency` (was hardcoded `USD` in `formatAmount`)
- [x] Transaction categories translated (13 keys under `bankingTransactions.categories`)
- [x] Greeting shows the real user name (was "Guest" for **every** user)
- [ ] Plaid sandbox credential run on `demo.databayt.org` (needs live creds)
- [ ] Migrate `lib/validation.ts` + `payment-transfer/validation.ts` to `ValidationHelper`
- [ ] Test coverage beyond tenant isolation

## Resolved (2026-08-14) — revalidatePath targets that never matched

Both calls targeted `/[lang]/banking` — **no such route**. Banking lives at
`/[lang]/s/[subdomain]/finance/banking` (+ `/my-banks`); the calls were missing
the tenant segments and the `finance/` parent, and passed no `type`. Fixed to the
real route patterns with `"page"`.

Context and the repo-wide count live in `.claude/findings/revalidate-path-repo-wide.md`.
**Not a live bug today**: `pnpm build` reports 691 of 692 routes as `ƒ` (dynamic),
so nothing was cached to go stale. It becomes load-bearing the day any of these
routes adopt `'use cache'` / Cache Components — so the paths are correct now.

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
