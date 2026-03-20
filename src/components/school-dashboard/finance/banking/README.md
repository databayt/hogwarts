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
├── content-enhanced.tsx      # Enhanced banking dashboard
├── reconciliation-panel.tsx  # Bank reconciliation UI
└── types/
    ├── index.ts              # Type barrel export
    ├── bank.types.ts         # Bank account & transaction types
    ├── actions.types.ts      # Server action param/return types
    ├── component.types.ts    # Component prop types
    └── utils.types.ts        # Utility types
```

### Status

**Completion:** 65% | **Blockers:** No dedicated `actions.ts` -- server actions likely embedded in enhanced content or pending extraction; bank API integration (Plaid/Dwolla) not implemented

### Integration Points

- Journal entries via `finance/lib/accounting/`
- Reconciles against payroll disbursements, expense payments, fee deposits
- Cash flow data feeds into `finance/dashboard/`
- See [finance master README](../README.md) for architecture details
