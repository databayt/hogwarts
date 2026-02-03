# Classes — Production Readiness Tracker

Track production readiness and enhancements for the Classes feature.

**Status:** 🔴 BLOCKED - Subject Teacher Assignment Incomplete
**Completion:** 85%
**Last Updated:** 2025-12-14

---

## Critical Blocker

### Teacher-Class Assignment (INCOMPLETE)

| Property          | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **URL**           | `/[lang]/s/[subdomain]/(platform)/classes/[id]/teachers`              |
| **Current State** | Homeroom teacher works, subject teachers missing                      |
| **Impact**        | Cannot assign specific teachers to teach specific subjects in a class |

**What Works:**

- Homeroom teacher assignment via `teacherId` field on Class model
- Basic teacher selection in class creation form

**Missing Implementation:**

- `assignSubjectTeacher(classId, subjectId, teacherId)` server action
- `removeSubjectTeacher(classId, subjectId)` server action
- `getClassSubjectTeachers(classId)` query
- Subject teacher assignment UI component
- Teacher availability validation (prevent double-booking)
- `ClassSubjectTeacher` junction model (or equivalent)

**Files to Create/Modify:**

- `src/components/platform/classes/subject-teachers.tsx` - Assignment UI
- `src/components/platform/classes/actions.ts` - Add subject teacher actions
- `prisma/models/class.prisma` - Consider adding `ClassSubjectTeacher` model

---

## Current Status

**MVP Features Status**

- [x] CRUD operations with Zod validation
- [x] Homeroom teacher assignment
- [ ] **Subject teacher assignment** ← BLOCKED
- [x] Student enrollment (many-to-many via StudentClass)
- [x] Subject linking per class
- [x] Capacity limits configuration
- [x] Search and filtering (name, subject, teacher, term)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Multi-step form (information → schedule & location)
- [x] Timetable integration
- [x] Classroom assignment
- [x] Term-based class organization

---

## Admin Capabilities Checklist

### Core Features

- [x] Create classes with multi-step form
- [x] Assign homeroom teacher to class
- [ ] **Assign subject teachers to class** ← BLOCKED (actions missing)
- [x] Enroll students in classes (many-to-many)
- [x] Set class capacity limits
- [x] Assign physical classroom
- [x] Link class to subject
- [x] Link class to academic term
- [x] Set class schedule (start/end periods)
- [x] View class roster
- [x] Search and filter classes
- [x] Delete classes with cascade handling

### Role-Based Access

- [x] Admin can create/edit/delete classes
- [x] Teacher can view assigned classes
- [x] Teacher can access student roster
- [x] Student can view their class
- [x] Parent can view child's class
- [x] Staff can view class list (read-only)

### Data Integrity

- [x] Multi-tenant scoping (schoolId)
- [x] Unique constraints prevent duplicates
- [x] Validation on all inputs (client + server)
- [x] Referential integrity (foreign keys)
- [x] StudentClass many-to-many relationship
- [x] Capacity enforcement during enrollment

---

## Polish & Enhancement Items

### Critical Issues (Priority 1) 🔴

**Class Performance Analytics**

- [ ] Calculate class average across all subjects
- [ ] Display grade distribution (A/B/C/D/F counts)
- [ ] Track class performance trends over time
- [ ] Compare class performance to grade level average
- [ ] Identify struggling students in class
- [ ] Performance reports per subject per class

**Attendance Summary**

- [ ] Calculate class attendance percentage
- [ ] Display daily attendance trends
- [ ] Identify students with low attendance
- [ ] Attendance heatmap per class
- [ ] Period-by-period attendance summary
- [ ] Export attendance reports for class

**Enrollment Management Enhancement**

- [ ] Visual enrollment capacity indicators (progress bars)
- [ ] Waitlist functionality for full classes
- [ ] Bulk enrollment from student list
- [ ] Bulk un-enrollment
- [ ] Transfer wizard (move students between classes)
- [ ] Enrollment history tracking per student

### Seating Arrangement

- [ ] Visual seating chart designer
- [ ] Drag-and-drop student placement
- [ ] Save multiple seating arrangements
- [ ] Export seating chart for printing
- [ ] Behavior-based seating suggestions
- [ ] Vision/hearing accommodation support

### Class Resources

- [ ] Resource library per class (textbooks, materials)
- [ ] Equipment assignment (projectors, laptops)
- [ ] Resource request workflow
- [ ] Resource availability tracking
- [ ] Shared resources across classes

### Subject Teacher Assignment Enhancement

- [ ] Multiple subject teachers per class (co-teaching)
- [ ] Subject teacher assignment with effective dates
- [ ] Subject teacher rotation (different teachers per term)
- [ ] Teaching period allocation per subject
- [ ] Subject teacher substitution workflow
- [ ] Subject-specific permissions (grading, assignments)

### Bulk Operations

- [ ] Bulk student enrollment (select multiple students, enroll in class)
- [ ] Bulk class creation (create multiple sections of same grade)
- [ ] Bulk teacher assignment across classes
- [ ] Bulk class deletion/archival
- [ ] Progress indicators for bulk operations

### Class Schedule Enhancement

- [ ] Visual weekly schedule view per class
- [ ] Period-by-period timetable display
- [ ] Free periods highlighted
- [ ] Schedule conflicts detection
- [ ] Schedule export to PDF
- [ ] iCal export for class schedules

### Class Communication

- [ ] Class-specific announcement board
- [ ] Message all class parents at once
- [ ] Emergency alerts for class
- [ ] Parent-teacher communication thread per class
- [ ] Class newsletter functionality

### Performance Issues

- [ ] Add indexes for search fields (name, subjectId, teacherId)
- [ ] Optimize student roster queries (avoid N+1)
- [ ] Cache class roster data
- [ ] Virtual scrolling for large class lists
- [ ] Lazy loading for class detail tabs
- [ ] Optimize enrollment count calculations

### Accessibility Requirements

- [ ] Screen reader support for class list and roster
- [ ] Keyboard navigation for multi-step form
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
- [ ] Visual capacity indicators (progress bars)
- [ ] Class cards view (alternative to table)

### Export/Import Enhancement

- [ ] Export class roster to CSV
- [ ] Export with student contact information
- [ ] Export class timetable to PDF
- [ ] Import bulk enrollment from CSV
- [ ] Export class performance reports
- [ ] Custom column selection for exports

### Search & Filter Enhancement

- [ ] Advanced search (multiple fields)
- [ ] Grade level filter
- [ ] Capacity filter (full, nearly full, available)
- [ ] Year level filter
- [ ] Classroom filter
- [ ] Saved filter presets

### Integration Enhancements

- [ ] Link to class performance dashboard
- [ ] Link to class attendance summary
- [ ] Link to class grade distribution
- [ ] Link to class assignments and exams
- [ ] Link to class announcements
- [ ] Unified class dashboard

---

## Database & Schema

### Current Schema

```prisma
model Class {
  id              String         @id @default(cuid())
  schoolId        String
  name            String
  subjectId       String
  teacherId       String?
  termId          String?
  startPeriodId   String?
  endPeriodId     String?
  classroomId     String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  school          School         @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  subject         Subject        @relation(fields: [subjectId], references: [id])
  teacher         Teacher?       @relation(fields: [teacherId], references: [id])
  term            Term?          @relation(fields: [termId], references: [id])
  startPeriod     Period?        @relation("ClassStartPeriod", fields: [startPeriodId], references: [id])
  endPeriod       Period?        @relation("ClassEndPeriod", fields: [endPeriodId], references: [id])
  classroom       Classroom?     @relation(fields: [classroomId], references: [id])
  students        StudentClass[]

  @@unique([name, schoolId, termId])
  @@index([schoolId, termId])
  @@index([schoolId, teacherId])
}

model StudentClass {
  id         String   @id @default(cuid())
  schoolId   String
  studentId  String
  classId    String
  createdAt  DateTime @default(now())

  school     School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  class      Class    @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([studentId, classId])
  @@index([schoolId, studentId])
  @@index([schoolId, classId])
}
```

### Schema Enhancements Needed

- [ ] Add `capacity` field (Int? - max students)
- [ ] Add `enrollmentCount` calculated field or query
- [ ] Add `status` field (ACTIVE, INACTIVE, ARCHIVED)
- [ ] Add `yearLevelId` field (link to grade level)
- [ ] Add `code` field (unique class code like "1A-MATH-2024")
- [ ] Add `ClassSubjectTeacher` model for multiple subject teachers
- [ ] Add `ClassResource` model for materials and equipment
- [ ] Add `SeatingArrangement` model
- [ ] Add `enrolledAt` timestamp to StudentClass
- [ ] Add `unenrolledAt` timestamp to StudentClass (soft delete)

---

## Server Actions

### Current Actions (Implemented ✅)

- [x] `createClass(data: FormData)` - Create new class
- [x] `updateClass(id: string, data: FormData)` - Update existing class
- [x] `deleteClass(id: string)` - Delete class
- [x] `getClass(id: string)` - Fetch single class
- [x] `getClasses(params)` - Fetch class list with filters/pagination

### Actions to Implement

- [ ] `enrollStudent(classId: string, studentId: string)` - Enroll single student
- [ ] `bulkEnrollStudents(classId: string, studentIds: string[])` - Bulk enrollment
- [ ] `unenrollStudent(classId: string, studentId: string)` - Remove student
- [ ] `transferStudent(studentId: string, fromClassId: string, toClassId: string)` - Transfer
- [ ] `getClassRoster(classId: string)` - Fetch enrolled students
- [ ] `getClassSchedule(classId: string)` - Fetch weekly timetable
- [ ] `getClassAttendanceSummary(classId: string, dateRange?)` - Attendance stats
- [ ] `getClassPerformance(classId: string, termId?)` - Performance analytics
- [ ] `assignSubjectTeacher(classId: string, subjectId: string, teacherId: string)` - Subject teacher
- [ ] `removeSubjectTeacher(classId: string, subjectId: string)` - Remove subject teacher
- [ ] `archiveClass(classId: string)` - Soft delete class
- [ ] `duplicateClass(classId: string, newTermId: string)` - Copy class to new term

### Action Enhancements

- [ ] Add typed return values for all actions
- [ ] Add request ID logging
- [ ] Add proper error handling with user messages
- [ ] Add capacity validation during enrollment
- [ ] Add transaction support for bulk operations

---

## UI Components

### Current Components (Implemented ✅)

- [x] `content.tsx` - Server component with data fetching
- [x] `table.tsx` - Client data table
- [x] `columns.tsx` - Column definitions
- [x] `form.tsx` - Multi-step create/edit form
- [x] `information.tsx` - Step 1: Basic information
- [x] `schedule.tsx` - Step 2: Schedule & location
- [x] `footer.tsx` - Form navigation
- [x] `list-params.ts` - URL state management
- [x] `validation.ts` - Zod schemas
- [x] `actions.ts` - Server actions

### Components to Create

- [ ] `class-roster.tsx` - Student enrollment management
- [ ] `class-schedule.tsx` - Weekly timetable view
- [ ] `class-performance.tsx` - Analytics dashboard
- [ ] `class-attendance.tsx` - Attendance summary
- [ ] `seating-chart.tsx` - Visual seating arrangement
- [ ] `subject-teachers.tsx` - Subject teacher assignment UI
- [ ] `bulk-enrollment-dialog.tsx` - Bulk enrollment UI
- [ ] `transfer-wizard.tsx` - Student transfer workflow
- [ ] `class-resources.tsx` - Resource management

### Component Enhancements

- [ ] Add capacity progress bars to class cards
- [ ] Add enrollment count badges
- [ ] Add visual status indicators
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error boundaries
- [ ] Add mobile-responsive views

---

## Testing

### Unit Tests

- [ ] Test Zod validation schemas
- [ ] Test server actions (create, update, delete, enroll)
- [ ] Test multi-tenant scoping
- [ ] Test capacity validation logic
- [ ] Test enrollment/unenrollment logic

### Integration Tests

- [ ] Test class creation with teacher assignment
- [ ] Test student enrollment workflow
- [ ] Test capacity limits enforcement
- [ ] Test bulk enrollment
- [ ] Test class deletion with cascade

### E2E Tests (Playwright)

- [ ] Test class list rendering
- [ ] Test create class multi-step form
- [ ] Test student enrollment
- [ ] Test class roster view
- [ ] Test class deletion

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
- 🔴 BLOCKED - Critical blocker preventing MVP completion

**Last Review:** 2025-12-14
**Current Blocker:** Subject Teacher Assignment (homeroom works, subject teachers missing)
**Next Review:** After resolving subject teacher assignment blocker
