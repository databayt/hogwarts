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

### Integration Points

- Reconciles against payroll disbursements, expense payments, fee deposits -- does **not** itself post to the ledger
- Cash flow data feeds into `finance/dashboard/`
- See [finance master README](../README.md) for architecture details
