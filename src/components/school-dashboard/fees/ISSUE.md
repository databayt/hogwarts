# Fees — Production Readiness Tracker

Track production readiness and implementation progress for the Fees module.

**Status:** Planning Stage ⏸️
**Last Updated:** 2025-10-17

---

## Current Status

**Planning Stage Features ⏸️**

- [ ] Fee structure configuration
- [ ] Payment collection system
- [ ] Outstanding tracking
- [ ] Discount and scholarship management
- [ ] Refund processing
- [ ] Financial reporting
- [ ] Payment gateway integration

---

## Admin Capabilities Checklist

### Core Features

- [ ] Create and manage fee structures
- [ ] Configure fee components (tuition, lab, library, etc.)
- [ ] Set payment schedules and installments
- [ ] Process payments (multiple methods)
- [ ] Track outstanding fees
- [ ] Generate defaulter lists
- [ ] Manage scholarships and discounts
- [ ] Process refunds with approval
- [ ] Generate financial reports
- [ ] Bulk fee collection
- [ ] Automated reminders

### Fee Structure Management

- [ ] Course-wise fee configuration
- [ ] Category-wise pricing (Regular/NRI)
- [ ] Component breakdown
- [ ] Academic year association
- [ ] Installment configuration
- [ ] Late fee rules
- [ ] Early payment discounts
- [ ] Fee revision handling

### Payment Processing

- [ ] Multiple payment methods
- [ ] Online payment gateway
- [ ] Offline payment recording
- [ ] Receipt generation
- [ ] Payment verification
- [ ] Transaction tracking
- [ ] Payment history
- [ ] Bulk payment processing

### Outstanding Management

- [ ] Real-time outstanding calculation
- [ ] Defaulter identification
- [ ] Reminder scheduling
- [ ] Late fee calculation
- [ ] Payment plan creation
- [ ] Outstanding reports
- [ ] Collection follow-up

### Scholarship & Discounts

- [ ] Scholarship scheme creation
- [ ] Eligibility criteria definition
- [ ] Merit-based discounts
- [ ] Need-based assistance
- [ ] Sibling discounts
- [ ] Staff concessions
- [ ] Discount approval workflow
- [ ] Scholarship renewal

### Role-Based Access

- [ ] Admin full fee management
- [ ] Accountant collection and reporting
- [ ] Student view and pay fees
- [ ] Parent view and pay child's fees
- [ ] Teacher read-only access
- [ ] Staff limited collection rights

### Data Integrity

- [ ] Multi-tenant scoping (schoolId)
- [ ] Transaction atomicity
- [ ] Payment reconciliation
- [ ] Audit trail for financial transactions
- [ ] Receipt number uniqueness
- [ ] Double-entry bookkeeping
- [ ] Financial year closure

---

## Polish & Enhancement Items

### Critical Issues (Priority 1) 🔴

**Payment Gateway Integration**

- [ ] Stripe integration for international
- [ ] Razorpay for Indian payments
- [ ] PayPal integration
- [ ] Bank transfer APIs
- [ ] UPI integration
- [ ] Webhook handling
- [ ] Payment status synchronization
- [ ] Failed payment retry
- [ ] Payment reconciliation

**Fee Structure Configuration**

- [ ] Dynamic component creation
- [ ] Formula-based calculations
- [ ] Conditional fee application
- [ ] Pro-rata calculations
- [ ] Fee structure templates
- [ ] Bulk structure assignment
- [ ] Fee structure versioning
- [ ] Migration between structures

**Financial Security**

- [ ] PCI DSS compliance
- [ ] Encryption for sensitive data
- [ ] Secure payment tokenization
- [ ] Access control for financial operations
- [ ] Transaction logging
- [ ] Fraud detection
- [ ] Payment verification
- [ ] Audit trail completeness

### High Priority (Priority 2) 🟡

**Reporting System**

- [ ] Daily collection reports
- [ ] Outstanding analysis
- [ ] Class-wise collection
- [ ] Payment method analysis
- [ ] Discount utilization
- [ ] Revenue forecasting
- [ ] Aging analysis
- [ ] Custom report builder
- [ ] Scheduled report generation
- [ ] Report export (PDF/Excel)

**Communication Features**

- [ ] Automated payment reminders
- [ ] Receipt email/SMS
- [ ] Outstanding notifications
- [ ] Payment confirmation
- [ ] Due date alerts
- [ ] Bulk SMS for defaulters
- [ ] Parent app notifications
- [ ] WhatsApp integration

**Refund Management**

- [ ] Refund request workflow
- [ ] Approval hierarchy
- [ ] Refund calculation rules
- [ ] Partial refund support
- [ ] Refund method selection
- [ ] Refund receipt generation
- [ ] Account adjustment
- [ ] Refund reporting

### Nice to Have (Priority 3) 🟢

**Advanced Features**

- [ ] Recurring payment setup
- [ ] Auto-debit mandates
- [ ] Payment plans/EMI
- [ ] Multi-currency support
- [ ] Financial aid management
- [ ] Sponsor management
- [ ] Fee forecasting
- [ ] Budget planning
- [ ] Financial analytics dashboard
- [ ] Mobile payment app

**Integration Enhancements**

- [ ] Accounting software sync
- [ ] Bank statement import
- [ ] GST/Tax compliance
- [ ] Government reporting
- [ ] Parent portal integration
- [ ] Student portal integration
- [ ] SMS gateway integration
- [ ] Email marketing integration

---

## Database & Schema

### Current Schema (Proposed)

```prisma
model FeeStructure {
  id              String      @id @default(cuid())
  schoolId        String
  name            String
  academicYearId  String
  courseId        String?
  classId         String?
  category        String?
  components      Json        // {tuition: 5000, lab: 500, ...}
  paymentTerms    Json        // {installments: 3, schedule: [...]}
  totalAmount     Float
  lateFeeRules    Json        // {type: 'percentage', value: 2, ...}
  earlyDiscount   Json?       // {percentage: 5, validUntil: ...}
  isActive        Boolean     @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  createdBy       String
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  school          School      @relation(fields: [schoolId], references: [id])
  academicYear    SchoolYear  @relation(fields: [academicYearId], references: [id])
  studentFees     StudentFee[]

  @@unique([name, schoolId, academicYearId])
  @@index([schoolId, isActive])
  @@index([schoolId, academicYearId])
}

model StudentFee {
  id                String      @id @default(cuid())
  schoolId          String
  studentId         String
  structureId       String
  academicYearId    String
  totalAmount       Float
  paidAmount        Float       @default(0)
  discountAmount    Float       @default(0)
  outstandingAmount Float
  lateFeeAmount     Float       @default(0)
  status            FeeStatus   @default(PENDING)
  dueDate           DateTime
  lastPaymentDate   DateTime?
  notes             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  school            School      @relation(fields: [schoolId], references: [id])
  student           Student     @relation(fields: [studentId], references: [id])
  structure         FeeStructure @relation(fields: [structureId], references: [id])
  payments          Payment[]
  discounts         FeeDiscount[]
  reminders         FeeReminder[]

  @@unique([studentId, structureId, academicYearId])
  @@index([schoolId, status])
  @@index([schoolId, studentId])
  @@index([schoolId, dueDate])
}

model Payment {
  id                String        @id @default(cuid())
  schoolId          String
  studentFeeId      String
  receiptNumber     String
  amount            Float
  paymentMethod     PaymentMethod
  paymentDate       DateTime
  transactionId     String?       // External payment gateway ID
  bankReference     String?
  collectedBy       String        // User ID
  status            PaymentStatus @default(PENDING)
  verifiedAt        DateTime?
  verifiedBy        String?
  notes             String?
  metadata          Json?         // Gateway-specific data
  createdAt         DateTime      @default(now())

  school            School        @relation(fields: [schoolId], references: [id])
  studentFee        StudentFee    @relation(fields: [studentFeeId], references: [id])
  refund            Refund?

  @@unique([receiptNumber, schoolId])
  @@unique([transactionId])
  @@index([schoolId, paymentDate])
  @@index([schoolId, status])
}
```

### Schema Enhancements Needed

- [ ] Add `FeeComponent` model for reusable components
- [ ] Add `PaymentGatewayConfig` for multi-gateway support
- [ ] Add `FeeReminder` model for tracking reminders
- [ ] Add `FinancialYear` model for accounting periods
- [ ] Add `FeeWaiver` model for special cases
- [ ] Add `PaymentPlan` model for installments
- [ ] Add `BankAccount` model for reconciliation
- [ ] Add composite indexes for complex queries

---

## Server Actions

### Actions to Implement

- [ ] `createFeeStructure(data)` - Create fee structure
- [ ] `assignFeeStructure(studentIds, structureId)` - Bulk assignment
- [ ] `collectPayment(data)` - Process payment
- [ ] `generateReceipt(paymentId)` - Create receipt
- [ ] `calculateOutstanding(studentId)` - Get dues
- [ ] `applyLateFee(studentFeeId)` - Calculate penalties
- [ ] `applyDiscount(studentFeeId, discount)` - Apply discount
- [ ] `processRefund(paymentId, amount)` - Handle refund
- [ ] `sendReminder(studentIds)` - Send payment reminder
- [ ] `generateDefaulterList(filters)` - Get defaulters
- [ ] `reconcilePayments(bankStatementId)` - Bank reconciliation
- [ ] `closeFinancialYear(yearId)` - Year-end closing
- [ ] `exportFinancialData(filters)` - Export reports
- [ ] `bulkCollectPayments(data)` - Bulk payment processing
- [ ] `verifyOnlinePayment(transactionId)` - Verify gateway payment

### Action Patterns

```typescript
"use server"

export async function collectPayment(data: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = paymentSchema.parse(data)

  // Use transaction for consistency
  const result = await db.$transaction(async (tx) => {
    // Generate unique receipt number
    const receiptNumber = await generateReceiptNumber(schoolId)

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        ...validated,
        schoolId,
        receiptNumber,
        collectedBy: session.user.id,
        status: "SUCCESS",
      },
    })

    // Update student fee account
    const studentFee = await tx.studentFee.update({
      where: { id: validated.studentFeeId },
      data: {
        paidAmount: { increment: validated.amount },
        outstandingAmount: { decrement: validated.amount },
        lastPaymentDate: new Date(),
        status: calculateStatus(/* ... */),
      },
    })

    // Log transaction for audit
    await tx.auditLog.create({
      data: {
        schoolId,
        action: "PAYMENT_COLLECTED",
        entityType: "Payment",
        entityId: payment.id,
        userId: session.user.id,
        metadata: { amount: validated.amount },
      },
    })

    return { payment, studentFee }
  })

  // Send receipt via email
  await sendPaymentReceipt(result.payment)

  revalidatePath("/fees/collection")
  return {
    success: true,
    receiptNumber: result.payment.receiptNumber,
  }
}
```

---

## UI Components

### Components to Create

#### Core Components

- [ ] `fee-structure-form.tsx` - Structure configuration
- [ ] `fee-structure-list.tsx` - Structure management
- [ ] `payment-form.tsx` - Payment collection interface
- [ ] `receipt-generator.tsx` - Receipt creation
- [ ] `outstanding-dashboard.tsx` - Outstanding overview
- [ ] `defaulter-list.tsx` - Defaulter management
- [ ] `discount-form.tsx` - Discount application
- [ ] `refund-wizard.tsx` - Refund processing
- [ ] `fee-statement.tsx` - Student statement
- [ ] `collection-report.tsx` - Daily collection
- [ ] `reconciliation-tool.tsx` - Bank reconciliation
- [ ] `reminder-composer.tsx` - Reminder creation
- [ ] `scholarship-manager.tsx` - Scholarship allocation
- [ ] `payment-gateway-config.tsx` - Gateway setup

#### Supporting Components

- [ ] `fee-component-editor.tsx` - Component configuration
- [ ] `installment-scheduler.tsx` - Payment schedule
- [ ] `late-fee-calculator.tsx` - Penalty calculation
- [ ] `payment-method-selector.tsx` - Method selection
- [ ] `receipt-preview.tsx` - Receipt display
- [ ] `outstanding-badge.tsx` - Due indicator
- [ ] `payment-status-indicator.tsx` - Status display
- [ ] `fee-summary-card.tsx` - Fee overview
- [ ] `payment-history-timeline.tsx` - Payment log
- [ ] `bulk-payment-uploader.tsx` - Bulk processing

### Component Patterns

```tsx
// Payment collection with validation
export function PaymentForm({ studentFee }: { studentFee: StudentFee }) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentFeeId: studentFee.id,
      amount: studentFee.outstandingAmount,
    },
  })

  const onSubmit = async (data: PaymentFormData) => {
    const result = await collectPayment(data)
    if (result.success) {
      toast.success(`Payment collected. Receipt: ${result.receiptNumber}`)
      // Print or email receipt
      await printReceipt(result.receiptNumber)
    }
  }

  return (
    <Form {...form}>
      <AmountInput />
      <PaymentMethodSelector />
      {paymentMethod === "CHEQUE" && <ChequeDetails />}
      {paymentMethod === "ONLINE" && <OnlinePaymentGateway />}
      <ReceiptOptions />
    </Form>
  )
}
```

---

## Testing

### Unit Tests

- [ ] Test fee calculation logic
- [ ] Test installment generation
- [ ] Test late fee calculation
- [ ] Test discount application
- [ ] Test refund calculations
- [ ] Test receipt number generation
- [ ] Test payment validation

### Integration Tests

- [ ] Test payment collection flow
- [ ] Test gateway integration
- [ ] Test receipt generation
- [ ] Test reminder sending
- [ ] Test report generation
- [ ] Test reconciliation process
- [ ] Test multi-tenant isolation

### E2E Tests (Playwright)

- [ ] Test fee structure creation
- [ ] Test payment collection
- [ ] Test online payment flow
- [ ] Test receipt download
- [ ] Test outstanding tracking
- [ ] Test reminder workflow
- [ ] Test refund processing
- [ ] Test financial reports

---

## Documentation

- [x] README.md created with workflows
- [x] ISSUE.md created with tracking
- [ ] Payment gateway integration guide
- [ ] Financial reporting documentation
- [ ] Accountant user guide
- [ ] Parent payment guide
- [ ] API documentation
- [ ] Reconciliation guide

---

## Performance Optimization

- [ ] Index financial queries
- [ ] Cache fee structures
- [ ] Optimize outstanding calculations
- [ ] Batch payment processing
- [ ] Async receipt generation
- [ ] Background job for reminders
- [ ] Pagination for large reports
- [ ] Database partitioning for transactions

---

## Security Requirements

- [ ] PCI DSS compliance for card payments
- [ ] Encryption for sensitive financial data
- [ ] Secure token storage
- [ ] Payment verification mechanisms
- [ ] Audit logging for all transactions
- [ ] Role-based access control
- [ ] Rate limiting for payment APIs
- [ ] Fraud detection rules

---

## Accessibility

- [ ] Screen reader support for payment forms
- [ ] Keyboard navigation for all workflows
- [ ] Clear error messages for payment failures
- [ ] ARIA labels for financial indicators
- [ ] High contrast mode for receipts
- [ ] Print-friendly receipt formatting
- [ ] Mobile-optimized payment interface

---

## Mobile Responsiveness

- [ ] Mobile payment interface
- [ ] Touch-friendly payment forms
- [ ] Mobile receipt viewing
- [ ] Responsive financial dashboard
- [ ] Mobile-optimized reports
- [ ] QR code payment support
- [ ] Mobile app for fee payment

---

## Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production

# Database
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations
pnpm db:seed:fees          # Seed fee test data

# Testing
pnpm test fees             # Run fee unit tests
pnpm test:integration fees  # Run integration tests
pnpm test:e2e fees         # Run E2E tests

# Financial Operations
pnpm fees:reconcile        # Run reconciliation
pnpm fees:reminders        # Send payment reminders
pnpm fees:reports          # Generate financial reports
```

---

**Status Legend:**

- ✅ Complete and production-ready
- 🚧 In progress or needs polish
- ⏸️ Planned but not started
- ❌ Blocked or has critical issues

**Last Review:** 2025-10-17
**Next Review:** After payment gateway integration
