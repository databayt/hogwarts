# Banking -- Readiness & Open Work

> 80% ready · Plaid integration, bank account linking, transfers, my-banks

## 2026-08-14 — performance pass + findings (local, not deployed)

- [x] Total-balance stat tile abbreviates money. `AnimatedCounter` gained a
      `compact` prop; the dashboard hero passes it, so the count-up animates in
      `SDG 16.4m` rather than nine digits. Amounts under 10,000 stay exact.
- [x] Reviewed the server path and left it alone: `getAccounts` / `getAccount`
      are already `react` `cache()`-memoized and the dashboard already resolves
      the school row, profile and accounts in one `Promise.all`.

### The three findings above — all fixed the same day

1. **[x] Transaction history no longer truncates at 5 rows per account.**
   The list was stitched from `getAccounts()`, whose include is
   `transactions: { take: 5 }`, then paginated client-side at 20/page — so the
   pager was decorative and the page silently omitted history. History now
   comes from `transaction-history/queries.ts` (`server-only`, NOT the
   `"use server"` actions module — a read is not a public POST endpoint),
   ownership-scoped from the session and `schoolId`-scoped, newest first.
   Demo went from **5 visible rows to all 100, across 5 working pages**.
   - The window is `TRANSACTION_WINDOW = 500` and is **stated in the UI**
     ("showing the most recent 500 of N") whenever it bites. A silent cap is
     what caused this bug; do not reintroduce one.
   - The pager buttons called an optional `onPageChange` that no caller ever
     passed — they were inert. Paging is now local state (a URL round-trip
     would re-render the route just to reorder rows the browser already has).
   - `safePage` clamps: narrowing a filter while on page 5 used to be able to
     strand the viewer on an empty table.
   - Two bugs found while verifying, both pre-existing and both fixed here:
     `<SelectItem value="">` for "All Accounts" **crashed the whole route**
     via the error boundary for any user with >1 linked account (Radix
     reserves the empty value), and amounts rendered `$` because the table
     called `formatAmount` without a currency. Rows now format in their own
     `isoCurrencyCode`, which the DB already carried.
   - The mapper in `queries.ts` is not ceremony: the Prisma row and the view
     `Transaction` genuinely differ (flat `location*` columns vs a nested
     object, `subcategory` string vs list, `amount` Decimal vs number). The
     old path hid the mismatch behind `parseStringify`, which is why the
     details sheet's Location block could never render.
2. **[x] `payment-transfer` renders the school's currency.** Both the content
   tile and the form had their own hardcoded-USD formatters (the form's even
   shadowed the shared `formatAmount`), plus a hardcoded `$` on the amount
   input. All three now derive from `School.currency`, fetched in the server
   component like the banking dashboard does. Kept **exact**, not compact — a
   transfer is a reconcile-against surface.
3. **[x] `TotalBalanceBox` + `DoughnutChart` deleted**, along with their
   orphaned `component.types.ts` interfaces, and `chart.js` +
   `react-chartjs-2` removed from `package.json`.

### Still dead, flagged not deleted

`hooks/use-url-state.ts` and `hooks/use-transaction-filter.ts` have no
importers anywhere in the repo. They read as deliberate infrastructure (the
filter hook duplicates what `transaction-history/table.tsx` does inline), so
deleting them is an owner call rather than cleanup.

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
