# Attendance — Production Readiness Tracker

Track production readiness and enhancements for the Attendance feature.

**Status:** ✅ Production-Ready MVP
**Completion:** 90%
**Last Updated:** 2025-12-14

---

## Current Status

**Production-Ready MVP Features ✅**
- [x] Daily attendance marking (present/absent/late)
- [x] Class roster view with attendance status
- [x] Bulk marking for entire class
- [x] Upsert logic (update existing records)
- [x] Attendance history with date filtering
- [x] CSV export with date range filters
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Class selection dropdown
- [x] Server actions with validation

---

## Admin Capabilities Checklist

### Core Features
- [x] Mark daily attendance for classes
- [x] View class roster for attendance marking
- [x] Update attendance status (upsert)
- [x] View attendance history by class
- [x] View attendance history by student
- [x] Export attendance data to CSV
- [x] Filter by date range
- [x] Filter by class
- [x] Filter by student
- [x] Filter by status (present/absent/late)

### Role-Based Access
- [x] Admin can mark and view all attendance
- [x] Teacher can mark attendance for their classes
- [x] Teacher can view attendance for their classes
- [x] Student can view their own attendance
- [x] Parent can view their child's attendance
- [ ] Staff can view attendance reports (read-only)

### Data Integrity
- [x] Multi-tenant scoping (schoolId)
- [x] Unique constraint prevents duplicate records per day
- [x] Validation on all inputs (client + server)
- [x] Referential integrity (foreign keys to Student, Class)
- [x] Date normalization to prevent timezone issues
- [x] Status enum enforcement (PRESENT/ABSENT/LATE)

---

## Polish & Enhancement Items

### Critical Issues (Priority 1) 🔴

**Absence Reason Codes**
- [ ] Add `reason` field to Attendance model (enum or text)
- [ ] Reason options: Medical, Family Emergency, School Activity, Religious, Unexcused
- [ ] Differentiate excused vs. unexcused absences
- [ ] Parent portal: submit excuse notes digitally
- [ ] Admin approval workflow for excuses
- [ ] Compliance reporting with absence types

**Attendance Percentage Calculation**
- [ ] Calculate attendance % per student (present days / total school days)
- [ ] Calculate attendance % per class (average of all students)
- [ ] Display on student profile
- [ ] Display on class detail page
- [ ] Configurable calculation (include/exclude late as present)
- [ ] Year-to-date vs. term-based calculations

**Period-by-Period Tracking**
- [ ] Add `periodId` field to Attendance model
- [ ] Integrate with Timetable to auto-select current period
- [ ] Mark attendance per subject/period (secondary school use case)
- [ ] Handle partial day attendance (present morning, absent afternoon)
- [ ] More granular tracking for compliance

**Parent Notifications**
- [ ] Automated absence notifications via email
- [ ] SMS alerts for unexcused absences
- [ ] Daily attendance summary to parents
- [ ] Configurable notification preferences
- [ ] Notification history tracking

**Monthly Reports**
- [ ] Generate monthly attendance summary
- [ ] School-wide statistics
- [ ] Class-level statistics
- [ ] Individual student reports
- [ ] PDF export for official reporting
- [ ] Perfect attendance awards list

**Tardy Tracking Enhancement**
- [ ] Add `arrivedAt` timestamp for late students
- [ ] Track how late (minutes)
- [ ] Tardy threshold configuration (e.g., < 15 min = late, > 15 min = absent)
- [ ] Consecutive tardy alerts
- [ ] Tardy patterns analysis

### Low Attendance Alerts
- [ ] Configurable threshold (e.g., < 80% attendance)
- [ ] Automated alerts to counselors/admin
- [ ] Dashboard widget showing at-risk students
- [ ] Intervention tracking (parent contacted, meeting scheduled)
- [ ] Historical attendance trends
- [ ] Predictive alerts (student trending toward low attendance)

### Bulk Operations Enhancement
- [ ] "Mark All Present" button
- [ ] "Mark All Absent" button
- [ ] Import attendance from CSV (bulk historical data)
- [ ] Copy attendance from previous day (rare absences)
- [ ] Undo last attendance marking

### Attendance Analytics Dashboard
- [ ] School-wide attendance rate (today, this week, this month)
- [ ] Attendance trends over time (line chart)
- [ ] Absence patterns (day of week analysis)
- [ ] Class comparison (which classes have lowest attendance)
- [ ] Student ranking (perfect attendance vs. chronic absenteeism)
- [ ] Heatmap visualization (calendar view)

### Mobile-Friendly Attendance Marking
- [ ] Touch-optimized attendance interface
- [ ] Swipe gestures to mark status
- [ ] Quick toggle buttons (tap to cycle present/absent/late)
- [ ] Offline support with sync when online
- [ ] Mobile app integration

### Performance Issues
- [ ] Add indexes for date-based queries
- [ ] Optimize class roster loading (avoid N+1)
- [ ] Cache frequently accessed attendance data
- [ ] Pagination for large attendance history
- [ ] Lazy loading for date range queries
- [ ] Background job for monthly report generation

### Accessibility Requirements
- [ ] Screen reader support for attendance marking interface
- [ ] Keyboard shortcuts (P for present, A for absent, L for late)
- [ ] ARIA labels for status radio buttons
- [ ] Focus management in attendance form
- [ ] High contrast mode for status indicators

### UX Polish
- [ ] Loading skeleton for class roster
- [ ] Empty state when no students in class
- [ ] Error handling with user-friendly messages
- [ ] Success toast after saving attendance
- [ ] Visual indicators (icons for present/absent/late)
- [ ] Color coding (green/red/yellow)
- [ ] Inline validation feedback
- [ ] Auto-save draft attendance marks

### Export/Import Enhancement
- [ ] Export template with example data
- [ ] Import historical attendance from CSV
- [ ] Export with student names (not just IDs)
- [ ] Export with class names (not just IDs)
- [ ] PDF attendance sheets for printing
- [ ] Custom column selection for CSV export
- [ ] Scheduled exports (daily email to admin)

### Search & Filter Enhancement
- [ ] Date picker with calendar UI
- [ ] Quick date filters (today, yesterday, last 7 days, last 30 days)
- [ ] Multi-class selection
- [ ] Multi-student selection
- [ ] Saved filter presets
- [ ] Recent searches
- [ ] Advanced query builder

### Integration Enhancements
- [ ] Link to student profile from attendance list
- [ ] Link to class detail from attendance report
- [ ] Auto-populate today's date and current class (from timetable)
- [ ] Attendance summary on student dashboard
- [ ] Attendance widget on teacher dashboard
- [ ] Integration with parent portal (absence excuse submission)

---

## Database & Schema

### Current Schema
```prisma
model Attendance {
  id        String           @id @default(cuid())
  schoolId  String
  studentId String
  classId   String
  date      DateTime
  status    AttendanceStatus @default(PRESENT)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([schoolId, studentId, classId, date])
  @@index([schoolId, classId, date])
  @@index([schoolId, studentId, date])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
}
```

### Schema Enhancements Needed
- [ ] Add `periodId` field (String? with relation to Period)
- [ ] Add `reason` field (String? or enum: MEDICAL, FAMILY, SCHOOL_ACTIVITY, RELIGIOUS, UNEXCUSED, OTHER)
- [ ] Add `excuseNote` field (String? for parent-submitted excuse)
- [ ] Add `excuseApprovedBy` field (String? userId of admin who approved)
- [ ] Add `excuseApprovedAt` field (DateTime?)
- [ ] Add `arrivedAt` field (DateTime? for tardy timestamp)
- [ ] Add `minutesLate` field (Int? calculated field)
- [ ] Add `isExcused` field (Boolean @default(false))
- [ ] Expand AttendanceStatus enum (add EXCUSED_ABSENT, UNEXCUSED_ABSENT, HALF_DAY, etc.)
- [ ] Add `AttendanceNote` model for admin notes on attendance issues

---

## Server Actions

### Current Actions (Implemented ✅)
- [x] `markAttendance(input)` - Mark attendance for students
- [x] `getAttendanceList(input)` - Fetch class roster with attendance
- [x] `getClassesForSelection()` - Fetch classes for dropdown
- [x] `getAttendanceReportCsv(input)` - Export attendance to CSV

### Actions to Implement
- [ ] `getAttendancePercentage(studentId, dateRange?)` - Calculate % for student
- [ ] `getClassAttendanceStats(classId, dateRange?)` - Class statistics
- [ ] `getLowAttendanceStudents(threshold, dateRange?)` - Identify at-risk students
- [ ] `submitAbsenceExcuse(attendanceId, reason, note)` - Parent submits excuse
- [ ] `approveAbsenceExcuse(attendanceId, approverId)` - Admin approves excuse
- [ ] `generateMonthlyReport(month, year, scope)` - Monthly summary
- [ ] `getAttendanceTrends(dateRange, groupBy)` - Analytics data
- [ ] `markBulkPresent(classId, date)` - Mark all present at once
- [ ] `markBulkAbsent(classId, date, reason?)` - Mark all absent
- [ ] `undoAttendanceMarking(classId, date)` - Undo last save
- [ ] `importAttendanceFromCsv(file)` - Bulk historical import
- [ ] `getAttendanceAlerts()` - Fetch students with low attendance

### Action Enhancements
- [ ] Add typed return values for all actions
- [ ] Add request ID logging for audit trail
- [ ] Add proper error handling with user-friendly messages
- [ ] Add rate limiting for bulk operations
- [ ] Add validation for date ranges (prevent future dates)
- [ ] Add permission checks (teacher can only mark for their classes)

---

## UI Components

### Current Components (Implemented ✅)
- [x] `content.tsx` - Server component with attendance interface
- [x] `table.tsx` - Client table for attendance history
- [x] `columns.tsx` - Column definitions for history table
- [x] `actions.ts` - Server actions
- [x] `validation.ts` - Zod schemas

### Components to Create
- [ ] `attendance-marking-form.tsx` - Dedicated form for marking
- [ ] `class-roster-view.tsx` - Student list with status toggles
- [ ] `attendance-calendar.tsx` - Calendar view with color-coded days
- [ ] `attendance-stats-widget.tsx` - Statistics summary card
- [ ] `low-attendance-alert.tsx` - At-risk students list
- [ ] `absence-excuse-form.tsx` - Parent excuse submission
- [ ] `monthly-report-generator.tsx` - Report configuration UI
- [ ] `attendance-analytics-dashboard.tsx` - Charts and trends
- [ ] `bulk-actions-toolbar.tsx` - Quick action buttons

### Component Enhancements
- [ ] Add loading states to attendance form
- [ ] Add empty state when no students in class
- [ ] Add error boundary for graceful failures
- [ ] Add skeleton loaders for roster
- [ ] Add mobile-responsive attendance marking
- [ ] Add visual status indicators (icons, colors)
- [ ] Add keyboard shortcuts for quick marking

---

## Testing

### Unit Tests
- [ ] Test Zod validation schemas
- [ ] Test server actions (markAttendance, getAttendanceList)
- [ ] Test multi-tenant scoping
- [ ] Test upsert logic (create vs. update)
- [ ] Test status mapping (lowercase to uppercase)
- [ ] Test CSV generation
- [ ] Test date normalization

### Integration Tests
- [ ] Test attendance marking workflow end-to-end
- [ ] Test updating existing attendance
- [ ] Test CSV export with filters
- [ ] Test class roster loading with enrollments
- [ ] Test attendance percentage calculations
- [ ] Test low attendance identification

### E2E Tests (Playwright)
- [ ] Test attendance marking for a class
- [ ] Test bulk "mark all present"
- [ ] Test updating attendance status
- [ ] Test exporting attendance to CSV
- [ ] Test viewing attendance history
- [ ] Test filtering by date range

---

## Documentation

- [x] README.md created with admin workflows
- [x] ISSUE.md created with production checklist
- [ ] Add API documentation for server actions
- [ ] Add component usage examples
- [ ] Add CSV import/export format documentation
- [ ] Add compliance reporting guide
- [ ] Add troubleshooting guide

---

## Performance Optimization

- [ ] Add database indexes for date-based queries
- [ ] Optimize class roster queries (include student data)
- [ ] Add caching for attendance statistics
- [ ] Implement pagination for large history
- [ ] Add lazy loading for date range queries
- [ ] Profile and optimize CSV generation
- [ ] Background jobs for analytics calculations

---

## Accessibility

- [ ] Audit screen reader compatibility
- [ ] Implement keyboard shortcuts (P/A/L)
- [ ] Add ARIA labels to status controls
- [ ] Ensure form field labels are properly associated
- [ ] Test with high contrast mode
- [ ] Add focus indicators for radio buttons
- [ ] Ensure skip navigation works

---

## Mobile Responsiveness

- [ ] Test attendance marking on mobile
- [ ] Create touch-optimized status toggles
- [ ] Ensure date picker works on mobile
- [ ] Test CSV export download on mobile
- [ ] Add swipe gestures for quick marking
- [ ] Optimize table view for small screens

---

## Compliance & Reporting

- [ ] Ensure attendance records meet local regulations
- [ ] Support government-mandated reporting formats
- [ ] Track required attendance percentage (e.g., 90%)
- [ ] Generate official attendance certificates
- [ ] Maintain historical records per retention policy
- [ ] Audit trail for all attendance modifications

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
**Next Review:** After completing QR code UI and analytics dashboard
