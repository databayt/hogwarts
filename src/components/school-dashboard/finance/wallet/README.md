# Wallet Management

Digital wallet system with top-up, transfers, withdrawals, and spending limits for students, parents, and staff.

## Overview

The Wallet module provides a secure digital wallet system for cashless transactions within the school ecosystem. Users can top up their wallets, transfer funds to other users, make purchases, and track their spending history.

## Key Features

### 1. Wallet Management

- Individual wallet for each user
- Real-time balance tracking
- Multi-currency support
- Daily and monthly spending limits
- Active/inactive status control

### 2. Top-Up Methods

- **Credit/Debit Card** - Instant processing
- **Bank Transfer** - 1-2 day processing
- **Mobile Money** - Instant (in supported regions)
- **Cash** - In-person at school office
- **Voucher** - Prepaid voucher redemption

### 3. Transfers

- **Peer-to-Peer** - Send money to other users
- **PIN Verification** - Optional security layer
- **Spending Limit Checks** - Prevent overspending
- **Transfer History** - Complete audit trail

### 4. Withdrawals

- Withdraw to bank account
- Cash withdrawal at school office
- Refund processing
- Security verification required

### 5. Transaction History

- Complete transaction log
- Filter by type, status, date range
- Search by reference or description
- Export to CSV/PDF

## Spending Limits

### Daily Limits

- **Default:** $100 per day
- **Customizable** per user or role
- **Resets:** Every day at midnight
- **Purpose:** Prevent unauthorized large transactions

### Monthly Limits

- **Default:** $1,000 per month
- **Customizable** per user or role
- **Resets:** First day of each month
- **Purpose:** Budget control

**Example:**

```
User has:
- Daily Limit: $100
- Monthly Limit: $500
- Current Balance: $600
- Spent Today: $30
- Spent This Month: $200

Available to spend:
- Today: $70 (min of $100-$30 and balance)
- This Month: $300 (min of $500-$200 and balance)
```

## Data Models

### Wallet

```typescript
{
  id: string
  userId: string
  currentBalance: Decimal
  currency: string (default: "USD")
  isActive: boolean
  dailyLimit: Decimal
  monthlyLimit: Decimal
  pin?: string           // Hashed, optional
  createdAt: Date
  updatedAt: Date
}
```

### WalletTransaction

```typescript
{
  id: string
  walletId: string
  type: TransactionType
  amount: Decimal
  balanceBefore: Decimal
  balanceAfter: Decimal
  description?: string
  reference: string      // Unique transaction reference
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
  paymentMethod?: PaymentMethod
  recipientWalletId?: string
  completedAt?: Date
  failureReason?: string
  metadata: Json         // Additional transaction data
}
```

### Transaction Types

```typescript
enum TransactionType {
  CREDIT         // Money added to wallet
  DEBIT          // Money deducted from wallet
  TRANSFER_IN    // Received from another wallet
  TRANSFER_OUT   // Sent to another wallet
  PURCHASE       // Paid for school services
  REFUND         // Money returned
  WITHDRAWAL     // Cash out from wallet
  FEE            // Transaction or service fee
}
```

### Payment Methods

```typescript
enum PaymentMethod {
  CARD           // Credit/debit card
  BANK_TRANSFER  // Bank transfer
  MOBILE_MONEY   // Mobile money (M-Pesa, etc.)
  CASH           // Cash payment
  VOUCHER        // Prepaid voucher
  WALLET         // From another wallet
}
```

## Server Actions

### Wallet Operations

#### `getWalletBalanceWithRBAC(walletId)`

Retrieves wallet balance with spending limit information.

**Returns:**

```typescript
{
  walletId: string
  userId: string
  userName: string
  currentBalance: number
  currency: string
  isActive: boolean
  dailyLimit: number
  monthlyLimit: number
  spentToday: number
  spentThisMonth: number
  availableDaily: number
  availableMonthly: number
}
```

**Example:**

```typescript
const result = await getWalletBalanceWithRBAC(walletId)

if (result.success && result.data) {
  console.log(`Balance: $${result.data.currentBalance}`)
  console.log(`Available today: $${result.data.availableDaily}`)
  console.log(`Available this month: $${result.data.availableMonthly}`)
}
```

#### `createWalletWithRBAC(userId, initialBalance?)`

Creates a new wallet for a user.

**Permissions Required:** `wallet:create`

**Example:**

```typescript
const result = await createWalletWithRBAC(
  "user_123",
  50 // Optional initial balance
)
```

#### `updateWalletLimitsWithRBAC(walletId, dailyLimit, monthlyLimit)`

Updates spending limits for a wallet.

**Permissions Required:** `wallet:edit`

### Top-Up Operations

#### `topUpWalletWithRBAC(data)`

Adds funds to a wallet.

**Permissions Required:** `wallet:create` (or own wallet)

**Example:**

```typescript
const result = await topUpWalletWithRBAC({
  walletId: "wallet_123",
  amount: 100,
  method: "CARD",
  reference: "CARD-TXN-123456",
})

if (result.success && result.data) {
  console.log(`New balance: $${result.data.balanceAfter}`)
}
```

**Process:**

1. Validates amount > 0
2. Verifies wallet is active
3. Processes payment via selected method
4. Creates CREDIT transaction
5. Updates wallet balance
6. Creates journal entry for accounting

### Transfer Operations

#### `transferBetweenWalletsWithRBAC(data)`

Transfers funds between two wallets.

**Permissions Required:** Own wallet (sender) or `wallet:process`

**Example:**

```typescript
const result = await transferBetweenWalletsWithRBAC({
  fromWalletId: "wallet_123",
  toWalletId: "wallet_456",
  amount: 25,
  description: "Lunch money for John",
  pin: "1234", // Optional PIN verification
})

if (result.success && result.data) {
  console.log("Transfer successful!")
  console.log(`Reference: ${result.data.reference}`)
}
```

**Validation:**

- Sender has sufficient balance
- Amount doesn't exceed daily limit
- Amount doesn't exceed monthly limit
- PIN is correct (if provided)
- Both wallets are active
- Sender and recipient are in same school

**Process:**

1. Validates all conditions
2. Verifies PIN if provided
3. Creates TRANSFER_OUT transaction (sender)
4. Creates TRANSFER_IN transaction (recipient)
5. Updates both wallet balances atomically
6. Creates journal entries

### Withdrawal Operations

#### `withdrawFromWalletWithRBAC(data)`

Withdraws funds from wallet to bank or cash.

**Permissions Required:** Own wallet or `wallet:process`

**Example:**

```typescript
const result = await withdrawFromWalletWithRBAC({
  walletId: "wallet_123",
  amount: 50,
  method: "BANK_TRANSFER",
  bankAccount: {
    accountNumber: "1234567890",
    bankName: "ABC Bank",
  },
})
```

**Process:**

1. Validates balance
2. Creates WITHDRAWAL transaction
3. Initiates bank transfer or prepares cash
4. Updates wallet balance
5. Status changes to COMPLETED once processed

### Transaction History

#### `getWalletTransactionsWithRBAC(walletId, filters?)`

Retrieves paginated transaction history.

**Filters:**

```typescript
{
  type?: TransactionType
  status?: TransactionStatus
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}
```

**Example:**

```typescript
const result = await getWalletTransactionsWithRBAC(walletId, {
  type: "TRANSFER_OUT",
  status: "COMPLETED",
  startDate: new Date("2024-11-01"),
  endDate: new Date("2024-11-30"),
  limit: 20,
})

if (result.success && result.data) {
  result.data.forEach((txn) => {
    console.log(`${txn.type}: $${txn.amount} - ${txn.description}`)
  })
}
```

## Wallet Use Cases

### 1. Student Cafeteria Payments

```typescript
// Parent tops up student's wallet
await topUpWalletWithRBAC({
  walletId: studentWalletId,
  amount: 100,
  method: "CARD",
})

// Student purchases lunch
await debitWalletForPurchase({
  walletId: studentWalletId,
  amount: 8.5,
  description: "Cafeteria - Lunch",
  category: "FOOD",
})
```

### 2. Parent-to-Student Transfer

```typescript
// Parent sends allowance to student
await transferBetweenWalletsWithRBAC({
  fromWalletId: parentWalletId,
  toWalletId: studentWalletId,
  amount: 50,
  description: "Weekly allowance",
})
```

### 3. School Fee Payment

```typescript
// Student pays school fees from wallet
await debitWalletForPurchase({
  walletId: studentWalletId,
  amount: 500,
  description: "Tuition Fee - November 2024",
  category: "FEES",
})
```

### 4. Refund Processing

```typescript
// School refunds cancelled event fee
await topUpWalletWithRBAC({
  walletId: studentWalletId,
  amount: 25,
  method: "WALLET",
  reference: "REFUND-EVENT-123",
})
```

## Workflow

### Initial Setup

```
1. System creates wallet for new user (auto)
2. Set default spending limits
3. User verifies identity
4. User sets optional PIN
5. Wallet activated
```

### Top-Up Process

```
1. User selects top-up amount
2. Chooses payment method
3. Completes payment
4. System verifies payment
5. Credits wallet
6. Sends confirmation email
```

### Transfer Process

```
1. User enters recipient and amount
2. System checks limits and balance
3. User enters PIN (if enabled)
4. System processes transfer
5. Both users receive notification
6. Transaction appears in history
```

### Withdrawal Process

```
1. User requests withdrawal
2. Enters bank details or selects cash
3. System verifies balance
4. Admin approves withdrawal (if >$100)
5. System processes payment
6. Updates wallet balance
```

## Integration with Other Modules

### Fees Module

- Students can pay fees from wallet
- Automatic deduction on due date (if opted in)
- Partial payment support

### Cafeteria/POS

- Quick payments at cafeteria
- QR code scanning for instant payment
- Daily spending limits prevent overspending

### Events Module

- Pay for event tickets
- Group payments for field trips
- Refunds for cancelled events

### Banking Module

- Bank transfers for top-ups
- Withdrawal to bank account
- Reconciliation with bank statements

### Accounts Module

- Journal entries for all transactions
- Double-entry bookkeeping
- Financial reporting integration

## RBAC (Role-Based Access Control)

### Permissions

| Role           | View          | Create | Edit | Transfer     | Withdraw | View All |
| -------------- | ------------- | ------ | ---- | ------------ | -------- | -------- |
| **ADMIN**      | ✅            | ✅     | ✅   | ✅           | ✅       | ✅       |
| **ACCOUNTANT** | ✅            | ✅     | ✅   | ✅           | ✅       | ✅       |
| **TEACHER**    | ✅ (own)      | ❌     | ❌   | ✅ (own)     | ✅ (own) | ❌       |
| **STAFF**      | ✅ (own)      | ❌     | ❌   | ✅ (own)     | ✅ (own) | ❌       |
| **STUDENT**    | ✅ (own)      | ❌     | ❌   | ✅ (own)     | ❌       | ❌       |
| **GUARDIAN**   | ✅ (own+kids) | ❌     | ❌   | ✅ (to kids) | ❌       | ❌       |

**Note:** Guardians can view and top up their children's wallets.

## Best Practices

### 1. Spending Limits

- Set age-appropriate limits for students
- Review limits quarterly
- Higher limits for staff/parents
- Adjust limits for special events

### 2. Security

- Encourage PIN usage for transfers
- Monitor for unusual transaction patterns
- Alert users of large transactions
- Regular security audits

### 3. Top-Up Strategy

- Promote automatic top-ups
- Offer bonuses for larger top-ups (e.g., 10% bonus on $100+)
- Multiple payment options for convenience

### 4. Transaction Monitoring

- Review failed transactions
- Follow up on disputed charges
- Monthly transaction reports
- Fraud detection algorithms

### 5. Refund Policy

- Clear refund policy communicated to users
- Refunds to original wallet within 24 hours
- Document reason for all refunds
- Approval workflow for refunds >$50

## Reports & Analytics

### Standard Reports

1. **Wallet Balance Report**
   - All active wallets
   - Total balance per user
   - Inactive wallets
   - Low balance alerts (<$10)

2. **Transaction Volume Report**
   - Daily/weekly/monthly volume
   - Transaction count by type
   - Average transaction amount
   - Peak usage times

3. **Top-Up Report**
   - Top-ups by method
   - Top-up success rate
   - Average top-up amount
   - Most active users

4. **Transfer Report**
   - Most common transfer pairs
   - Transfer volume trends
   - Failed transfer analysis

5. **Spending Analysis**
   - Spending by category
   - Top spenders
   - Limit violations
   - Spending patterns

### Custom Reports

- Revenue from wallet fees
- User engagement metrics
- Seasonal spending trends
- Demographic spending analysis

## Troubleshooting

### Transfer Failed

**Issue:** Transfer between wallets fails

**Solution:**

- Verify both wallets are active
- Check sender has sufficient balance
- Ensure amount is within limits
- Verify PIN if required
- Check both users in same school

### Balance Mismatch

**Issue:** Displayed balance doesn't match transactions

**Solution:**

- Run balance recalculation
- Check for pending transactions
- Review transaction history
- Verify database integrity
- Contact support if persists

### Top-Up Not Reflecting

**Issue:** Payment successful but balance not updated

**Solution:**

- Check payment gateway status
- Verify transaction was completed
- Review transaction logs
- Manual credit if payment confirmed
- Refund if payment failed

## Security Features

### 1. PIN Protection

- Optional 4-6 digit PIN
- Hashed using bcrypt
- Required for transfers >$50
- Locked after 3 failed attempts

### 2. Transaction Limits

- Daily and monthly caps
- Real-time limit checking
- Admin override capability
- Alerts for limit violations

### 3. Fraud Detection

- Unusual transaction patterns
- Multiple failed attempts
- Large sudden transactions
- Geolocation tracking (if enabled)

### 4. Audit Trail

- All transactions logged
- IP address tracking
- Device fingerprinting
- Immutable transaction history

## Future Enhancements

1. **QR Code Payments**: Scan to pay at school facilities
2. **Recurring Payments**: Auto-debit for monthly fees
3. **Family Wallets**: Shared wallet for family members
4. **Investment Options**: Interest-bearing wallet balances
5. **Multi-Currency**: Support for international currencies
6. **NFC Payments**: Tap-to-pay with school ID card

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `validation.ts` - Zod schemas
- `types.ts` - TypeScript types
- `lib/permissions.ts` - Permission checks

## Support

For questions or issues with the Wallet module, contact the finance team or check the main finance documentation.

**Emergency Support:** If wallet balance is incorrect or transaction fails, contact: finance@school.edu
