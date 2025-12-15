# Student Fees Management

Comprehensive student fee management system with payment plans, late fee automation, and family billing.

## Overview

The Fees module manages all student-related fees including tuition, registration, transportation, meals, and other charges. It supports flexible payment plans, automatic late fee calculation, family discounts, and integration with other finance modules.

## Key Features

### 1. Fee Structure Management

- Define fee types (tuition, registration, transportation, etc.)
- Set amounts by year level, program, or custom criteria
- Schedule recurring fees (monthly, quarterly, annually)
- Early bird discounts and promotions

### 2. Payment Plans

- Flexible installment schedules
- Custom payment dates
- Down payment requirements
- Auto-generate invoices for installments

### 3. Late Fee Automation

- Configurable grace periods
- Percentage or fixed late fees
- Automatic calculation and application
- Waiver management with approval

### 4. Family Billing

- Single invoice for multiple students
- Family discounts (10% 2nd child, 20% 3rd+ child)
- Split billing between guardians
- Combined payment history

### 5. Payment Processing

- Multiple payment methods (card, bank transfer, cash, check)
- Online payment portal
- Payment confirmation emails
- Receipt generation

## Data Models

### FeeStructure

```typescript
{
  id: string
  name: string
  description?: string
  category: FeeCategory
  amount: Decimal
  frequency: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "ANNUALLY"
  applicableTo: "ALL" | "YEAR_LEVEL" | "PROGRAM"
  yearLevels?: string[]
  programs?: string[]
  effectiveFrom: Date
  effectiveTo?: Date
  isActive: boolean
}
```

### StudentFee

```typescript
{
  id: string
  studentId: string
  feeStructureId: string
  academicYear: string
  amountDue: Decimal
  amountPaid: Decimal
  amountOutstanding: Decimal
  dueDate: Date
  paidDate?: Date
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED"
  paymentPlanId?: string
  lateFeeAmount?: Decimal
  discount?: Decimal
}
```

### PaymentPlan

```typescript
{
  id: string
  studentFeeId: string
  totalAmount: Decimal
  downPayment: Decimal
  numberOfInstallments: number
  installmentAmount: Decimal
  frequency: "MONTHLY" | "BI_MONTHLY" | "QUARTERLY"
  startDate: Date
  installments: PaymentInstallment[]
  status: "ACTIVE" | "COMPLETED" | "DEFAULTED"
}
```

### PaymentInstallment

```typescript
{
  id: string
  paymentPlanId: string
  installmentNumber: number
  dueDate: Date
  amount: Decimal
  paidAmount: Decimal
  status: "PENDING" | "PAID" | "OVERDUE"
  lateFeeApplied?: Decimal
}
```

### FeePayment

```typescript
{
  id: string
  studentFeeId: string
  paymentDate: Date
  amount: Decimal
  paymentMethod: PaymentMethod
  reference: string
  receiptNumber?: string
  processedBy: string
  notes?: string
}
```

## Server Actions

### Fee Structure Management

#### `createFeeStructureWithRBAC(data)`

Creates a new fee structure.

**Permissions Required:** `fees:create`

**Example:**

```typescript
const result = await createFeeStructureWithRBAC({
  name: "Grade 10 Tuition",
  description: "Annual tuition for Grade 10 students",
  category: "TUITION",
  amount: 8000,
  frequency: "ANNUALLY",
  applicableTo: "YEAR_LEVEL",
  yearLevels: ["Grade 10"],
  effectiveFrom: new Date("2024-09-01"),
})
```

### Student Fee Assignment

#### `assignFeeToStudentWithRBAC(studentId, feeStructureId, dueDate)`

Assigns a fee to a specific student.

**Permissions Required:** `fees:create`

**Example:**

```typescript
const result = await assignFeeToStudentWithRBAC(
  "student_123",
  "fee_structure_456",
  new Date("2024-12-01")
)
```

#### `bulkAssignFeesWithRBAC(studentIds, feeStructureId, dueDate)`

Assigns fees to multiple students at once.

**Permissions Required:** `fees:create`

**Example:**

```typescript
const result = await bulkAssignFeesWithRBAC(
  ["student_1", "student_2", "student_3"],
  "fee_structure_tuition_2024",
  new Date("2024-12-01")
)

console.log(`Assigned to ${result.success} students`)
console.log(`Failed: ${result.failed}`)
```

### Payment Plans

#### `createPaymentPlanWithRBAC(data)`

Creates a payment plan for a student fee.

**Permissions Required:** `fees:create`

**Example:**

```typescript
const result = await createPaymentPlanWithRBAC({
  studentFeeId: "fee_789",
  downPayment: 2000, // $2,000 down
  numberOfInstallments: 6, // 6 monthly installments
  frequency: "MONTHLY",
  startDate: new Date("2024-10-01"),
})

if (result.success && result.data) {
  console.log(
    `Plan created with ${result.data.installments.length} installments`
  )
  console.log(`Installment amount: $${result.data.installmentAmount}`)
}
```

**Calculation:**

```
Total Fee: $8,000
Down Payment: $2,000
Remaining: $6,000
Installments: 6
Monthly Payment: $1,000
```

### Payment Processing

#### `recordFeePaymentWithRBAC(data)`

Records a payment for a student fee.

**Permissions Required:** `fees:create`

**Example:**

```typescript
const result = await recordFeePaymentWithRBAC({
  studentFeeId: "fee_789",
  amount: 1000,
  paymentMethod: "BANK_TRANSFER",
  reference: "TXN-123456",
  paymentDate: new Date(),
})

if (result.success) {
  console.log("Payment recorded")
  console.log(`Remaining balance: $${result.data.amountOutstanding}`)
}
```

**Process:**

1. Validates payment amount
2. Updates student fee record
3. Applies to installments (if payment plan)
4. Generates receipt
5. Sends confirmation email
6. Creates accounting journal entry

### Late Fee Management

#### `calculateAndApplyLateFees()`

Automatically calculates and applies late fees to overdue fees.

**Permissions Required:** `fees:process` (usually run by system cron job)

**Configuration:**

```typescript
{
  gracePeriodDays: 7,        // No late fee for first 7 days
  lateFeeType: "PERCENTAGE", // or "FIXED"
  lateFeeValue: 5,           // 5% or $5 depending on type
  maximumLateFee: 500        // Cap at $500
}
```

**Example:**

```
Fee Amount: $1,000
Due Date: 2024-11-01
Payment Date: 2024-11-15 (14 days late)
Grace Period: 7 days
Days Overdue: 14 - 7 = 7 days
Late Fee: $1,000 × 5% = $50
Total Due: $1,050
```

#### `waiveLateFeeWithRBAC(studentFeeId, reason)`

Waives late fee for a student (requires approval).

**Permissions Required:** `fees:approve`

**Example:**

```typescript
const result = await waiveLateFeeWithRBAC(
  studentFeeId,
  "Financial hardship - parent lost job"
)
```

### Family Billing

#### `generateFamilyInvoiceWithRBAC(guardianId)`

Generates a combined invoice for all students in a family.

**Returns:**

```typescript
{
  guardianId: string
  guardianName: string
  students: Array<{
    studentId: string
    studentName: string
    fees: StudentFee[]
    totalDue: number
  }>
  subtotal: number
  familyDiscount: number
  lateFees: number
  totalDue: number
  dueDate: Date
}
```

**Family Discount Calculation:**

```
1st Child: Full price
2nd Child: 10% discount
3rd+ Children: 20% discount

Example:
Child 1: $8,000 (no discount)
Child 2: $7,200 ($8,000 - 10%)
Child 3: $6,400 ($8,000 - 20%)
Total: $21,600 (vs $24,000 full price)
Savings: $2,400
```

## Fee Categories

| Category           | Description             | Frequency      | Typical Amount |
| ------------------ | ----------------------- | -------------- | -------------- |
| **TUITION**        | Academic tuition        | Annual/Monthly | $5,000-$15,000 |
| **REGISTRATION**   | Registration/enrollment | One-time       | $500-$1,000    |
| **TRANSPORTATION** | Bus service             | Annual/Monthly | $500-$1,500    |
| **MEALS**          | Cafeteria/lunch         | Monthly        | $100-$300      |
| **BOOKS**          | Textbooks/materials     | Annual         | $300-$800      |
| **UNIFORMS**       | School uniforms         | Annual         | $200-$500      |
| **ACTIVITIES**     | Extracurricular         | Per activity   | $50-$500       |
| **TECHNOLOGY**     | Laptop/tablet rental    | Annual         | $300-$800      |
| **EXAM**           | Exam/assessment fees    | Per exam       | $50-$200       |
| **LIBRARY**        | Library card/services   | Annual         | $20-$50        |
| **LAB**            | Laboratory fees         | Per semester   | $100-$300      |
| **OTHER**          | Miscellaneous           | Varies         | Varies         |

## Workflow

### Annual Fee Setup

```
1. Finance team defines fee structures
2. Set amounts for each year level/program
3. Configure payment plan templates
4. Set late fee policies
5. Publish fee schedule to parents

---

6. System auto-assigns fees to students
7. Generate invoices and send to parents
8. Parents select payment plan or pay in full
9. System creates payment schedule
```

### Payment Collection

```
1. Parent receives invoice/payment reminder
2. Parent pays via online portal or in-person
3. Payment recorded in system
4. Receipt generated automatically
5. Balance updated
6. Confirmation email sent
```

### Late Fee Processing

```
1. Nightly cron job runs
2. Identifies overdue fees (past grace period)
3. Calculates late fees
4. Applies to student accounts
5. Sends overdue notice to parents
6. Escalates to collections (if 60+ days)
```

## Integration with Other Modules

### Accounts Module

- Revenue recognition for fee payments
- Deferred revenue for advance payments
- Bad debt write-offs

### Invoice Module

- Generates invoices for fees
- Links payments to invoices
- Tracks payment status

### Receipt Module

- Auto-generates receipts for payments
- Digital and printable formats
- Sequential receipt numbering

### Wallet Module

- Parents can pay from digital wallet
- Auto-debit for recurring fees
- Refunds to wallet

### Banking Module

- Records deposits from fee payments
- Bank reconciliation
- Cash flow tracking

## RBAC (Role-Based Access Control)

### Permissions

| Role           | View       | Create | Edit | Delete | Process  | Waive Fees |
| -------------- | ---------- | ------ | ---- | ------ | -------- | ---------- |
| **ADMIN**      | ✅         | ✅     | ✅   | ✅     | ✅       | ✅         |
| **ACCOUNTANT** | ✅         | ✅     | ✅   | ✅     | ✅       | ✅         |
| **TEACHER**    | ✅ (class) | ❌     | ❌   | ❌     | ❌       | ❌         |
| **STAFF**      | ❌         | ❌     | ❌   | ❌     | ❌       | ❌         |
| **STUDENT**    | ✅ (own)   | ❌     | ❌   | ❌     | ❌       | ❌         |
| **GUARDIAN**   | ✅ (kids)  | ❌     | ❌   | ❌     | ✅ (pay) | ❌         |

**Note:** Guardians can view and pay fees for their children.

## Best Practices

### 1. Clear Communication

- Publish fee schedule before enrollment
- Send reminders 7 days before due date
- Provide multiple payment options
- Offer financial aid information

### 2. Flexible Payment Options

- Offer payment plans to all families
- No penalty for early payment
- Consider family discounts
- Have financial hardship policy

### 3. Timely Processing

- Record payments within 24 hours
- Generate receipts immediately
- Update balances in real-time
- Reconcile daily

### 4. Late Fee Management

- Provide grace period (7-14 days)
- Send friendly reminders first
- Apply late fees consistently
- Have waiver policy for hardship

### 5. Year-End Procedures

- Refund overpayments
- Write off uncollectible balances
- Generate tax receipts (if applicable)
- Plan next year's fees

## Reports & Analytics

### Standard Reports

1. **Fee Collection Report**
   - Total fees billed
   - Total collected
   - Outstanding balances
   - Collection rate

2. **Payment Plan Status**
   - Active payment plans
   - On-time vs late payments
   - Default rate
   - Average installments

3. **Overdue Fees Report**
   - Fees overdue by student
   - Age analysis (0-30, 31-60, 61-90, 90+ days)
   - Late fees applied
   - Follow-up actions needed

4. **Family Billing Summary**
   - Fees by family
   - Family discounts applied
   - Payment history
   - Outstanding balances

5. **Revenue Forecast**
   - Expected monthly collections
   - Payment plan schedule
   - Seasonal trends

## Troubleshooting

### Payment Not Reflecting

**Issue:** Parent paid but balance not updated

**Solution:**

- Check payment method used
- Verify payment cleared (bank transfer)
- Look for duplicate payments
- Manual adjustment if confirmed

### Late Fee Incorrectly Applied

**Issue:** Late fee added despite timely payment

**Solution:**

- Review payment date vs due date
- Check grace period settings
- Verify payment was recorded correctly
- Waive late fee if error

### Payment Plan Not Generated

**Issue:** Cannot create payment plan

**Solution:**

- Ensure fee is assigned to student
- Verify fee hasn't been paid already
- Check minimum down payment met
- Review validation errors

## Future Enhancements

1. **Auto-Pay**: Automatic monthly charges to saved payment methods
2. **Payment Reminders**: SMS/WhatsApp reminders
3. **Scholarship Management**: Integrate scholarship application and approval
4. **Financial Aid**: Income-based fee reduction
5. **Payment Analytics**: AI-powered collection predictions

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `payment-plans.tsx` - Payment plan management
- `late-fees.ts` - Late fee calculation logic

## Support

For questions or issues with the Fees module, contact: finance@school.edu
