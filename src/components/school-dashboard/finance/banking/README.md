# Banking & Reconciliation

Comprehensive banking management system with multi-account support, reconciliation, and transaction tracking.

## Overview

The Banking module manages school bank accounts, processes transactions, handles reconciliations, and integrates with other financial modules for complete cash flow management.

## Key Features

### 1. Bank Account Management

- Multiple bank account support
- Account types (checking, savings, payroll, etc.)
- Real-time balance tracking
- Account status management
- Multi-currency support

### 2. Transaction Management

- Manual transaction entry
- Bulk import from bank statements
- Transaction categorization
- Attachment support (receipts, invoices)
- Duplicate detection

### 3. Bank Reconciliation

- Monthly reconciliation workflow
- Automatic matching algorithm
- Manual matching interface
- Discrepancy identification
- Reconciliation reports

### 4. Cash Flow Management

- Cash position tracking
- Forecast cash flow
- Alert on low balances
- Multi-account cash pooling

### 5. Integration

- Import bank statements (CSV, OFX, QFX)
- Export transactions
- Connect with accounting module
- Sync with payroll and expenses

## Data Models

### BankAccount

```typescript
{
  id: string
  accountName: string
  bankName: string
  accountNumber: string    // Last 4 digits shown
  accountType: AccountType
  currency: string
  currentBalance: Decimal
  availableBalance: Decimal
  lastReconciledDate?: Date
  lastReconciledBalance?: Decimal
  isActive: boolean
  isPrimary: boolean       // Primary operating account
}
```

### Account Types

```typescript
enum AccountType {
  CHECKING          // Main operating account
  SAVINGS           // Savings/reserve account
  PAYROLL           // Dedicated payroll account
  PETTY_CASH        // Cash on hand
  CREDIT_CARD       // Credit card account
  LINE_OF_CREDIT    // LOC account
}
```

### BankTransaction

```typescript
{
  id: string
  bankAccountId: string
  date: Date
  description: string
  amount: Decimal
  type: "DEBIT" | "CREDIT"
  category?: string
  reference?: string
  checkNumber?: string
  payee?: string
  isReconciled: boolean
  reconciledDate?: Date
  journalEntryId?: string
  attachmentUrls: string[]
}
```

### BankReconciliation

```typescript
{
  id: string
  bankAccountId: string
  periodStart: Date
  periodEnd: Date
  statementBalance: Decimal
  bookBalance: Decimal
  difference: Decimal
  status: "IN_PROGRESS" | "COMPLETED" | "DISCREPANCY"
  reconciledBy?: string
  reconciledAt?: Date
  notes?: string
  adjustments: ReconciliationAdjustment[]
}
```

## Server Actions

### Bank Account Management

#### `createBankAccountWithRBAC(data)`

Creates a new bank account.

**Permissions Required:** `banking:create`

**Example:**

```typescript
const result = await createBankAccountWithRBAC({
  accountName: "Main Operating Account",
  bankName: "First National Bank",
  accountNumber: "****1234",
  accountType: "CHECKING",
  currency: "USD",
  currentBalance: 50000,
  isPrimary: true,
})
```

#### `updateBankAccountWithRBAC(id, data)`

Updates bank account details.

**Permissions Required:** `banking:edit`

#### `deactivateBankAccountWithRBAC(id)`

Deactivates a bank account (sets isActive = false).

**Permissions Required:** `banking:delete`

### Transaction Management

#### `createBankTransactionWithRBAC(data)`

Records a manual bank transaction.

**Permissions Required:** `banking:create`

**Example:**

```typescript
const result = await createBankTransactionWithRBAC({
  bankAccountId: "bank_123",
  date: new Date("2024-11-15"),
  description: "Payment to ABC Supplies",
  amount: 1250.0,
  type: "DEBIT",
  category: "OPERATING_EXPENSE",
  payee: "ABC Supplies",
  checkNumber: "1001",
})
```

**Process:**

1. Validates transaction data
2. Updates bank account balance
3. Creates journal entry (double-entry)
4. Links to related expense/payment (if any)
5. Marks as unreconciled

#### `importBankStatementWithRBAC(bankAccountId, file)`

Imports transactions from bank statement file.

**Permissions Required:** `banking:create`

**Supported Formats:**

- CSV
- OFX (Open Financial Exchange)
- QFX (Quicken Financial Exchange)

**Example:**

```typescript
const result = await importBankStatementWithRBAC(bankAccountId, statementFile)

console.log(`Imported ${result.imported} transactions`)
console.log(`Skipped ${result.skipped} duplicates`)
```

**Import Process:**

1. Parses file format
2. Validates transaction data
3. Detects duplicates
4. Creates transactions
5. Auto-categorizes (if possible)
6. Returns import summary

### Bank Reconciliation

#### `startBankReconciliationWithRBAC(data)`

Initiates a new bank reconciliation.

**Permissions Required:** `banking:edit`

**Example:**

```typescript
const result = await startBankReconciliationWithRBAC({
  bankAccountId: "bank_123",
  periodStart: new Date("2024-11-01"),
  periodEnd: new Date("2024-11-30"),
  statementBalance: 48750.5,
})

if (result.success && result.data) {
  console.log(`Book Balance: $${result.data.bookBalance}`)
  console.log(`Statement Balance: $${result.data.statementBalance}`)
  console.log(`Difference: $${result.data.difference}`)
}
```

**Reconciliation Steps:**

1. Fetches all transactions in period
2. Identifies unreconciled transactions
3. Calculates book balance
4. Compares with statement balance
5. Highlights discrepancies

#### `matchTransactionWithRBAC(reconciliationId, transactionId, statementLineId)`

Matches a book transaction with a statement line.

**Permissions Required:** `banking:edit`

**Example:**

```typescript
const result = await matchTransactionWithRBAC(
  reconciliationId,
  bookTransactionId,
  statementLineId
)
```

**Matching Rules:**

- Same date (±3 days)
- Same amount
- Similar description (fuzzy match)
- Same type (debit/credit)

#### `completeBankReconciliationWithRBAC(reconciliationId)`

Finalizes the reconciliation process.

**Permissions Required:** `banking:approve`

**Example:**

```typescript
const result = await completeBankReconciliationWithRBAC(reconciliationId)

if (result.success) {
  console.log("Reconciliation completed")
  // All matched transactions marked as reconciled
  // Adjustments posted to accounting
}
```

**Completion Process:**

1. Verifies all transactions matched
2. Posts adjustments (bank fees, interest, etc.)
3. Updates last reconciled date and balance
4. Marks all transactions as reconciled
5. Generates reconciliation report

### Cash Management

#### `getCashPositionWithRBAC()`

Gets current cash position across all accounts.

**Returns:**

```typescript
{
  totalCash: number
  accounts: Array<{
    accountId: string
    accountName: string
    currentBalance: number
    availableBalance: number
  }>
  pendingDebits: number
  pendingCredits: number
  projectedBalance: number
}
```

#### `forecastCashFlowWithRBAC(days)`

Forecasts cash flow for next N days.

**Returns:**

```typescript
{
  currentCash: number
  projectedInflows: number
  projectedOutflows: number
  projectedBalance: number
  dailyForecasts: Array<{
    date: Date
    inflow: number
    outflow: number
    balance: number
  }>
  alerts: string[]
}
```

## Reconciliation Workflow

### Monthly Reconciliation Process

```
1. Preparation (Day 1-3 of next month)
   ├── Download bank statement
   ├── Import statement transactions
   └── Review for obvious errors

2. Matching (Day 4-7)
   ├── Auto-match transactions
   ├── Manually match remaining
   ├── Identify discrepancies
   └── Investigate unmatched items

3. Adjustments (Day 8-10)
   ├── Record bank fees
   ├── Record interest earned
   ├── Correct errors
   └── Post adjustments

4. Completion (Day 11-15)
   ├── Verify zero difference
   ├── Complete reconciliation
   ├── Generate report
   └── Archive statement
```

### Auto-Matching Algorithm

The system uses a 3-tier matching algorithm:

**Tier 1: Exact Match (95% confidence)**

- Same date
- Same amount
- Similar description

**Tier 2: Probable Match (80% confidence)**

- Date within ±2 days
- Amount within ±$0.01
- Description similarity >70%

**Tier 3: Possible Match (60% confidence)**

- Date within ±5 days
- Amount within ±$1.00
- Description similarity >50%

**Manual Review Required:**

- Confidence <60%
- Multiple possible matches
- Unusual transactions

## Transaction Categories

### Common Categories

| Category            | Type   | Examples                    |
| ------------------- | ------ | --------------------------- |
| **Tuition Revenue** | Credit | Student fee payments        |
| **Vendor Payments** | Debit  | Supplier invoices           |
| **Payroll**         | Debit  | Salary disbursements        |
| **Utilities**       | Debit  | Electric, water, internet   |
| **Bank Fees**       | Debit  | Service charges, wire fees  |
| **Interest Income** | Credit | Savings interest            |
| **Loan Payment**    | Debit  | Principal + interest        |
| **Refunds**         | Debit  | Student refunds             |
| **Donations**       | Credit | Philanthropic contributions |

## Integration with Other Modules

### Accounts Module

- Creates journal entries for all transactions
- Maintains double-entry bookkeeping
- Links to chart of accounts

### Payroll Module

- Tracks payroll disbursements
- Reconciles payroll account
- Monitors payroll tax payments

### Expenses Module

- Links expense payments to bank transactions
- Tracks vendor payments
- Manages reimbursements

### Fees Module

- Tracks fee payments received
- Identifies student payments
- Manages refunds

### Budget Module

- Monitors cash vs budget
- Alerts on cash shortfalls
- Tracks cash flow against forecast

## RBAC (Role-Based Access Control)

### Permissions

| Role           | View | Create | Edit | Delete | Reconcile | View All |
| -------------- | ---- | ------ | ---- | ------ | --------- | -------- |
| **ADMIN**      | ✅   | ✅     | ✅   | ✅     | ✅        | ✅       |
| **ACCOUNTANT** | ✅   | ✅     | ✅   | ✅     | ✅        | ✅       |
| **TEACHER**    | ❌   | ❌     | ❌   | ❌     | ❌        | ❌       |
| **STAFF**      | ❌   | ❌     | ❌   | ❌     | ❌        | ❌       |
| **STUDENT**    | ❌   | ❌     | ❌   | ❌     | ❌        | ❌       |
| **GUARDIAN**   | ❌   | ❌     | ❌   | ❌     | ❌        | ❌       |

**Note:** Banking access is restricted to finance personnel only.

## Best Practices

### 1. Account Security

- Limit access to banking module
- Use two-factor authentication
- Log all banking activities
- Regular security audits

### 2. Reconciliation Discipline

- Reconcile monthly (no exceptions)
- Complete within 15 days
- Investigate all discrepancies
- Document unusual items

### 3. Cash Management

- Maintain minimum cash balance ($10K-$50K)
- Monitor daily cash position
- Forecast cash needs weekly
- Set up low balance alerts

### 4. Transaction Entry

- Enter transactions daily
- Attach receipts/invoices
- Use consistent descriptions
- Categorize accurately

### 5. Statement Management

- Keep statements for 7 years
- Store electronically (encrypted)
- Back up regularly
- Shred physical copies after scanning

## Reports & Analytics

### Standard Reports

1. **Bank Account Summary**
   - All accounts with balances
   - Total cash position
   - Recent transactions

2. **Cash Flow Report**
   - Cash inflows by source
   - Cash outflows by category
   - Net cash flow
   - Period comparison

3. **Reconciliation Report**
   - Reconciliation status by account
   - Outstanding items
   - Adjustments made
   - Reconciliation history

4. **Transaction Register**
   - All transactions by account
   - Filter by date, type, category
   - Running balance
   - Export capability

5. **Cash Forecast Report**
   - Projected cash position
   - Upcoming inflows/outflows
   - Minimum balance projection
   - Alert summary

## Troubleshooting

### Reconciliation Won't Balance

**Issue:** Difference between book and statement balance

**Solution:**

1. Verify statement balance entered correctly
2. Check for missing transactions
3. Look for duplicate entries
4. Review transaction dates
5. Check for transposed numbers
6. Contact bank if truly unresolvable

### Transaction Import Failed

**Issue:** Cannot import bank statement

**Solution:**

- Verify file format (CSV, OFX, QFX)
- Check file isn't corrupted
- Ensure proper column mapping
- Try different file format
- Manual entry as last resort

### Duplicate Transactions

**Issue:** Same transaction appears twice

**Solution:**

- Use duplicate detection feature
- Check import history
- Delete duplicate (keep original)
- Review import settings
- Set up better duplicate rules

## Future Enhancements

1. **API Integration**: Direct bank API connection for real-time data
2. **AI Categorization**: Machine learning for transaction categorization
3. **Automated Reconciliation**: Fully automated matching
4. **Cash Optimization**: Intelligent cash allocation across accounts
5. **Fraud Detection**: Anomaly detection for suspicious transactions

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `reconciliation-wizard.tsx` - Reconciliation interface
- `import-parser.ts` - Statement import logic
- `types/` - TypeScript types and interfaces

## Support

For questions or issues with the Banking module, contact the finance team at finance@school.edu or check the main finance documentation.

**Critical Issues:** For urgent banking issues (unauthorized transactions, account lockouts), contact immediately: finance-emergency@school.edu
