# Chart of Accounts & General Ledger

Double-entry bookkeeping system with chart of accounts, journal entries, and general ledger management.

## Overview

The Accounts module provides the foundation for all financial transactions using double-entry accounting principles. It maintains the chart of accounts, records journal entries, and generates the general ledger.

## Key Features

### 1. Chart of Accounts
- Hierarchical account structure
- Standard account types (Assets, Liabilities, Equity, Revenue, Expenses)
- Custom account creation
- Account categorization and grouping

### 2. Journal Entries
- Double-entry bookkeeping
- Manual and automatic entries
- Recurring journal entries
- Reversing entries
- Adjusting entries

### 3. General Ledger
- Complete transaction history by account
- Running balances
- Trial balance generation
- Period closing
- Audit trail

### 4. Financial Statements
- Income Statement (P&L)
- Balance Sheet
- Statement of Cash Flows
- Statement of Changes in Equity

### 5. Period Management
- Monthly/quarterly/annual periods
- Period closing workflow
- Post-closing trial balance
- Year-end procedures

## Account Types

| Type | Normal Balance | Examples |
|------|----------------|----------|
| **ASSET** | Debit | Cash, Bank, Accounts Receivable, Fixed Assets |
| **LIABILITY** | Credit | Accounts Payable, Loans, Accrued Expenses |
| **EQUITY** | Credit | Capital, Retained Earnings |
| **REVENUE** | Credit | Tuition, Fees, Donations |
| **EXPENSE** | Debit | Salaries, Utilities, Supplies |

## Standard Chart of Accounts

### Assets (1000-1999)
- 1000: Cash & Bank
  - 1010: Petty Cash
  - 1020: Operating Account
  - 1030: Payroll Account
- 1200: Accounts Receivable
  - 1210: Student Fees Receivable
  - 1220: Other Receivables
- 1500: Fixed Assets
  - 1510: Buildings
  - 1520: Equipment
  - 1530: Furniture
- 1600: Accumulated Depreciation

### Liabilities (2000-2999)
- 2000: Accounts Payable
- 2100: Accrued Expenses
- 2200: Unearned Revenue (Advance Fees)
- 2500: Loans Payable

### Equity (3000-3999)
- 3000: Capital
- 3100: Retained Earnings
- 3900: Current Year Earnings

### Revenue (4000-4999)
- 4000: Tuition Revenue
- 4100: Registration Fees
- 4200: Cafeteria Revenue
- 4300: Transportation Revenue
- 4900: Other Revenue

### Expenses (5000-9999)
- 5000: Salaries & Wages
- 5100: Employee Benefits
- 6000: Operating Expenses
- 7000: Utilities
- 8000: Depreciation
- 9000: Other Expenses

## Server Actions

### Chart of Accounts Management

#### `createAccountWithRBAC(data)`
**Permissions Required:** `accounts:create`

**Example:**
```typescript
const result = await createAccountWithRBAC({
  accountCode: "1040",
  accountName: "Savings Account",
  accountType: "ASSET",
  parentAccountId: "1000",
  description: "Reserve savings account"
})
```

### Journal Entry Management

#### `createJournalEntryWithRBAC(data)`
**Permissions Required:** `accounts:create`

**Example:**
```typescript
const result = await createJournalEntryWithRBAC({
  entryDate: new Date("2024-11-15"),
  description: "Record November tuition revenue",
  reference: "INV-2024-1001",
  lines: [
    {
      accountId: "1020", // Operating Account
      debit: 50000,
      credit: 0,
      description: "Tuition received"
    },
    {
      accountId: "4000", // Tuition Revenue
      debit: 0,
      credit: 50000,
      description: "November tuition"
    }
  ]
})
```

**Validation:**
- Total debits must equal total credits
- At least 2 lines required
- All accounts must exist and be active

## Double-Entry Bookkeeping

Every transaction affects at least 2 accounts:

### Common Journal Entries

**1. Record Tuition Revenue**
```
Dr. Cash/Bank                 $10,000
  Cr. Tuition Revenue                   $10,000
```

**2. Pay Salary**
```
Dr. Salaries Expense         $5,000
  Cr. Cash/Bank                         $5,000
```

**3. Purchase Equipment**
```
Dr. Equipment                $15,000
  Cr. Cash/Bank                         $15,000
```

**4. Record Depreciation**
```
Dr. Depreciation Expense     $1,000
  Cr. Accumulated Depreciation          $1,000
```

**5. Receive Advance Payment**
```
Dr. Cash/Bank                $3,000
  Cr. Unearned Revenue                  $3,000
```

**6. Recognize Revenue from Advance**
```
Dr. Unearned Revenue         $3,000
  Cr. Tuition Revenue                   $3,000
```

## Integration with Other Modules

All finance modules automatically create journal entries:

- **Invoice**: Dr. Accounts Receivable, Cr. Revenue
- **Fees**: Dr. Cash, Cr. Revenue
- **Payroll**: Dr. Salary Expense, Cr. Cash
- **Expenses**: Dr. Expense Account, Cr. Cash/Accounts Payable
- **Banking**: Dr./Cr. Bank Accounts

## Best Practices

1. **Consistent Coding**: Use standard account codes across all transactions
2. **Detailed Descriptions**: Provide clear, specific descriptions for all entries
3. **Regular Reconciliation**: Reconcile accounts monthly
4. **Backup Before Closing**: Always backup before period close
5. **Audit Trail**: Never delete entries; use reversing entries for corrections

## Related Files

- `actions.ts` - Server actions
- `chart-of-accounts.tsx` - Account management UI
- `journal-entry.tsx` - Journal entry form
- `general-ledger.tsx` - Ledger display

## Support

For questions: finance@school.edu
