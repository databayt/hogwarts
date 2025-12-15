# Teachers — Production Readiness Tracker

Track production readiness and enhancements for the Teachers feature.

**Status:** ✅ Production-Ready MVP
**Completion:** 85%
**Last Updated:** 2025-12-14

---

## Current Status

**Production-Ready MVP Features ✅**

- [x] CRUD operations with Zod validation
- [x] CSV bulk import with error reporting
- [x] Department assignments (TeacherDepartment many-to-many)
- [x] Class and subject assignments
- [x] Contact information management
- [x] Search and filtering (name, email, status)
- [x] Export to CSV
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Multi-step form (information → contact)
- [x] Server-side pagination and sorting
- [x] Row actions (View, Edit, Delete)

---

## Admin Capabilities Checklist

### Core Features

- [x] Add teachers individually via multi-step form
- [x] Bulk import teachers via CSV
- [x] View complete faculty roster with pagination
- [x] Search by name and email (partial, case-insensitive)
- [x] Filter by status (active/on leave/terminated)
- [x] Update teacher information
- [x] Assign teachers to departments
- [x] Assign teachers to classes and subjects
- [x] Track employment status changes
- [x] Export teacher data to CSV
- [x] Delete teacher records with confirmation

### Role-Based Access

- [x] Admin can create/edit/delete teachers
- [x] Teacher can view their own profile and update contact info
- [x] Teacher can view assigned classes and subjects
- [x] Student can view their teachers' names and subjects
- [x] Parent can view their child's teachers
- [x] Department heads can view department roster

### Data Integrity

- [x] Multi-tenant scoping (schoolId)
- [x] Unique email per school constraint
- [x] Validation on all inputs (client + server)
- [x] Referential integrity (foreign keys)
- [x] Department assignments many-to-many relationship
- [x] Class assignments properly linked

---

## Polish & Enhancement Items

### Critical Issues (Priority 1) 🔴

**Qualification Tracking**

- [ ] Add education field (degree, major, institution, graduation year)
- [ ] Add certifications field (certification name, issuing body, date, expiry)
- [ ] Add teaching license tracking (license number, state, expiry)
- [ ] Document upload for diplomas and certificates
- [ ] Qualification verification workflow
- [ ] Automatic expiry alerts for licenses

**Teaching Load Analytics**

- [ ] Calculate total teaching periods per week from timetable
- [ ] Display number of unique classes and subjects
- [ ] Show contact hours vs. non-contact hours
- [ ] Identify overloaded teachers (threshold-based)
- [ ] Balance workload distribution tools
- [ ] Teaching load reports per term

**Department Management**

- [ ] Department head designation
- [ ] Department roster view
- [ ] Department-based filtering and reports
- [ ] Department meetings scheduling
- [ ] Department resource allocation
- [ ] Department performance analytics

### Status & Employment Tracking

- [ ] Employment status history log with timestamps
- [ ] Reason/notes field for status changes
- [ ] Contract start and end dates
- [ ] Employment type (full-time, part-time, contract, substitute)
- [ ] Automated contract expiry notifications
- [ ] Audit trail for status modifications

### Subject Specialization

- [ ] Primary subject field (main expertise)
- [ ] Secondary subjects (can teach)
- [ ] Subject certification tracking
- [ ] Subject-based teacher search
- [ ] Subject coverage analytics (which subjects have qualified teachers)
- [ ] Subject assignment suggestions based on qualifications

### Document Management

- [ ] Resume/CV upload
- [ ] Certificate uploads (degree, teaching license)
- [ ] Background check documents
- [ ] Contract documents
- [ ] File management system with versioning
- [ ] Document viewer/download
- [ ] Document expiry tracking

### Performance & Professional Development

- [ ] Performance review tracking (dates, ratings, notes)
- [ ] Goal setting and progress monitoring
- [ ] Professional development courses attended
- [ ] Training certifications
- [ ] Observation notes from admin
- [ ] Self-evaluation forms

### Attendance & Leave Management

- [ ] Teacher attendance tracking
- [ ] Leave request system (sick, personal, professional)
- [ ] Leave balance tracking (days used vs. remaining)
- [ ] Substitute teacher assignment workflow
- [ ] Absence impact on timetable (auto-notify affected classes)
- [ ] Leave approval workflow

### Class Assignment Enhancement

- [ ] Homeroom teacher designation per class
- [ ] Subject teacher assignment with effective date ranges
- [ ] Co-teaching support (multiple teachers per subject)
- [ ] Assignment history (track past assignments)
- [ ] Automated assignment suggestions based on qualifications
- [ ] Conflict detection (timetable clashes)

### Bulk Operations

- [ ] Bulk department assignment (select multiple teachers)
- [ ] Bulk status update
- [ ] Bulk subject assignment
- [ ] Bulk delete with confirmation
- [ ] Bulk export with custom column selection
- [ ] Progress indicators for bulk operations

### Performance Issues

- [ ] Add indexes for search fields (givenName, surname, emailAddress)
- [ ] Optimize department and class relationship queries (avoid N+1)
- [ ] Cache frequently accessed teacher data
- [ ] Virtual scrolling for large teacher lists
- [ ] Lazy loading for teacher detail tabs
- [ ] Optimize teaching load calculations

### Accessibility Requirements

- [ ] Screen reader support for teacher list
- [ ] Keyboard navigation for multi-step forms
- [ ] ARIA labels for interactive elements
- [ ] Focus management in modals
- [ ] High contrast mode support
- [ ] Skip navigation links

### UX Polish

- [ ] Loading skeletons for table
- [ ] Empty state with helpful guidance
- [ ] Error handling with user-friendly messages
- [ ] Success toasts for all mutations
- [ ] Inline validation feedback on forms
- [ ] Mobile-responsive table view
- [ ] Multi-step form progress indicator enhancements
- [ ] Form autosave for long forms

### Export/Import Enhancement

- [ ] Export template with example data
- [ ] Import validation preview before commit
- [ ] Detailed error reporting per row
- [ ] Partial import (skip errors, import valid rows)
- [ ] Export filters applied to download
- [ ] Custom column selection for export
- [ ] PDF export for faculty directory
- [ ] Include department and subject assignments in export

### Search & Filter Enhancement

- [ ] Advanced search (multiple fields simultaneously)
- [ ] Department filter dropdown
- [ ] Subject specialization filter
- [ ] Employment type filter
- [ ] Contract status filter (active, expiring soon, expired)
- [ ] Saved filter presets
- [ ] Recently searched queries

### Integration Enhancements

- [ ] Link to teaching schedule (timetable view)
- [ ] Link to classes taught (student roster)
- [ ] Link to exam scores entered
- [ ] Link to assignments created
- [ ] Link to attendance records
- [ ] Link to lesson plans authored
- [ ] Unified teacher dashboard with all related data

---

## Database & Schema

### Current Schema

```prisma
model Teacher {
  id               String               @id @default(cuid())
  schoolId         String
  givenName        String
  surname          String
  gender           Gender?
  emailAddress     String
  userId           String?              @unique
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  school           School               @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user             User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  departments      TeacherDepartment[]
  classes          Class[]

  @@unique([emailAddress, schoolId])
  @@index([schoolId, createdAt])
}

model TeacherDepartment {
  id           String     @id @default(cuid())
  schoolId     String
  teacherId    String
  departmentId String
  createdAt    DateTime   @default(now())

  school       School     @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  teacher      Teacher    @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([teacherId, departmentId])
  @@index([schoolId, teacherId])
  @@index([schoolId, departmentId])
}
```

### Schema Enhancements Needed

- [ ] Add `phone` field (String?)
- [ ] Add `profilePhotoUrl` field (String?)
- [ ] Add `employmentStatus` field (enum: ACTIVE, ON_LEAVE, TERMINATED, RETIRED)
- [ ] Add `employmentType` field (enum: FULL_TIME, PART_TIME, CONTRACT, SUBSTITUTE)
- [ ] Add `contractStartDate` field (DateTime?)
- [ ] Add `contractEndDate` field (DateTime?)
- [ ] Add `primarySubjectId` field (String? with relation to Subject)
- [ ] Add `qualifications` field (JSON? for degrees, certifications)
- [ ] Add `statusChangeHistory` field (JSON[] or separate table)
- [ ] Add `TeacherDocument` model for file attachments
- [ ] Add `TeacherLeave` model for leave management
- [ ] Add `TeacherPerformanceReview` model
- [ ] Add `isDepartmentHead` field to TeacherDepartment model

---

## Server Actions

### Current Actions (Implemented ✅)

- [x] `createTeacher(data: FormData)` - Create new teacher
- [x] `updateTeacher(id: string, data: FormData)` - Update existing teacher
- [x] `deleteTeacher(id: string)` - Delete teacher
- [x] `getTeacher(id: string)` - Fetch single teacher
- [x] `getTeachers(params)` - Fetch teacher list with filters/pagination

### Actions to Implement

- [ ] `bulkAssignDepartment(teacherIds: string[], departmentId: string)` - Bulk department assignment
- [ ] `bulkUpdateStatus(teacherIds: string[], status: EmploymentStatus)` - Bulk status update
- [ ] `assignToClass(teacherId: string, classId: string, subjectId: string)` - Class assignment
- [ ] `removeFromClass(teacherId: string, classId: string)` - Remove class assignment
- [ ] `uploadTeacherDocument(teacherId: string, file: File, type: string)` - Document upload
- [ ] `getTeachingLoad(teacherId: string, termId?: string)` - Calculate teaching load
- [ ] `getTeacherSchedule(teacherId: string, weekOffset?: number)` - Get weekly schedule
- [ ] `requestLeave(teacherId: string, startDate: Date, endDate: Date, reason: string)` - Leave request
- [ ] `approveLeave(leaveId: string)` - Approve leave request
- [ ] `assignSubstitute(teacherId: string, substituteId: string, dates: Date[])` - Assign substitute

### Action Enhancements

- [ ] Add typed return values for all actions
- [ ] Add request ID logging for traceability
- [ ] Add proper error handling with user-friendly messages
- [ ] Add rate limiting for bulk operations
- [ ] Add transaction support for multi-step operations
- [ ] Add validation for department/class assignment conflicts

---

## UI Components

### Current Components (Implemented ✅)

- [x] `content.tsx` - Server component with data fetching
- [x] `table.tsx` - Client data table with useDataTable
- [x] `columns.tsx` - Column definitions with filters
- [x] `form.tsx` - Multi-step create/edit form
- [x] `information.tsx` - Step 1: Basic information
- [x] `contact.tsx` - Step 2: Contact details
- [x] `footer.tsx` - Form navigation and progress
- [x] `list-params.ts` - URL state management
- [x] `validation.ts` - Zod schemas
- [x] `actions.ts` - Server actions

### Components to Create

- [ ] `teacher-qualifications.tsx` - Qualifications management
- [ ] `teacher-documents.tsx` - Document management
- [ ] `teacher-schedule.tsx` - Teaching schedule view
- [ ] `teacher-load.tsx` - Teaching load analytics
- [ ] `teacher-classes.tsx` - Class assignment management
- [ ] `teacher-departments.tsx` - Department management
- [ ] `teacher-leave.tsx` - Leave request form
- [ ] `bulk-actions-dialog.tsx` - Bulk operations UI
- [ ] `import-preview.tsx` - CSV import preview
- [ ] `export-dialog.tsx` - Export configuration

### Component Enhancements

- [ ] Add loading states to table
- [ ] Add empty state component
- [ ] Add error boundary for graceful failures
- [ ] Add skeleton loaders
- [ ] Add mobile-responsive table variant
- [ ] Add print-friendly teacher profile view
- [ ] Enhance multi-step form with autosave
- [ ] Add form field help text and tooltips

---

## Testing

### Unit Tests

- [ ] Test Zod validation schemas
- [ ] Test server actions (create, update, delete)
- [ ] Test multi-tenant scoping in queries
- [ ] Test filter logic in content.tsx
- [ ] Test CSV parsing and validation
- [ ] Test teaching load calculations
- [ ] Test department assignment logic

### Integration Tests

- [ ] Test teacher creation flow end-to-end
- [ ] Test bulk import with errors
- [ ] Test department assignment linking
- [ ] Test class assignment workflow
- [ ] Test status change tracking
- [ ] Test export with filters applied
- [ ] Test teaching load with timetable data

### E2E Tests (Playwright)

- [ ] Test teacher list rendering
- [ ] Test search and filters
- [ ] Test create teacher multi-step form flow
- [ ] Test edit teacher flow
- [ ] Test delete with confirmation
- [ ] Test CSV import workflow
- [ ] Test department and class assignments

---

## Documentation

- [x] README.md updated with admin workflows
- [x] ISSUE.md created with production checklist
- [ ] Add API documentation for server actions
- [ ] Add component usage examples
- [ ] Add CSV import template documentation
- [ ] Add multi-step form pattern documentation
- [ ] Add teaching load calculation documentation
- [ ] Add troubleshooting guide

---

## Performance Optimization

- [ ] Add database indexes for search fields
- [ ] Optimize department and class relationship queries
- [ ] Add caching for frequently accessed data
- [ ] Implement virtual scrolling for large lists
- [ ] Add pagination limit caps
- [ ] Profile and optimize slow queries
- [ ] Add loading indicators for slow operations
- [ ] Optimize teaching load calculations

---

## Accessibility

- [ ] Audit screen reader compatibility
- [ ] Test keyboard navigation (especially multi-step form)
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure form field labels are properly associated
- [ ] Test with high contrast mode
- [ ] Add skip navigation links
- [ ] Ensure focus management in modals and multi-step forms

---

## Mobile Responsiveness

- [ ] Test table on mobile devices
- [ ] Create mobile-optimized teacher list view
- [ ] Ensure multi-step forms work on small screens
- [ ] Test bulk operations on mobile
- [ ] Add touch-friendly interactions
- [ ] Test import/export on mobile
- [ ] Optimize teaching schedule view for mobile

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

**Last Review:** 2025-12-14
**Next Review:** After completing qualification tracking and teaching load analytics
