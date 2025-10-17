# Fees — Financial Management System

**Admin Control Center for School Fee Collection and Financial Management**

The Fees module provides comprehensive financial management for educational institutions, handling fee structure configuration, payment collection, outstanding tracking, discounts, scholarships, refunds, and detailed financial reporting with multi-tenant isolation.

### What Admins Can Do

**Core Capabilities:**
- 💰 Configure complex fee structures (course-wise, category-wise)
- 📋 Create and manage fee components (tuition, lab, library, etc.)
- 💳 Process payments through multiple channels
- 📊 Track outstanding fees and generate defaulter lists
- 🎓 Manage scholarships and discounts
- 💸 Process refunds with approval workflow
- 📁 Generate financial reports and reconciliation
- 🧾 Bulk fee collection and receipt generation
- 📧 Automated payment reminders and notifications

### What Accountants Can Do
- ✅ Full access to fee management and collection
- ✅ Generate financial reports and analytics
- ✅ Process refunds and adjustments
- ✅ Manage payment reconciliation
- ✅ Export financial data for accounting
- ❌ Cannot modify school structure

### What Students Can View
- ✅ View their fee structure and payment schedule
- ✅ Check outstanding dues
- ✅ Make online payments
- ✅ Download fee receipts
- ✅ View payment history
- ❌ Cannot see other students' financial data

### What Parents Can Do
- ✅ View child's fee details
- ✅ Make online payments
- ✅ Download receipts and statements
- ✅ Set up payment reminders
- ✅ View payment history
- ❌ Cannot modify fee structure

### Current Implementation Status
**Planning Stage ⏸️**

**Completed:**
- ⏸️ Fee structure schema design
- ⏸️ Payment gateway research

**In Progress:**
- 🚧 Fee configuration interface
- 🚧 Payment processing system

**Planned:**
- ⏸️ Multiple payment gateway integration
- ⏸️ Automated reminder system
- ⏸️ Financial reporting dashboard
- ⏸️ Refund management
- ⏸️ Scholarship allocation system

---

## Admin Workflows

### 1. Configure Fee Structure
**Prerequisites:** Academic year and courses configured

1. Navigate to `/fees/structure`
2. Click "Create Fee Structure"
3. Configure structure details:
   - **Academic Year**: Select year/semester
   - **Course/Class**: Choose applicable programs
   - **Student Category**: Regular, NRI, Management quota
   - **Fee Components**:
     - Tuition Fee: Amount and frequency
     - Lab Fee: For practical courses
     - Library Fee: Annual/semester
     - Sports Fee: Optional component
     - Transport Fee: Route-based
     - Hostel Fee: For residential students
4. Set payment terms:
   - **Due Dates**: Component-wise deadlines
   - **Installments**: Number and amounts
   - **Late Fee**: Penalty calculation rules
   - **Early Payment**: Discount percentage
5. Save and publish structure
6. System applies to enrolled students

### 2. Collect Fee Payment
**Prerequisites:** Fee structure assigned to student

1. Navigate to `/fees/collection`
2. Search student by ID/name
3. View fee details:
   - Total amount due
   - Components breakdown
   - Previous payments
   - Outstanding balance
4. Select payment method:
   - Cash
   - Cheque/DD
   - Online transfer
   - Card payment
   - UPI/Mobile payment
5. Enter payment details:
   - Amount received
   - Transaction reference
   - Payment date
6. Apply adjustments if any:
   - Discounts
   - Waivers
   - Scholarships
7. Generate receipt:
   - System creates unique receipt number
   - Print or email receipt
   - Update student ledger

### 3. Manage Outstanding Fees
**Prerequisites:** Payment deadlines configured

1. Navigate to `/fees/outstanding`
2. View defaulters dashboard:
   - Total outstanding amount
   - Number of defaulters
   - Category-wise breakdown
3. Filter by:
   - Class/Course
   - Outstanding amount range
   - Days overdue
   - Student category
4. Generate defaulter list:
   - Export to CSV/PDF
   - Include contact details
5. Send reminders:
   - Select students
   - Choose reminder template
   - Send via email/SMS
   - Schedule follow-ups
6. Apply late fees:
   - Calculate penalties
   - Add to student account
   - Generate updated statements

### 4. Process Scholarships/Discounts
**Prerequisites:** Scholarship criteria defined

1. Navigate to `/fees/scholarships`
2. Create scholarship scheme:
   - **Name**: Merit/Need-based/Sports
   - **Eligibility**: Academic/income criteria
   - **Amount**: Fixed or percentage
   - **Validity**: Duration of benefit
3. Identify eligible students:
   - Run eligibility check
   - Review applications
   - Verify documents
4. Approve scholarships:
   - Select beneficiaries
   - Set scholarship amount
   - Apply to fee account
5. Track utilization:
   - Monitor scholarship budget
   - Generate beneficiary reports
   - Renewal processing

### 5. Handle Refunds
**Prerequisites:** Refund policy configured

1. Navigate to `/fees/refunds`
2. View refund requests
3. Verify refund eligibility:
   - Check withdrawal date
   - Calculate refundable amount
   - Apply deductions per policy
4. Process refund:
   - Create refund entry
   - Get approval (if required)
   - Select refund method
   - Update student account
5. Complete transaction:
   - Process payment
   - Generate refund receipt
   - Update financial records
   - Notify student/parent

### 6. Generate Financial Reports
1. Navigate to `/fees/reports`
2. Select report type:
   - **Collection Report**: Daily/monthly collection
   - **Outstanding Report**: Pending fees analysis
   - **Class-wise Report**: Fee collection by class
   - **Component-wise**: Individual fee components
   - **Discount Report**: Scholarships and waivers
   - **Reconciliation**: Bank reconciliation
3. Apply filters:
   - Date range
   - Payment method
   - Student category
   - Fee component
4. Generate report:
   - Preview on screen
   - Export to PDF/Excel
   - Schedule automated reports
   - Email to stakeholders

---

## Integration with Other Features

### Links to Students Module
- Fee structure assignment on enrollment
- Student account ledger maintenance
- Outstanding fees blocking exam hall tickets
- Graduation clearance certificate

### Links to Admission Module
- Admission fee collection
- Fee structure display during admission
- Payment verification for seat confirmation
- Refund on admission cancellation

### Links to Exams Module
- Fee clearance for exam eligibility
- Exam fee collection
- Re-exam fee processing
- Certificate fee collection

### Links to Library Module
- Library fine integration
- Book damage charges
- Library clearance for graduation

### Links to Transport Module
- Route-based fee calculation
- Monthly transport fee collection
- Route change fee adjustment

### Links to Hostel Module
- Room-based fee structure
- Mess fee collection
- Security deposit management
- Hostel clearance

---

## Technical Implementation

### Fees Block

Complete fee management system with flexible structure configuration, multi-channel payment processing, and comprehensive financial reporting.

### Files and Responsibilities
- `content.tsx`: Fee dashboard with statistics
- `structure/`: Fee structure management
  - `list.tsx`: Structure listing
  - `form.tsx`: Structure configuration
  - `components.tsx`: Fee component setup
- `collection/`: Payment collection
  - `search.tsx`: Student fee search
  - `payment-form.tsx`: Payment entry
  - `receipt.tsx`: Receipt generation
- `outstanding/`: Outstanding management
  - `defaulters.tsx`: Defaulter list
  - `reminders.tsx`: Reminder system
  - `statements.tsx`: Account statements
- `scholarships/`: Discount management
  - `schemes.tsx`: Scholarship schemes
  - `allocation.tsx`: Beneficiary selection
- `refunds/`: Refund processing
  - `requests.tsx`: Refund request list
  - `approval.tsx`: Approval workflow
- `reports/`: Financial reporting
  - `collection.tsx`: Collection reports
  - `outstanding.tsx`: Outstanding analysis
  - `reconciliation.tsx`: Bank reconciliation
- `validation.ts`: Zod schemas for validation
- `actions.ts`: Server actions for fee operations
- `types.ts`: TypeScript types
- `utils.ts`: Calculation utilities

### Data Flow
1. Structure configuration → Student assignment → Payment schedule
2. Payment collection → Receipt generation → Ledger update
3. Outstanding calculation → Reminder sending → Late fee application
4. Report generation → Export → Financial analysis

### Multi-Tenant Safety
- Every fee record includes `schoolId`
- Payment receipts scoped by tenant
- Financial data strictly isolated
- Separate payment gateway configs per school

---

## Database Schema

```prisma
model FeeStructure {
  id              String   @id @default(cuid())
  schoolId        String
  name            String
  academicYearId  String
  courseId        String?
  classId         String?
  category        String?  // Regular, NRI, Management
  totalAmount     Float
  components      Json     // Detailed fee components
  paymentTerms    Json     // Installment details
  lateFeeRules    Json     // Penalty configuration
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  school          School   @relation(fields: [schoolId], references: [id])
  academicYear    SchoolYear @relation(fields: [academicYearId], references: [id])
  students        StudentFee[]

  @@unique([name, schoolId, academicYearId])
  @@index([schoolId, academicYearId, isActive])
}

model StudentFee {
  id              String   @id @default(cuid())
  schoolId        String
  studentId       String
  structureId     String
  totalAmount     Float
  paidAmount      Float    @default(0)
  discountAmount  Float    @default(0)
  outstandingAmount Float  @default(0)
  status          FeeStatus @default(PENDING)
  dueDate         DateTime
  lastPaymentDate DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  school          School   @relation(fields: [schoolId], references: [id])
  student         Student  @relation(fields: [studentId], references: [id])
  structure       FeeStructure @relation(fields: [structureId], references: [id])
  payments        Payment[]
  discounts       FeeDiscount[]

  @@unique([studentId, structureId])
  @@index([schoolId, status])
  @@index([schoolId, studentId])
}

model Payment {
  id              String   @id @default(cuid())
  schoolId        String
  studentFeeId    String
  receiptNumber   String
  amount          Float
  paymentMethod   PaymentMethod
  transactionId   String?
  paymentDate     DateTime
  collectedBy     String
  status          PaymentStatus @default(SUCCESS)
  notes           String?
  createdAt       DateTime @default(now())

  school          School   @relation(fields: [schoolId], references: [id])
  studentFee      StudentFee @relation(fields: [studentFeeId], references: [id])
  refund          Refund?

  @@unique([receiptNumber, schoolId])
  @@index([schoolId, paymentDate])
  @@index([transactionId])
}

model FeeDiscount {
  id              String   @id @default(cuid())
  schoolId        String
  studentFeeId    String
  type            DiscountType // SCHOLARSHIP, SIBLING, STAFF, EARLYBIRD
  name            String
  amount          Float
  percentage      Float?
  reason          String?
  approvedBy      String
  validUntil      DateTime?
  createdAt       DateTime @default(now())

  school          School   @relation(fields: [schoolId], references: [id])
  studentFee      StudentFee @relation(fields: [studentFeeId], references: [id])

  @@index([schoolId, type])
}

model Refund {
  id              String   @id @default(cuid())
  schoolId        String
  paymentId       String   @unique
  amount          Float
  reason          String
  refundMethod    String
  refundDate      DateTime
  processedBy     String
  status          RefundStatus @default(PENDING)
  createdAt       DateTime @default(now())

  school          School   @relation(fields: [schoolId], references: [id])
  payment         Payment  @relation(fields: [paymentId], references: [id])

  @@index([schoolId, status])
}

enum FeeStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  WAIVED
}

enum PaymentMethod {
  CASH
  CHEQUE
  CARD
  ONLINE
  UPI
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCESS
  FAILED
  REFUNDED
}

enum DiscountType {
  SCHOLARSHIP
  SIBLING
  STAFF
  EARLYBIRD
  NEED_BASED
  MERIT
}

enum RefundStatus {
  PENDING
  APPROVED
  PROCESSING
  COMPLETED
  REJECTED
}
```

---

## Technology Stack & Dependencies

This feature uses the platform's standard technology stack with financial-specific additions:

### Core Framework
- **Next.js 15.4+** - Server Components for secure financial operations
- **React 19+** - Server Actions for payment processing
- **TypeScript** - Type-safe financial calculations

### Payment Integration
- **Stripe** - International payment processing
- **Razorpay/PayU** - Local payment methods
- **Bank APIs** - Direct bank integration

### Financial Libraries
- **decimal.js** - Precise monetary calculations
- **currency.js** - Multi-currency support
- **date-fns** - Payment schedule calculations

### Reporting
- **React PDF** - Receipt and statement generation
- **ExcelJS** - Financial report exports
- **Recharts** - Financial analytics charts

### Security
- **PCI DSS Compliance** - Card data handling
- **Encryption** - Sensitive data protection
- **Audit Logging** - Financial transaction tracking

### Server Actions Pattern
```typescript
"use server"
export async function collectPayment(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = paymentSchema.parse(input)

  // Begin transaction for financial integrity
  const result = await db.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.payment.create({
      data: {
        ...validated,
        schoolId,
        receiptNumber: await generateReceiptNumber(schoolId),
        collectedBy: session.user.id,
        status: 'SUCCESS'
      }
    })

    // Update student fee account
    await tx.studentFee.update({
      where: { id: validated.studentFeeId },
      data: {
        paidAmount: { increment: validated.amount },
        outstandingAmount: { decrement: validated.amount },
        status: calculateFeeStatus(studentFee),
        lastPaymentDate: new Date()
      }
    })

    // Generate receipt
    const receipt = await generateReceipt(payment)

    return { payment, receipt }
  })

  // Send receipt email
  await sendPaymentReceipt(result.receipt)

  revalidatePath('/fees/collection')
  return { success: true, receiptNumber: result.payment.receiptNumber }
}
```

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
pnpm test fees             # Run fee module tests
pnpm test:e2e fees         # Run E2E payment tests

# Financial Reports
pnpm generate:receipts     # Generate bulk receipts
pnpm export:financial      # Export financial data
```