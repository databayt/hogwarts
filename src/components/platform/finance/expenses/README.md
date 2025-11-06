# Expense Management

Comprehensive expense tracking and approval workflow system for school operational expenses.

## Overview

The Expense module provides a complete expense management solution from submission to reimbursement, with multi-level approval workflows and budget integration.

## Key Features

### 1. Expense Submission
- Submit expenses with receipts
- Multiple expense categories
- Attach supporting documents (images, PDFs)
- Split expenses across budget allocations
- Recurring expense templates

### 2. Approval Workflow
- Multi-level approval chain
- Role-based approval routing
- Conditional approvals based on amount
- Email notifications at each stage
- Approval comments and feedback

### 3. Receipt Management
- Upload receipt images/PDFs
- OCR for automatic data extraction
- Receipt validation rules
- Digital receipt storage
- Duplicate receipt detection

### 4. Budget Integration
- Real-time budget availability checks
- Automatic budget deduction on approval
- Budget overrun warnings
- Variance tracking and reporting

### 5. Reimbursement Processing
- Track payment status
- Multiple payment methods
- Batch reimbursement processing
- Payment confirmation tracking

## Expense Categories

| Category | Description | Typical Use Cases |
|----------|-------------|-------------------|
| **Office Supplies** | Stationery, printer ink, etc. | Pens, paper, folders |
| **Travel** | Transportation costs | Conferences, site visits |
| **Meals & Entertainment** | Client/staff meals | Team lunches, events |
| **Utilities** | Electricity, water, internet | Monthly bills |
| **Maintenance** | Repairs and upkeep | Equipment repair, cleaning |
| **Professional Services** | Consultants, contractors | Legal, IT support |
| **Technology** | Hardware, software licenses | Computers, subscriptions |
| **Marketing** | Advertising, promotions | Social media ads, flyers |
| **Training** | Staff development | Courses, workshops |
| **Miscellaneous** | Other expenses | Uncategorized |

## Data Models

### Expense
```typescript
{
  id: string
  submitterId: string
  date: Date
  category: ExpenseCategory
  amount: Decimal
  description: string
  vendor?: string
  budgetAllocationId?: string
  receiptUrls: string[]      // S3/cloud storage URLs
  status: ExpenseStatus
  submittedAt: Date
  approvalChain: ApprovalStep[]
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paidAt?: Date
  notes?: string
}
```

### Expense Status
```typescript
enum ExpenseStatus {
  DRAFT           // Being prepared
  SUBMITTED       // Awaiting first approval
  IN_REVIEW       // Under review
  APPROVED        // Fully approved
  REJECTED        // Rejected at any stage
  PAID            // Reimbursement completed
  CANCELLED       // Cancelled by submitter
}
```

### Approval Step
```typescript
{
  level: number           // 1, 2, 3, etc.
  approverId: string
  approverName: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  comment?: string
  decidedAt?: Date
  requiredAmount?: Decimal  // Min amount for this level
}
```

### Payment Status
```typescript
enum PaymentStatus {
  NOT_REQUIRED     // No payment needed
  PENDING          // Awaiting payment
  PROCESSING       // Payment in progress
  PAID             // Payment completed
  FAILED           // Payment failed
}
```

## Server Actions

### Expense Submission

#### `createExpenseWithRBAC(data)`
Submits a new expense for approval.

**Permissions Required:** `expenses:create`

**Example:**
```typescript
const result = await createExpenseWithRBAC({
  date: new Date("2024-11-15"),
  category: "OFFICE_SUPPLIES",
  amount: 125.50,
  description: "Printer ink cartridges",
  vendor: "Office Depot",
  budgetAllocationId: "alloc_123",
  receiptUrls: ["https://s3.amazonaws.com/receipts/rec_123.jpg"]
})

if (result.success && result.data) {
  console.log(`Expense submitted: ${result.data.id}`)
  console.log(`Status: ${result.data.status}`)
}
```

**Process:**
1. Validates expense data
2. Checks budget availability (if allocated)
3. Uploads receipt images
4. Determines approval chain
5. Sends notification to first approver
6. Sets status to SUBMITTED

#### `updateExpenseWithRBAC(id, data)`
Updates an expense (only if status is DRAFT).

**Permissions Required:** `expenses:edit`

#### `deleteExpenseWithRBAC(id)`
Deletes an expense (only if status is DRAFT).

**Permissions Required:** `expenses:delete`

### Approval Workflow

#### `approveExpenseWithRBAC(expenseId, comment?)`
Approves an expense at current approval level.

**Permissions Required:** `expenses:approve`

**Example:**
```typescript
const result = await approveExpenseWithRBAC(
  expenseId,
  "Approved - necessary for operations"
)

if (result.success) {
  console.log("Expense approved")
  // If all approvals complete, status changes to APPROVED
  // Next approver is notified automatically
}
```

**Process:**
1. Verifies user is assigned approver
2. Records approval with timestamp
3. Moves to next approval level (if any)
4. If final approval, changes status to APPROVED
5. Notifies next approver or finance team

#### `rejectExpenseWithRBAC(expenseId, reason)`
Rejects an expense at current approval level.

**Permissions Required:** `expenses:approve`

**Example:**
```typescript
const result = await rejectExpenseWithRBAC(
  expenseId,
  "Missing receipt. Please resubmit with valid receipt."
)

if (result.success) {
  // Status changes to REJECTED
  // Submitter is notified
  console.log("Expense rejected")
}
```

**Process:**
1. Verifies user is assigned approver
2. Records rejection with reason
3. Changes status to REJECTED
4. Releases budget commitment (if allocated)
5. Notifies submitter with reason

### Payment Processing

#### `processExpensePaymentWithRBAC(expenseId, paymentMethod)`
Processes reimbursement for approved expense.

**Permissions Required:** `expenses:process`

**Example:**
```typescript
const result = await processExpensePaymentWithRBAC(
  expenseId,
  "BANK_TRANSFER"
)

if (result.success) {
  console.log("Payment initiated")
  // Status changes to PAID once confirmed
}
```

**Payment Methods:**
- `BANK_TRANSFER` - Direct deposit to employee account
- `CHECK` - Physical check
- `CASH` - Cash reimbursement
- `PAYROLL` - Add to next payroll cycle

#### `markExpenseAsPaidWithRBAC(expenseId)`
Marks expense as paid after payment confirmation.

**Permissions Required:** `expenses:process`

### Bulk Operations

#### `bulkApproveExpensesWithRBAC(expenseIds, comment?)`
Approves multiple expenses at once.

**Permissions Required:** `expenses:approve`

**Example:**
```typescript
const result = await bulkApproveExpensesWithRBAC(
  ["exp_1", "exp_2", "exp_3"],
  "Batch approval - all receipts verified"
)

console.log(`Approved: ${result.approved}, Failed: ${result.failed}`)
```

#### `bulkPayExpensesWithRBAC(expenseIds, paymentMethod)`
Processes payment for multiple expenses.

**Permissions Required:** `expenses:process`

## Approval Workflow

### Approval Levels

Expenses route through approval levels based on amount:

| Amount Range | Approval Level | Typical Approver |
|--------------|----------------|------------------|
| $0 - $100 | Level 1 | Department Head |
| $101 - $500 | Level 2 | Finance Manager |
| $501 - $2,000 | Level 3 | Principal/CFO |
| $2,001+ | Level 4 | Board approval |

**Example Workflow for $750 expense:**
```
1. Teacher submits expense
2. Department Head (Level 1) approves
3. Finance Manager (Level 2) approves
4. Principal (Level 3) approves
5. Status → APPROVED
6. Finance team processes payment
7. Status → PAID
```

### Fast-Track Approval
Expenses meeting these criteria skip some levels:
- Pre-approved vendors
- Recurring expenses (utilities)
- Emergency expenses (with justification)
- Below department threshold ($50)

## Receipt Management

### Acceptable Receipts
- Original receipts (preferred)
- Digital receipts (email confirmations)
- Invoice copies
- Credit card statements (last resort)

### Receipt Requirements
- Clear vendor name
- Transaction date
- Amount matching expense
- Items/services listed
- Payment method indicated

### OCR (Optical Character Recognition)
The system automatically extracts:
- Vendor name
- Date
- Total amount
- Tax amount
- Individual line items

**Note:** Always verify OCR results before submitting.

## Budget Integration

### Real-Time Budget Checks

When submitting an expense:
```
1. Check if budget allocation specified
2. Verify allocation has available funds
3. Calculate: Available = Allocated - Spent - Committed
4. If Amount > Available → Show warning
5. Allow override with justification (if permitted)
6. Commit budget amount on submission
7. Deduct from budget on approval
```

### Budget Overrun Handling

If expense would exceed budget:
- **Option 1:** Request budget transfer
- **Option 2:** Use contingency fund
- **Option 3:** Defer expense to next period
- **Option 4:** Reduce expense amount

## Workflow

### 1. Submission Phase
```
1. Employee incurs expense
2. Collects receipt
3. Logs into system
4. Fills expense form
5. Uploads receipt
6. Selects budget allocation
7. Submits for approval
8. Receives confirmation email
```

### 2. Approval Phase
```
1. Approver receives email notification
2. Reviews expense details and receipt
3. Verifies budget availability
4. Approves or rejects with comment
5. System notifies next approver (if any)
6. Repeat until all approvals complete
```

### 3. Payment Phase
```
1. Finance team reviews approved expenses
2. Verifies payment details
3. Processes batch payments (weekly)
4. Marks expenses as PAID
5. Sends confirmation to employees
```

## Integration with Other Modules

### Budget Module
- Real-time budget availability
- Automatic budget deduction
- Variance impact tracking
- Budget transfer requests

### Accounts Module
- Journal entries for each expense
- Debit expense accounts
- Credit cash/payable accounts
- Month-end reconciliation

### Banking Module
- Bank transfer initiation
- Payment tracking
- Bank statement reconciliation

### Payroll Module
- Add reimbursements to payroll
- Tax treatment of reimbursements
- Net pay adjustment

## RBAC (Role-Based Access Control)

### Permissions

| Role | View | Create | Edit | Delete | Approve | Pay |
|------|------|--------|------|--------|---------|-----|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ACCOUNTANT** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TEACHER** | ✅ (own) | ✅ | ✅ (own) | ✅ (own) | ❌ | ❌ |
| **STAFF** | ✅ (own) | ✅ | ✅ (own) | ✅ (own) | ❌ | ❌ |
| **STUDENT** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GUARDIAN** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Custom Permissions:**
- Department heads can approve their department's expenses
- Finance managers can approve up to $5,000
- Principal/CFO can approve any amount

## Best Practices

### 1. Timely Submission
- Submit expenses within 30 days
- Don't accumulate expenses
- Submit receipts immediately
- Set reminders for recurring expenses

### 2. Receipt Quality
- Take clear photos
- Ensure all corners visible
- Good lighting, no glare
- Store original receipts for 7 years

### 3. Accurate Descriptions
- Be specific about purpose
- Include project/event name
- Mention beneficiaries
- Provide context for unusual expenses

### 4. Budget Awareness
- Check budget before incurring expense
- Coordinate large expenses with finance
- Plan expenses quarterly
- Track department spending

### 5. Approval Etiquette
- Review expenses within 48 hours
- Provide constructive feedback
- Ask questions if unclear
- Escalate complex cases

## Reports & Analytics

### Standard Reports

1. **Expense Summary Report**
   - Total expenses by period
   - Breakdown by category
   - Breakdown by department
   - Top spenders

2. **Approval Status Report**
   - Pending approvals by approver
   - Average approval time
   - Rejection rate by category
   - Bottleneck identification

3. **Payment Status Report**
   - Approved but unpaid expenses
   - Payment processing time
   - Payment method distribution
   - Outstanding reimbursements

4. **Budget vs Actual Report**
   - Expenses by budget allocation
   - Overrun/underrun by category
   - Forecast to year-end

5. **Receipt Compliance Report**
   - Expenses missing receipts
   - Duplicate receipts detected
   - Receipt quality scores

### Custom Reports
- Department-wise spending trends
- Vendor analysis
- Seasonal expense patterns
- Policy violation reports

## Troubleshooting

### Approval Stuck
**Issue:** Expense stuck at approval level for >5 days

**Solution:**
- Send reminder email to approver
- Check if approver is on leave
- Escalate to backup approver
- Admin can reassign approver

### Receipt Upload Failed
**Issue:** Cannot upload receipt image

**Solution:**
- Check file size (<10MB)
- Verify file format (JPG, PNG, PDF)
- Check internet connection
- Try different browser
- Contact support if persists

### Budget Check Failed
**Issue:** System says insufficient budget but allocation shows available funds

**Solution:**
- Verify correct allocation selected
- Check for committed but unapproved expenses
- Run budget recalculation
- Contact finance team

## Future Enhancements

1. **Mobile App**: Submit expenses on-the-go
2. **Credit Card Integration**: Auto-import transactions
3. **Per Diem**: Automated per diem calculations
4. **Mileage Tracking**: GPS-based mileage reimbursement
5. **AI Categorization**: Auto-categorize based on vendor/description

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `validation.ts` - Zod schemas
- `types.ts` - TypeScript types
- `lib/approvals.ts` - Approval workflow logic

## Support

For questions or issues with the Expense module, contact the finance team at finance@school.edu or check the main finance documentation.
