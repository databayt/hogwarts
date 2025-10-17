# Admission — Application & Enrollment Management

**Admin Control Center for Student Applications and Admissions Process**

The Admission module provides comprehensive management of the entire student admission lifecycle, from online applications to enrollment, including merit list generation, seat allocation, and integration with student records and fee collection.

### What Admins Can Do

**Core Capabilities:**
- 📝 Create and manage admission campaigns for different programs
- 📋 Process online applications with document verification
- 🔍 Review and filter applications by status, course, category
- 📊 Generate merit lists with customizable criteria
- 🪑 Automated seat allocation with reservation management
- 📧 Communication with applicants throughout the process
- 📁 Export admission data and generate reports
- 🔄 Bulk operations for application processing
- 💰 Integration with fee collection for admission fees

### What Teachers Can View
- ✅ View admitted students in their assigned classes
- ✅ Access admission statistics for their department
- ❌ Cannot modify admission records
- ❌ No access to application processing

### What Students Can Do
- ✅ Submit online applications
- ✅ Upload required documents
- ✅ Track application status
- ✅ Download admit cards and offer letters
- ❌ Cannot modify submitted applications

### What Parents Can View
- ✅ View child's application status
- ✅ Access admission documents
- ✅ Pay admission fees online
- ❌ Cannot edit applications after submission

### Current Implementation Status
**Planning Stage ⏸️**

**Completed:**
- ⏸️ Database schema design
- ⏸️ API structure planning

**In Progress:**
- 🚧 Application form builder
- 🚧 Document upload system

**Planned:**
- ⏸️ Merit list algorithm implementation
- ⏸️ Seat allocation system
- ⏸️ Payment gateway integration
- ⏸️ Email notification system
- ⏸️ Admission dashboard analytics

---

## Admin Workflows

### 1. Create Admission Campaign
**Prerequisites:** Academic year and programs configured

1. Navigate to `/admission/campaigns`
2. Click "New Campaign" button
3. Configure campaign settings:
   - **Program Selection**: Choose degree programs
   - **Application Period**: Set start and end dates
   - **Application Limit**: Maximum applications allowed
   - **Eligibility Criteria**: Minimum requirements
   - **Document Requirements**: List of required documents
4. Define fee structure for application
5. Set merit calculation formula
6. Configure seat matrix (category-wise reservation)
7. Click "Create Campaign"
8. System generates unique campaign ID
9. Campaign goes live on specified date

### 2. Process Applications
**Prerequisites:** Active admission campaign

1. Navigate to `/admission/applications`
2. View pending applications dashboard
3. Click on application to review:
   - **Personal Information**: Verify student details
   - **Academic Records**: Check eligibility
   - **Documents**: Verify uploaded certificates
   - **Payment Status**: Confirm fee payment
4. Use verification checklist:
   - Mark each document as verified/rejected
   - Add notes for clarification
5. Update application status:
   - Under Review → Document Verification → Eligible/Ineligible
6. System sends automatic email notifications

### 3. Generate Merit List
**Prerequisites:** Application deadline passed

1. Navigate to `/admission/merit`
2. Select admission campaign
3. Configure merit calculation:
   - **Academic Weight**: Percentage from previous education
   - **Entrance Test**: If applicable
   - **Category Reservation**: Apply quota rules
   - **Bonus Points**: Sports, extracurricular
4. Click "Generate Merit List"
5. System calculates ranks automatically
6. Review generated list:
   - Check for anomalies
   - Apply manual adjustments if needed
7. Publish merit list
8. Notify selected candidates

### 4. Seat Allocation
**Prerequisites:** Merit list published

1. Navigate to `/admission/allocation`
2. View seat matrix:
   - Available seats per program
   - Category-wise distribution
   - Filled vs vacant status
3. Run allocation algorithm:
   - **Round 1**: Top merit candidates
   - **Waitlist Management**: Handle withdrawals
   - **Spot Admission**: Fill remaining seats
4. Generate allocation letters
5. Set admission confirmation deadline
6. Track seat acceptance status

### 5. Convert to Student
**Prerequisites:** Admission confirmed and fees paid

1. Navigate to `/admission/confirmed`
2. Select confirmed admissions
3. Click "Generate Student Records"
4. System automatically:
   - Creates student profile
   - Assigns GR number
   - Links to academic program
   - Creates user account
   - Sends welcome email
5. Students appear in `/students` module
6. Archive admission records

### 6. Admission Reports
1. Navigate to `/admission/reports`
2. Select report type:
   - **Application Statistics**: Count by program, category
   - **Conversion Rate**: Applications to admissions
   - **Geographic Distribution**: Student origins
   - **Payment Collection**: Fee status
   - **Document Pending**: Incomplete applications
3. Apply filters (date range, program, category)
4. Export as PDF or CSV
5. Schedule automated reports

---

## Integration with Other Features

### Links to Students Module
- Confirmed admissions create `Student` records
- Application data populates student profile
- Documents transfer to student records
- GR number generation on conversion

### Links to Fees Module
- Application fee collection and tracking
- Admission fee structure definition
- Payment gateway integration
- Fee receipt generation
- Refund processing for cancelled admissions

### Links to Programs/Courses
- Admission campaigns linked to programs
- Course capacity determines seat availability
- Program eligibility criteria
- Batch assignment on admission

### Links to Communication
- Automated email notifications
- SMS alerts for status updates
- Bulk communication to applicants
- Admission offer letters

### Links to Documents
- Document upload and storage
- Certificate verification
- Digital document vault
- Document expiry tracking

---

## Technical Implementation

### Admission Block

Multi-step admission management system with application processing, merit calculation, seat allocation, and automated student record creation.

### Files and Responsibilities
- `content.tsx`: RSC for admission dashboard with statistics
- `campaigns/`: Admission campaign management
  - `list.tsx`: Campaign listing with filters
  - `form.tsx`: Campaign creation/edit form
  - `detail.tsx`: Campaign details and configuration
- `applications/`: Application processing
  - `table.tsx`: Application list with status filters
  - `review.tsx`: Application review interface
  - `verification.tsx`: Document verification checklist
- `merit/`: Merit list generation
  - `calculator.tsx`: Merit calculation configuration
  - `list.tsx`: Merit list display with ranks
  - `publish.tsx`: Merit list publication
- `allocation/`: Seat allocation
  - `matrix.tsx`: Seat availability matrix
  - `algorithm.ts`: Allocation logic
  - `letters.tsx`: Offer letter generation
- `validation.ts`: Zod schemas for all forms
- `actions.ts`: Server actions for admission operations
- `types.ts`: TypeScript types for admission entities

### Data Flow
1. Campaign creation → Application submission → Document verification
2. Merit calculation → Seat allocation → Admission confirmation
3. Fee payment → Student record creation → Enrollment complete

### Multi-Tenant Safety
- Every admission record includes `schoolId`
- Campaigns scoped to specific school
- Application numbers unique per tenant
- Merit lists isolated by school

---

## Database Schema

```prisma
model AdmissionCampaign {
  id                String   @id @default(cuid())
  schoolId          String
  name              String
  programId         String
  academicYearId    String
  startDate         DateTime
  endDate           DateTime
  maxApplications   Int
  status            CampaignStatus
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  school            School   @relation(fields: [schoolId], references: [id])
  applications      Application[]

  @@unique([name, schoolId])
  @@index([schoolId, status])
}

model Application {
  id                String   @id @default(cuid())
  schoolId          String
  campaignId        String
  applicationNumber String
  // Personal information
  givenName         String
  surname           String
  dateOfBirth       DateTime
  gender            Gender
  email             String
  phone             String
  // Academic information
  previousEducation Json
  // Status tracking
  status            ApplicationStatus
  meritScore        Float?
  meritRank         Int?
  seatAllocated     Boolean @default(false)
  admissionConfirmed Boolean @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  school            School   @relation(fields: [schoolId], references: [id])
  campaign          AdmissionCampaign @relation(fields: [campaignId], references: [id])
  documents         ApplicationDocument[]
  payments          AdmissionPayment[]

  @@unique([applicationNumber, schoolId])
  @@index([schoolId, campaignId, status])
}
```

---

## Technology Stack & Dependencies

This feature uses the platform's standard technology stack:

### Core Framework
- **Next.js 15.4+** - App Router with Server Components
- **React 19+** - Server Actions and new hooks
- **TypeScript** - Strict mode for type safety

### Forms & Validation
- **React Hook Form 7.61+** - Multi-step form management
- **Zod 4.0+** - Schema validation for applications

### UI Components
- **shadcn/ui** - Form components and data tables
- **TanStack Table 8.21+** - Application listing
- **Tailwind CSS 4** - Responsive styling

### File Upload
- **react-dropzone** - Document upload interface
- **Vercel Blob** or **AWS S3** - Document storage

### Payment Integration
- **Stripe** - Application fee collection
- **Payment gateway SDK** - Local payment methods

### Communication
- **Resend** - Email notifications
- **Twilio** (optional) - SMS alerts

### Server Actions Pattern
```typescript
"use server"
export async function submitApplication(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = applicationSchema.parse(input)

  // Generate unique application number
  const applicationNumber = generateApplicationNumber()

  const application = await db.application.create({
    data: {
      ...validated,
      schoolId,
      applicationNumber,
      status: 'SUBMITTED'
    }
  })

  // Send confirmation email
  await sendApplicationConfirmation(application)

  revalidatePath('/admission/applications')
  return { success: true, applicationNumber }
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
pnpm db:seed               # Seed test admission data

# Testing
pnpm test admission         # Run admission tests
pnpm test:e2e admission    # Run E2E admission tests
```