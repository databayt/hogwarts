## Wallet -- Digital Wallet Management

### Overview

Secure digital wallet system for cashless school transactions. Supports top-ups via multiple payment methods, peer-to-peer transfers, spending limits, withdrawal processing, and complete transaction history.

### Capabilities by Role

- **Admin/Accountant**: Full access -- create wallets, set limits, view all wallets, process withdrawals
- **Teacher/Staff**: View own wallet, make transfers, request withdrawals
- **Student**: View own wallet, make transfers (within limits)
- **Guardian**: View own + children's wallets, top up children's wallets, transfer to children

### Routes

| Route                             | Page                | Status |
| --------------------------------- | ------------------- | ------ |
| `.../finance/wallet`              | Wallet overview     | Ready  |
| `.../finance/wallet/all`          | All wallets list    | Ready  |
| `.../finance/wallet/new`          | Create wallet       | Ready  |
| `.../finance/wallet/[id]`         | Wallet detail       | Ready  |
| `.../finance/wallet/transactions` | Transaction history | Ready  |

### File Structure

```
wallet/
├── actions.ts      # Server actions (top-up, transfer, withdraw, balance check)
├── config.ts       # Transaction types, payment methods, default limits
├── content.tsx     # Main wallet page (server component)
├── types.ts        # TypeScript interfaces
└── validation.ts   # Zod schemas
```

### Status

**Completion:** 65% | **Blockers:** No table/columns/form components (UI is in content.tsx); payment gateway integration not implemented; PIN verification not built; QR code payments not implemented

### Integration Points

- Students can pay fees from wallet balance
- Top-ups create journal entries (DR: Cash, CR: Unearned Revenue) via `finance/lib/accounting/`
- Transaction history feeds into `finance/reports/`
- See [finance master README](../README.md) for architecture details
