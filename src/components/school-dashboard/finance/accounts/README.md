## Accounts -- Chart of Accounts & General Ledger

### Overview

Core double-entry bookkeeping system providing the chart of accounts, journal entries, general ledger, and trial balance. Serves as the accounting foundation that all other finance sub-blocks post transactions to.

### Capabilities by Role

- **Admin/Accountant**: Full CRUD on accounts and journal entries, period closing, ledger review
- **Teacher/Staff**: No access
- **Student/Guardian**: No access

### Routes

| Route                              | Page                   | Status |
| ---------------------------------- | ---------------------- | ------ |
| `.../finance/accounts`             | Accounts overview      | Ready  |
| `.../finance/accounts/chart`       | Chart of accounts list | Ready  |
| `.../finance/accounts/chart/new`   | Create account         | Ready  |
| `.../finance/accounts/journal`     | Journal entries list   | Ready  |
| `.../finance/accounts/journal/new` | Create journal entry   | Ready  |
| `.../finance/accounts/ledger`      | General ledger         | Ready  |

### File Structure

```
accounts/
├── actions.ts      # Server actions (CRUD, journal posting)
├── config.ts       # Account type enums, standard codes
├── content.tsx     # Main accounts page (server component)
├── types.ts        # TypeScript interfaces
└── validation.ts   # Zod schemas for account/journal entry creation
```

### Status

**Completion:** 70% | **Blockers:** Period closing workflow not yet implemented; financial statement generation lives in reports sub-block

### Integration Points

- Posts journal entries via `finance/lib/accounting/`
- Account codes referenced by all other finance sub-blocks
- Trial balance feeds into `finance/reports/`
- See [finance master README](../README.md) for architecture details
