# Students — Production Readiness Tracker

Track production readiness and enhancements for the Students feature.

**Status:** ✅ Production-Ready MVP
**Last Updated:** 2025-10-10

---

## Current Status

**Production-Ready MVP Features ✅**
- [x] CRUD operations with Zod validation
- [x] CSV bulk import with error reporting
- [x] Class enrollment management (many-to-many via StudentClass)
- [x] Guardian relationships (StudentGuardian linking)
- [x] Search and filtering (name, status, class)
- [x] Export student data to CSV
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Server-side pagination and sorting
- [x] Modal-based create/edit forms
- [x] Row actions (View, Edit, Delete)
- [x] Breadcrumb with student name on detail page

---

## Admin Capabilities Checklist

### Core Features
- [x] Add students individually via form
- [x] Bulk import students via CSV
- [x] View complete student roster with pagination
- [x] Search by name (partial, case-insensitive)
- [x] Filter by status (active/inactive)
- [x] Filter by class assignment
- [x] Update student information
- [x] Link students to guardian accounts
- [x] Track enrollment status changes
- [x] Export student data to CSV
- [x] Delete student records with confirmation

### Role-Based Access
- [x] Admin can create/edit/delete students
- [x] Teacher can view students in their classes
- [x] Student can view their own profile
- [x] Parent can view their child's information
- [x] Staff can view student roster (read-only)

### Data Integrity
- [x] Multi-tenant scoping (schoolId)
- [x] Unique constraints prevent duplicates
- [x] Validation on all inputs (client + server)
- [x] Referential integrity (foreign keys)
- [x] Class enrollment many-to-many relationship
- [x] Guardian relationships properly linked

---

## Polish & Enhancement Items

### Critical Issues (Priority 1) 🔴

**Photo Upload**
- [ ] Add profile photo upload functionality
- [ ] Image storage (S3 or Vercel Blob)
- [ ] Avatar display in student list and detail page
- [ ] Image optimization and resizing
- [ ] Default avatar placeholder

**Document Attachments**
- [ ] Birth certificate upload
- [ ] Medical records attachment
- [ ] Previous school transcripts
- [ ] File management system
- [ ] Document viewer/download

### Status Tracking Enhancement
- [ ] Status change history log with timestamps
- [ ] Reason/notes field for status changes
- [ ] Automated status transitions (e.g., graduated after completing final year)
- [ ] Status change notifications to parents
- [ ] Audit trail for status modifications

### Bulk Operations
- [ ] Bulk class assignment (select multiple students)
- [ ] Bulk status update
- [ ] Bulk delete with confirmation
- [ ] Bulk export with custom column selection
- [ ] Progress indicators for bulk operations

### Class Enrollment Enhancement
- [ ] Visual class capacity indicators
- [ ] Waitlist functionality for full classes
- [ ] Enrollment history (track class changes over time)
- [ ] Multi-class enrollment (for electives)
- [ ] Automated class assignment based on grade level

### Guardian Management
- [ ] Multiple guardians per student
- [ ] Primary/secondary guardian designation
- [ ] Emergency contact prioritization
- [ ] Guardian communication preferences
- [ ] Guardian access permissions (what data they can see)

### Academic History
- [ ] Previous schools attended
- [ ] Transfer credits tracking
- [ ] Grade progression history
- [ ] Academic achievements log
- [ ] Disciplinary records (if applicable)

### Health Records
- [ ] Medical conditions tracking
- [ ] Allergies and dietary restrictions
- [ ] Vaccination records
- [ ] Emergency medical information
- [ ] School nurse access controls

### Performance Issues
- [ ] Add indexes for search fields (givenName, surname)
- [ ] Optimize class relationship queries (avoid N+1)
- [ ] Cache frequently accessed student data
- [ ] Virtual scrolling for large student lists
- [ ] Lazy loading for student detail tabs

### Accessibility Requirements
- [ ] Screen reader support for student list
- [ ] Keyboard navigation for forms
- [ ] ARIA labels for interactive elements
- [ ] Focus management in modals
- [ ] High contrast mode support

### UX Polish
- [ ] Loading skeletons for table
- [ ] Empty state with helpful guidance
- [ ] Error handling with user-friendly messages
- [ ] Success toasts for all mutations
- [ ] Inline validation feedback on forms
- [ ] Mobile-responsive table view

### Export/Import Enhancement
- [ ] Export template with example data
- [ ] Import validation preview before commit
- [ ] Detailed error reporting per row
- [ ] Partial import (skip errors, import valid rows)
- [ ] Export filters applied to download
- [ ] Custom column selection for export
- [ ] PDF export for reports

### Search & Filter Enhancement
- [ ] Advanced search (multiple fields simultaneously)
- [ ] Date range filter (enrollment date)
- [ ] Age range filter
- [ ] Grade level filter
- [ ] Gender filter
- [ ] Saved filter presets
- [ ] Recently searched queries

### Integration Enhancements
- [ ] Link to attendance summary per student
- [ ] Link to grades/results overview
- [ ] Link to timetable for student's class
- [ ] Link to assignments submitted by student
- [ ] Link to fee payment status (if implemented)
- [ ] Link to library checkout history (if implemented)

---

## Database & Schema

### Current Schema
```prisma
model Student {
  id               String            @id @default(cuid())
  schoolId         String
  givenName        String
  surname          String
  dateOfBirth      DateTime?
  gender           Gender?
  email            String?
  phone            String?
  enrollmentDate   DateTime          @default(now())
  status           StudentStatus     @default(ACTIVE)
  userId           String?           @unique
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  school           School            @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user             User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  classes          StudentClass[]
  guardians        StudentGuardian[]
  attendance       Attendance[]

  @@unique([email, schoolId])
  @@index([schoolId, createdAt])
  @@index([schoolId, status])
}
```

### Schema Enhancements Needed
- [ ] Add `profilePhotoUrl` field (String?)
- [ ] Add `address` field (String?)
- [ ] Add `emergencyContact` field (JSON?)
- [ ] Add `medicalInfo` field (JSON?)
- [ ] Add `previousSchool` field (String?)
- [ ] Add `transferCredits` field (JSON?)
- [ ] Add `statusChangeHistory` field (JSON[] or separate table)
- [ ] Add indexes for search performance
- [ ] Add `StudentDocument` model for attachments
- [ ] Add `StudentHealthRecord` model (optional)

---

## Server Actions

### Current Actions (Implemented ✅)
- [x] `createStudent(data: FormData)` - Create new student
- [x] `updateStudent(id: string, data: FormData)` - Update existing student
- [x] `deleteStudent(id: string)` - Delete student
- [x] `getStudent(id: string)` - Fetch single student
- [x] `getStudents(params)` - Fetch student list with filters/pagination

### Actions to Implement
- [ ] `bulkAssignClass(studentIds: string[], classId: string)` - Bulk class assignment
- [ ] `bulkUpdateStatus(studentIds: string[], status: StudentStatus)` - Bulk status update
- [ ] `uploadStudentPhoto(studentId: string, file: File)` - Photo upload
- [ ] `uploadStudentDocument(studentId: string, file: File, type: string)` - Document upload
- [ ] `getStudentHistory(studentId: string)` - Fetch academic history
- [ ] `transferStudent(studentId: string, newSchoolId: string)` - Inter-school transfer
- [ ] `promoteStudents(classId: string, targetYearLevel: string)` - Bulk grade promotion

### Action Enhancements
- [ ] Add typed return values for all actions
- [ ] Add request ID logging for traceability
- [ ] Add proper error handling with user-friendly messages
- [ ] Add rate limiting for bulk operations
- [ ] Add transaction support for multi-step operations

---

## UI Components

### Current Components (Implemented ✅)
- [x] `content.tsx` - Server component with data fetching
- [x] `table.tsx` - Client data table with useDataTable
- [x] `columns.tsx` - Column definitions with filters
- [x] `form.tsx` - Create/edit form with validation
- [x] `list-params.ts` - URL state management
- [x] `validation.ts` - Zod schemas
- [x] `actions.ts` - Server actions

### Components to Create
- [ ] `student-photo-upload.tsx` - Photo upload component
- [ ] `student-documents.tsx` - Document management component
- [ ] `student-history.tsx` - Academic history timeline
- [ ] `student-guardians.tsx` - Guardian management component
- [ ] `student-classes.tsx` - Class enrollment management
- [ ] `bulk-actions-dialog.tsx` - Bulk operations UI
- [ ] `import-preview.tsx` - CSV import preview table
- [ ] `export-dialog.tsx` - Export configuration dialog

### Component Enhancements
- [ ] Add loading states to table
- [ ] Add empty state component
- [ ] Add error boundary for graceful failures
- [ ] Add skeleton loaders
- [ ] Add mobile-responsive table variant
- [ ] Add print-friendly student profile view

---

## Testing

### Unit Tests
- [ ] Test Zod validation schemas
- [ ] Test server actions (create, update, delete)
- [ ] Test multi-tenant scoping in queries
- [ ] Test filter logic in content.tsx
- [ ] Test CSV parsing and validation

### Integration Tests
- [ ] Test student creation flow end-to-end
- [ ] Test bulk import with errors
- [ ] Test class enrollment linking
- [ ] Test guardian relationship creation
- [ ] Test status change tracking
- [ ] Test export with filters applied

### E2E Tests (Playwright)
- [ ] Test student list rendering
- [ ] Test search and filters
- [ ] Test create student modal flow
- [ ] Test edit student flow
- [ ] Test delete with confirmation
- [ ] Test CSV import workflow

---

## Documentation

- [x] README.md updated with admin workflows
- [x] ISSUE.md created with production checklist
- [ ] Add API documentation for server actions
- [ ] Add component usage examples
- [ ] Add CSV import template documentation
- [ ] Add troubleshooting guide

---

## Performance Optimization

- [ ] Add database indexes for search fields
- [ ] Optimize class relationship queries
- [ ] Add caching for frequently accessed data
- [ ] Implement virtual scrolling for large lists
- [ ] Add pagination limit caps
- [ ] Profile and optimize slow queries
- [ ] Add loading indicators for slow operations

---

## Accessibility

- [ ] Audit screen reader compatibility
- [ ] Test keyboard navigation
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure form field labels are properly associated
- [ ] Test with high contrast mode
- [ ] Add skip navigation links
- [ ] Ensure focus management in modals

---

## Mobile Responsiveness

- [ ] Test table on mobile devices
- [ ] Create mobile-optimized student list view
- [ ] Ensure forms work on small screens
- [ ] Test bulk operations on mobile
- [ ] Add touch-friendly interactions
- [ ] Test import/export on mobile

---

## Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production

# Database
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations
pnpm db:seed                # Seed test data

# Testing
pnpm test                   # Run unit tests
pnpm test:e2e               # Run E2E tests
```

---

## Technology Stack & Version Requirements

This feature uses the platform's standard technology stack (see [Platform ISSUE.md](../ISSUE.md#technology-stack--version-requirements) for complete details):

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

For detailed version requirements and architecture patterns, see [Platform Technology Stack](../ISSUE.md#technology-stack--version-requirements).

---

**Status Legend:**
- ✅ Complete and production-ready
- 🚧 In progress or needs polish
- ⏸️ Planned but not started
- ❌ Blocked or has critical issues

**Last Review:** 2025-10-10
**Next Review:** After completing photo upload and document attachments
