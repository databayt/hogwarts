## Banking -- Bank Accounts & Reconciliation

### Overview

Manages school bank accounts, tracks transactions, and provides a reconciliation workflow for matching book entries against bank statements. Includes an enhanced content view with reconciliation panel.

### Capabilities by Role

- **Admin/Accountant**: Full access -- create accounts, record transactions, run reconciliations, view cash position
- **Teacher/Staff/Student/Guardian**: No access (restricted to finance personnel)

### Routes

| Route                                     | Page               | Status |
| ----------------------------------------- | ------------------ | ------ |
| `.../finance/banking`                     | Banking overview   | Ready  |
| `.../finance/banking/my-banks`            | Bank account list  | Ready  |
| `.../finance/banking/transaction-history` | Transaction log    | Ready  |
| `.../finance/banking/payment-transfer`    | Initiate transfers | Ready  |

### File Structure

```
banking/
├── actions/                  # bank / transaction / transfer server actions
├── dashboard/                # banking dashboard view
├── my-banks/                 # linked-accounts list (+ Plaid sync stub)
├── payment-transfer/         # Dwolla transfer form + actions
├── transaction-history/      # transaction log
├── shared/                   # plaid-link, bank cards, charts
├── lib/                      # plaid.ts, permissions.ts, validations
├── reconciliation-panel.tsx  # Bank reconciliation UI (stubbed)
└── types/                    # type definitions
```

### Status

**Completion:** 80% | **Blockers:** Reconciliation panel stubbed; Plaid sync not implemented (needs sandbox creds); Dwolla webhook handler missing

### Conventions (dashboard)

- **Money** goes through `lib/utils.ts → formatAmount(amount, locale, currency)`, which
  delegates to `@/lib/payment/currency`. `currency` is `School.currency`, fetched once in
  `dashboard/content.tsx` and prop-drilled. Never hardcode a symbol -- `formatAmount` used to
  pin `USD` and printed `$US` to every tenant regardless of their actual currency.
- **Display name**: `User` has **no `name` column** and the session carries no display name,
  so `session.user.name` is always undefined. Read `User.username` from the DB (as
  `content.tsx` does) -- relying on `user.name` greets literally every user as "Guest".
- **Transaction categories** are raw slugs in the DB (`tuition`, `salary`, ...). Translate via
  `finance.bankingTransactions.categories.<slug>`; add a key there when a new slug appears.
- **Two `BankingDictionary` types exist** -- `types/index.ts` declares one _and_ re-exports
  `component.types.ts`. The local declaration wins, so `types/index.ts` is the live one.
  Tech debt: they should be merged.
- Dashboard chrome is deliberately **borderless** (tinted fills, not outlines). `AnimatedCounter`
  renders a `<span>`, not a `<div>` -- it sits inside a `<p>` and a block element there is a
  hydration error.

### Integration Points

- Reconciles against payroll disbursements, expense payments, fee deposits -- does **not** itself post to the ledger
- Cash flow data feeds into `finance/dashboard/`
- See [finance master README](../README.md) for architecture details
