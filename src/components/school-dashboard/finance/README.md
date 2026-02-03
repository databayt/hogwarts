# Finance Block - Comprehensive School Finance Management

## Overview

The Finance Block is a comprehensive, feature-based financial management system for multi-tenant school management. It implements double-entry bookkeeping with 12 specialized sub-blocks covering all aspects of school finance operations.

## Architecture

### Design Principles

1. **Feature-Based Architecture**: Each sub-block is fully self-contained with minimal dependencies
2. **Double-Entry Bookkeeping**: All financial transactions automatically create balanced journal entries
3. **Multi-Tenant**: Row-level data isolation using `schoolId`
4. **Hybrid Permissions**: Role-based + granular access control
5. **Type-Safe**: Full TypeScript with Zod validation
6. **Mirror Pattern**: Routes exactly match component structure

### Directory Structure

```
src/components/platform/finance/
├── lib/
│   ├── permissions.ts              # Shared permission utilities
│   └── accounting/                 # Double-entry integration
│       ├── types.ts               # Core accounting types
│       ├── utils.ts               # Journal entry utilities
│       ├── posting-rules.ts       # Module-specific posting rules
│       ├── seed-accounts.ts       # Chart of accounts seeding
│       ├── actions.ts             # Server actions
│       └── index.ts               # Public API
├── invoice/                        # Invoice management (migrated)
├── receipt/                        # Receipt generation (migrated)
├── banking/                        # Banking integration (migrated)
├── fees/                          # Student fees management
├── salary/                        # Salary structures
├── payroll/                       # Payroll processing
├── timesheet/                     # Staff time tracking
├── wallet/                        # Wallet management
├── budget/                        # Budget planning
├── expenses/                      # Expense management
├── accounts/                      # Chart of accounts & ledger
├── reports/                       # Financial reporting
└── content.tsx                    # Main finance dashboard
```

## Sub-Blocks

### 1. Invoice (`/finance/invoice`)

**Purpose**: Client invoicing and billing management

**Features**:

- Professional invoice generation
- Payment tracking
- Email delivery
- Status management

**Accounting Integration**:

```typescript
// When invoice is paid
DR: Cash/Bank Account
CR: Accounts Receivable
```

### 2. Receipt (`/finance/receipt`)

**Purpose**: Receipt generation and expense scanning

**Features**:

- Receipt generation
- AI OCR for expense scanning
- Transaction tracking

### 3. Banking (`/finance/banking`)

**Purpose**: Bank account and transaction management

**Features**:

- Bank account linking (Plaid/Dwolla)
- Transaction tracking
- Payment transfers
- Bank reconciliation

### 4. Fees (`/finance/fees`)

**Purpose**: Student fee management

**Features**:

- Fee structure definition
- Student fee assignment
- Payment tracking
- Scholarship management
- Fine management

**Accounting Integration**:

```typescript
// Fee Assignment
DR: Student Fees Receivable
CR: Fee Revenue

// Fee Payment
DR: Cash/Bank Account
CR: Student Fees Receivable
```

### 5. Salary (`/finance/salary`)

**Purpose**: Staff salary structure management

**Features**:

- Salary structure definition
- Allowances and deductions
- Salary calculator
- Bulk operations

### 6. Payroll (`/finance/payroll`)

**Purpose**: Payroll processing and disbursement

**Features**:

- Payroll run creation
- Salary slip generation
- Tax calculations
- Approval workflow
- Disbursement management

**Accounting Integration**:

```typescript
// Salary Payment
DR: Salary Expense
DR: Payroll Tax Expense
CR: Cash/Bank Account
CR: Tax Payable
CR: Social Security Payable
```

### 7. Timesheet (`/finance/timesheet`)

**Purpose**: Staff time tracking

**Features**:

- Timesheet periods
- Hour tracking
- Approval workflow
- Calendar view
- Payroll integration

### 8. Wallet (`/finance/wallet`)

**Purpose**: School and parent wallet management

**Features**:

- School wallet management
- Parent wallet balances
- Top-up functionality
- Transaction history

**Accounting Integration**:

```typescript
// Wallet Top-up
DR: Cash/Bank Account
CR: Unearned Revenue
```

### 9. Budget (`/finance/budget`)

**Purpose**: Budget planning and tracking

**Features**:

- Budget creation
- Department allocation
- Spending tracking
- Variance analysis

### 10. Expenses (`/finance/expenses`)

**Purpose**: Expense submission and approval

**Features**:

- Expense submission
- Category management
- Approval workflow
- Reimbursement processing

**Accounting Integration**:

```typescript
// Expense Payment
DR: Expense Account (by category)
CR: Cash/Bank Account
```

### 11. Accounts (`/finance/accounts`)

**Purpose**: Core accounting system

**Features**:

- Chart of accounts
- Journal entries
- General ledger
- Fiscal year management
- Period closing

**Account Structure**:

- **Assets**: Cash, Bank, Accounts Receivable, Fixed Assets
- **Liabilities**: Accounts Payable, Salary Payable, Tax Payable
- **Equity**: Retained Earnings, Current Year Earnings
- **Revenue**: Student Fees, Tuition, Registration, Exam Fees
- **Expenses**: Salaries, Utilities, Supplies, Maintenance

### 12. Reports (`/finance/reports`)

**Purpose**: Financial reporting and analysis

**Features**:

- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Trial Balance
- Revenue/Expense Analysis
- Custom report builder

## Double-Entry Bookkeeping Integration

### How It Works

Every financial transaction in the system automatically creates balanced journal entries following double-entry bookkeeping principles.

### Integration Flow

```typescript
// 1. Module records transaction
const payment = await db.payment.create({
  data: { ... }
})

// 2. Create accounting entry
import { postFeePayment } from '@/components/school-dashboard/finance/lib/accounting'

const result = await postFeePayment(schoolId, {
  paymentId: payment.id,
  studentId: payment.studentId,
  amount: payment.amount,
  paymentMethod: payment.paymentMethod,
  paymentDate: payment.createdAt,
})

// 3. Journal entry is automatically posted
// 4. Account balances are updated
```

### Posting Rules

Each module has predefined posting rules that determine:

- Which accounts to debit
- Which accounts to credit
- How to calculate amounts
- What descriptions to use

### Available Actions

```typescript
// Initialize accounting for a school
await initializeAccounting(schoolId)

// Post transactions
await postFeePayment(schoolId, paymentData)
await postFeeAssignment(schoolId, assignmentData)
await postSalaryPayment(schoolId, paymentData)
await postExpensePayment(schoolId, expenseData)
await postInvoicePayment(schoolId, invoiceData)
await postWalletTopup(schoolId, topupData)

// Manage journal entries
await postJournalEntryAction(journalEntryId)
await reverseJournalEntryAction(journalEntryId, reason)

// Retrieve data
await getChartOfAccounts(schoolId)
await getJournalEntries(schoolId, options)
await getAccountBalances(schoolId, fiscalYearId)
```

## Permissions

### Hybrid Permission System

The finance block uses a two-tier permission system:

1. **Role-Based (Base Layer)**:
   - `ADMIN`: Full access to all modules
   - `ACCOUNTANT`: Full access to all modules
   - `DEVELOPER`: Full access across all schools

2. **Granular Permissions (Fine-Tuning)**:
   - Module-specific permissions
   - Action-based control (view, create, edit, delete, approve, process, export)

### Usage

```typescript
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"

// Check permission
const canApprove = await checkFinancePermission(
  userId,
  schoolId,
  "payroll",
  "approve"
)

if (!canApprove) {
  return { success: false, error: "Unauthorized" }
}
```

### Permission Modules

- `invoice`, `receipt`, `banking`, `fees`, `salary`, `payroll`, `timesheet`, `wallet`, `budget`, `expenses`, `accounts`, `reports`

### Permission Actions

- `view`, `create`, `edit`, `delete`, `approve`, `process`, `export`

## Database Schema

### Core Models

**Chart of Accounts** (`ChartOfAccount`)

- Account hierarchy
- Account types (Asset, Liability, Equity, Revenue, Expense)
- Account codes and names

**Journal Entries** (`JournalEntry`)

- Entry number and date
- Source module tracking
- Posted/unposted status
- Reversal tracking

**Ledger Entries** (`LedgerEntry`)

- Debit and credit amounts
- Account references
- Entry descriptions

**Account Balances** (`AccountBalance`)

- Running balances per account
- Fiscal year tracking
- Debit/credit totals

**Fiscal Years** (`FiscalYear`)

- Year definition
- Start/end dates
- Active status

## Getting Started

### 1. Initialize Accounting System

```typescript
import { initializeAccounting } from "@/components/school-dashboard/finance/lib/accounting"

// This seeds the chart of accounts and creates fiscal year
const result = await initializeAccounting(schoolId)
```

### 2. Record Transactions

Each module automatically integrates with accounting when transactions occur. No manual intervention needed.

### 3. Review Journal Entries

Navigate to `/finance/accounts/journal` to review all posted and unposted entries.

### 4. Generate Reports

Navigate to `/finance/reports` to generate financial statements.

## Best Practices

### Transaction Recording

1. **Always use server actions**: Never create journal entries directly from client components
2. **Validate before posting**: Use Zod schemas to validate data
3. **Include references**: Always link journal entries to source transactions
4. **Post automatically**: Use `autoPost: true` for most transactions

### Account Management

1. **Use standard codes**: Follow the StandardAccountCodes for consistency
2. **Don't modify posted entries**: Use reversals instead
3. **Close periods regularly**: Use period closing to prevent backdated entries

### Multi-Tenant Isolation

1. **Always include schoolId**: Every query must filter by schoolId
2. **Use getTenantContext()**: Get schoolId from the request context
3. **Validate ownership**: Verify user belongs to school before operations

## API Reference

### Accounting Integration

```typescript
// Initialize accounting
function initializeAccounting(schoolId: string): Promise<{
  success: boolean
  accountsCreated?: number
  fiscalYearId?: string
  error?: string
}>

// Post transactions
function postFeePayment(schoolId: string, paymentData: {...}): Promise<PostingResult>
function postSalaryPayment(schoolId: string, paymentData: {...}): Promise<PostingResult>
function postExpensePayment(schoolId: string, expenseData: {...}): Promise<PostingResult>

// Journal entry management
function postJournalEntry(journalEntryId: string, postedBy: string): Promise<PostingResult>
function reverseJournalEntry(journalEntryId: string, reversedBy: string, reason: string): Promise<PostingResult>

// Data retrieval
function getChartOfAccounts(schoolId: string): Promise<Account[]>
function getJournalEntries(schoolId: string, options?: {...}): Promise<JournalEntry[]>
function getAccountBalances(schoolId: string, fiscalYearId?: string): Promise<AccountBalance[]>
function calculateTrialBalance(schoolId: string, fiscalYearId: string): Promise<AccountBalance[]>
```

### Permissions

```typescript
// Check permissions
function checkFinancePermission(
  userId: string,
  schoolId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean>

// Get module permissions
function getUserModulePermissions(
  userId: string,
  schoolId: string,
  module: FinanceModule
): Promise<FinanceAction[]>

// Grant/revoke permissions
function grantFinancePermission(...): Promise<boolean>
function revokeFinancePermission(...): Promise<boolean>
```

## Testing

Testing has been skipped for now as per requirements. When testing is implemented, focus on:

1. Journal entry balance validation
2. Account balance calculations
3. Multi-tenant isolation
4. Permission enforcement
5. Transaction posting rules

## Performance Considerations

1. **Batch operations**: Use batch posting for multiple transactions
2. **Index optimization**: All foreign keys are indexed
3. **Balance caching**: Account balances are materialized for fast lookups
4. **Query optimization**: Use select fields to limit data transfer

## Migration Guide

### From Old Structure

Old routes automatically work due to the migrations completed:

- Invoice, receipt, and banking were migrated with import path updates
- All functionality preserved
- No breaking changes

### Adding New Modules

To add a new finance module:

1. Create directory in `src/components/platform/finance/[module]/`
2. Create essential files: `types.ts`, `validation.ts`, `config.ts`, `content.tsx`
3. Create route in `src/app/[lang]/s/[subdomain]/(platform)/finance/[module]/`
4. Add posting rules in `lib/accounting/posting-rules.ts`
5. Add permission checks using `permissions.ts`
6. Update main dashboard `content.tsx` with navigation card

## Support

For issues or questions:

- Check the main project README
- Review the prisma schema in `prisma/models/finance.prisma`
- Examine example implementations in existing sub-blocks

## License

MIT License - Part of Hogwarts School Management Platform
