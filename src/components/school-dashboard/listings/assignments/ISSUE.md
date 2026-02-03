# Assignments — Production Readiness Tracker

Track production readiness and enhancements for the Assignments feature.

**Status:** ✅ Production-Ready MVP
**Last Updated:** 2025-10-10

---

## Current Status

**Production-Ready MVP Features ✅**

- [x] CRUD operations with Zod validation
- [x] Multi-step form (information → details & settings)
- [x] Assignment types (HOMEWORK, QUIZ, TEST, MIDTERM, FINAL, PROJECT, LAB_REPORT, ESSAY, PRESENTATION)
- [x] Due date management with date picker
- [x] Points and weight configuration
- [x] Class targeting
- [x] Instructions field (rich text)
- [x] Status management (DRAFT, PUBLISHED)
- [x] Search and filtering
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Server-side pagination and sorting

---

## Admin Capabilities Checklist

### Core Features

- [x] Create assignments with multi-step form
- [x] Set assignment type
- [x] Assign to class
- [x] Set due date
- [x] Configure points and weight
- [x] Add instructions
- [x] Publish/unpublish workflow
- [x] Update assignment details
- [x] Delete assignments
- [x] View assignment list with filters
- [x] Search by title
- [ ] Grade student submissions
- [ ] Track submission status
- [ ] View assignment analytics

### Role-Based Access

- [x] Admin can create/edit/delete all assignments
- [ ] Teacher can create assignments for their classes only
- [ ] Teacher can grade submissions for their assignments
- [ ] Student can view their assignments
- [ ] Student can submit work
- [ ] Parent can view child's assignments
- [ ] Parent can view child's grades

### Data Integrity

- [x] Multi-tenant scoping (schoolId)
- [x] Validation on all inputs (client + server)
- [x] Referential integrity (foreign keys to Class)
- [x] Due date validation (not in past)
- [x] Points validation (positive integer)
- [x] Weight validation (0-100%)
- [ ] Submission validation

---

## Polish & Enhancement Items

### Critical Issues (Priority 1) 🔴

**Submission Tracking System**

- [ ] Create AssignmentSubmission model
- [ ] Student submission portal (file upload)
- [ ] Track submission date/time
- [ ] Late submission detection (after due date)
- [ ] Missing submission identification
- [ ] Resubmission workflow
- [ ] Submission history per student

**AssignmentSubmission Model:**

```prisma
model AssignmentSubmission {
  id                String   @id @default(cuid())
  schoolId          String
  assignmentId      String
  studentId         String
  submittedAt       DateTime @default(now())
  fileUrl           String?
  content           String?  // Text submission
  status            SubmissionStatus @default(SUBMITTED)
  isLate            Boolean  @default(false)
  pointsEarned      Int?
  feedback          String?
  gradedAt          DateTime?
  gradedBy          String?  // teacherId
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  school     School     @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student    Student    @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, studentId])
  @@index([schoolId, assignmentId])
  @@index([schoolId, studentId])
}

enum SubmissionStatus {
  SUBMITTED
  LATE
  GRADED
  RETURNED
  RESUBMITTED
}
```

**Grading Interface**

- [ ] Grading UI with student roster
- [ ] Points input field per student
- [ ] Feedback textarea per student
- [ ] Bulk grading (same grade for multiple students)
- [ ] Import grades from CSV
- [ ] Export grades to CSV
- [ ] Grade distribution visualization
- [ ] Auto-calculate percentage

**File Attachments**

- [ ] File upload for assignment instructions (PDF, DOCX)
- [ ] File upload for student submissions
- [ ] Cloud storage integration (S3 or Vercel Blob)
- [ ] File preview (PDFs, images)
- [ ] Multiple file attachments per assignment
- [ ] File size limits and validation
- [ ] Allowed file types configuration

**Late Submission Policies**

- [ ] Configure late penalty (e.g., -10% per day)
- [ ] Set late submission cutoff date
- [ ] Automatic penalty calculation
- [ ] Grace period configuration
- [ ] Override penalties (excused late)
- [ ] Late submission reports

**Rubrics and Marking Guides**

- [ ] Create rubric model (criteria + points)
- [ ] Attach rubric to assignment
- [ ] Rubric-based grading interface
- [ ] Criterion-level feedback
- [ ] Rubric templates library
- [ ] Rubric sharing across teachers

### Assignment Analytics Dashboard

- [ ] Calculate class average
- [ ] Track submission rate (% submitted)
- [ ] Identify missing assignments
- [ ] Grade distribution chart
- [ ] Submission timeline chart
- [ ] Performance comparison across classes
- [ ] Student completion rate per assignment type

### Bulk Operations

- [ ] Bulk assignment creation (same assignment for multiple classes)
- [ ] Clone assignment to another class
- [ ] Recurring assignments (weekly homework)
- [ ] Assignment templates
- [ ] Bulk delete
- [ ] Bulk publish/unpublish

### Student Submission Portal

- [ ] Student dashboard showing upcoming assignments
- [ ] Assignment detail view for students
- [ ] File upload interface
- [ ] Text submission editor
- [ ] Submission confirmation
- [ ] Edit/resubmit before deadline
- [ ] View submission status
- [ ] View grade and feedback

### Parent Portal Integration

- [ ] View child's assignments
- [ ] View upcoming due dates
- [ ] View submission status
- [ ] View grades and feedback
- [ ] Email notifications for new assignments
- [ ] Email notifications for grades

### Peer Review Functionality

- [ ] Enable peer review flag per assignment
- [ ] Assign students to review peers' work
- [ ] Anonymous peer review option
- [ ] Peer review rubric
- [ ] Teacher moderation of peer feedback
- [ ] Peer review grade contribution

### Plagiarism Detection (Advanced)

- [ ] Integration with plagiarism detection API (Turnitin, Copyscape)
- [ ] Similarity score per submission
- [ ] Highlight matching content
- [ ] Originality report
- [ ] Manual review workflow
- [ ] Academic integrity tracking

### Performance Issues

- [ ] Add indexes for due date queries
- [ ] Optimize assignment list with class joins
- [ ] Cache submission statistics
- [ ] Pagination for large submission lists
- [ ] Lazy loading for assignment details

### Accessibility Requirements

- [ ] Screen reader support for assignment list
- [ ] Keyboard navigation for multi-step form
- [ ] ARIA labels for date picker
- [ ] Focus management in modals
- [ ] High contrast mode

### UX Polish

- [ ] Loading skeletons for table
- [ ] Empty state with helpful guidance
- [ ] Error handling with user-friendly messages
- [ ] Success toasts for all mutations
- [ ] Inline validation feedback
- [ ] Mobile-responsive table view
- [ ] Visual status indicators (draft/published)
- [ ] Due date countdown badges

### Export/Import Enhancement

- [ ] Export assignment list to CSV
- [ ] Export grades to CSV
- [ ] Import grades from CSV (bulk grading)
- [ ] Export analytics reports to PDF
- [ ] Custom column selection
- [ ] Scheduled exports (end of term)

### Search & Filter Enhancement

- [ ] Advanced search (multiple fields)
- [ ] Due date range filter
- [ ] Subject filter (if assignments linked to subjects)
- [ ] Teacher filter (creator)
- [ ] Grade level filter
- [ ] Saved filter presets

### Integration Enhancements

- [ ] Link to gradebook (Results feature)
- [ ] Link to student performance dashboard
- [ ] Link to calendar (due dates as events)
- [ ] Link to announcements (new assignment alerts)
- [ ] Integration with Google Classroom (import/export)
- [ ] Integration with LMS platforms

---

## Database & Schema

### Current Schema

```prisma
model Assignment {
  id           String         @id @default(cuid())
  schoolId     String
  title        String
  description  String?
  classId      String
  type         AssignmentType
  totalPoints  Int
  weight       Float          // % of final grade
  dueDate      DateTime
  instructions String?
  status       AssignmentStatus @default(DRAFT)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  school    School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  class     Class   @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@index([schoolId, dueDate])
  @@index([schoolId, classId])
}

enum AssignmentType {
  HOMEWORK
  QUIZ
  TEST
  MIDTERM
  FINAL
  PROJECT
  LAB_REPORT
  ESSAY
  PRESENTATION
}

enum AssignmentStatus {
  DRAFT
  PUBLISHED
}
```

### Schema Enhancements Needed

- [ ] Add `subjectId` field (String? with relation to Subject)
- [ ] Add `createdBy` field (String? userId of teacher)
- [ ] Add `attachmentUrl` field (String? for instruction files)
- [ ] Add `lateSubmissionCutoff` field (DateTime?)
- [ ] Add `latePenaltyPerDay` field (Float? percentage)
- [ ] Add `allowLateSubmission` field (Boolean @default(true))
- [ ] Add `allowResubmission` field (Boolean @default(false))
- [ ] Add `maxSubmissions` field (Int? default 1)
- [ ] Add `rubricId` field (String? with relation to Rubric)
- [ ] Add `enablePeerReview` field (Boolean @default(false))
- [ ] Add `submissions` relation (AssignmentSubmission[])
- [ ] Add AssignmentSubmission model (see above)
- [ ] Add Rubric model
- [ ] Add RubricCriterion model

---

## Server Actions

### Current Actions (Implemented ✅)

- [x] `createAssignment(input)` - Create new assignment
- [x] `updateAssignment(input)` - Update existing assignment
- [x] `deleteAssignment(input)` - Delete assignment
- [x] `getAssignment(input)` - Fetch single assignment
- [x] `getAssignments(input)` - Fetch assignment list with filters/pagination

### Actions to Implement

- [ ] `submitAssignment(assignmentId, studentId, fileUrl?, content?)` - Student submits
- [ ] `gradeSubmission(submissionId, pointsEarned, feedback)` - Teacher grades
- [ ] `getSubmissions(assignmentId)` - Fetch all submissions for assignment
- [ ] `getStudentSubmission(assignmentId, studentId)` - Fetch single submission
- [ ] `getSubmissionStats(assignmentId)` - Calculate statistics
- [ ] `publishAssignment(assignmentId)` - Change status to PUBLISHED
- [ ] `unpublishAssignment(assignmentId)` - Revert to DRAFT
- [ ] `cloneAssignment(assignmentId, newClassId)` - Duplicate assignment
- [ ] `bulkGrade(assignmentId, grades: [{ studentId, points, feedback }])` - Bulk grading
- [ ] `importGrades(assignmentId, csvFile)` - Import grades from CSV
- [ ] `exportGrades(assignmentId)` - Export grades to CSV
- [ ] `getStudentAssignments(studentId, status?)` - Student's assignment list
- [ ] `getUpcomingAssignments(classId, limit?)` - Next assignments for class
- [ ] `getMissingAssignments(classId)` - Students with missing work

### Action Enhancements

- [ ] Add typed return values
- [ ] Add request ID logging
- [ ] Add proper error handling
- [ ] Add permission checks (teacher can only grade their assignments)
- [ ] Add file upload handling
- [ ] Add late submission detection

---

## UI Components

### Current Components (Implemented ✅)

- [x] `content.tsx` - Server component with assignment list
- [x] `table.tsx` - Client data table
- [x] `columns.tsx` - Column definitions
- [x] `form.tsx` - Multi-step create/edit form
- [x] `information.tsx` - Step 1: Basic information
- [x] `details.tsx` - Step 2: Details & settings
- [x] `footer.tsx` - Form navigation
- [x] `actions.ts` - Server actions
- [x] `validation.ts` - Zod schemas

### Components to Create

- [ ] `submission-portal.tsx` - Student submission interface
- [ ] `grading-interface.tsx` - Teacher grading UI
- [ ] `submission-list.tsx` - List of all submissions for assignment
- [ ] `assignment-analytics.tsx` - Statistics dashboard
- [ ] `rubric-builder.tsx` - Rubric creation UI
- [ ] `rubric-grading.tsx` - Grade using rubric
- [ ] `file-upload.tsx` - File attachment component
- [ ] `bulk-grade-dialog.tsx` - Bulk grading UI
- [ ] `clone-assignment-dialog.tsx` - Clone to another class

### Component Enhancements

- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error boundaries
- [ ] Add skeleton loaders
- [ ] Add mobile-responsive views
- [ ] Add visual due date indicators

---

## Testing

### Unit Tests

- [ ] Test Zod validation schemas
- [ ] Test server actions
- [ ] Test multi-tenant scoping
- [ ] Test late submission detection
- [ ] Test grade calculation
- [ ] Test weight percentage validation

### Integration Tests

- [ ] Test assignment creation workflow
- [ ] Test submission workflow
- [ ] Test grading workflow
- [ ] Test publish/unpublish status changes
- [ ] Test late submission penalties

### E2E Tests (Playwright)

- [ ] Test assignment creation multi-step form
- [ ] Test student submission
- [ ] Test teacher grading
- [ ] Test analytics dashboard
- [ ] Test export functionality

---

## Commands

```bash
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations
pnpm db:seed                # Seed test data
pnpm test                   # Run unit tests
pnpm test:e2e               # Run E2E tests
```

---

## Technology Stack & Version Requirements

This feature uses the platform's standard technology stack (see [Platform ISSUE.md](../../ISSUE.md#technology-stack--version-requirements) for complete details):

### Core Stack

- **Next.js 15.4+** with App Router and Server Components
- **React 19+** with Server Actions and new hooks
- **TypeScript 5.x** in strict mode
- **Neon PostgreSQL** with autoscaling and branching
- **Prisma ORM 6.14+** for type-safe database access

### UI & Forms

- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS 4** with OKLCH colors
- **React Hook Form 7.61+** for form state management
- **Zod 4.0+** for schema validation
- **TanStack Table 8.21+** for data tables

### Authentication & Security

- **NextAuth.js v5** with JWT sessions
- Multi-tenant isolation via `schoolId` scoping
- CSRF protection and secure cookie handling
- Type-safe environment variables

### Development & Testing

- **Vitest 2.0+** for unit testing
- **Playwright 1.55+** for E2E testing
- **ESLint + Prettier** for code quality
- **pnpm 9.x** as package manager

### Key Patterns

- **Server Actions**: All mutations use "use server" directive
- **Multi-Tenant**: Every query scoped by `schoolId` from session
- **Type Safety**: End-to-end TypeScript with Prisma + Zod
- **Validation**: Double validation (client UX + server security)

For detailed version requirements and architecture patterns, see [Platform Technology Stack](../../ISSUE.md#technology-stack--version-requirements).

---

**Status Legend:**

- ✅ Complete and production-ready
- 🚧 In progress or needs polish
- ⏸️ Planned but not started
- ❌ Blocked or has critical issues

**Last Review:** 2025-10-10
**Next Review:** After completing submission tracking and grading interface
