# Parent Portal — Production Readiness Tracker

**Status:** ✅ Production-Ready Core Features
**Last Updated:** 2025-10-11

---

## Current Status

**Completed Features ✅**

- [x] Authentication
- [x] View announcements
- [x] View attendance
- [x] View grades (exam results + class scores)
- [x] View assignments (with submission status)
- [x] View timetable (weekly schedule)

**Planned ⏸️**

- [ ] Download report cards
- [ ] Receive notifications
- [ ] Message teachers
- [ ] View fee status
- [ ] Update profile

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

## Implementation Details

### Server Actions (actions.ts)

- **getMyChildren()** - Fetch guardian's children with authorization
- **getChildGrades(studentId)** - View exam results and class scores
- **getChildAssignments(studentId)** - View assignments with submission status
- **getChildTimetable(studentId)** - View weekly class schedule
- **getChildOverview(studentId)** - Dashboard summary with grades and attendance

All actions include:

- Guardian authorization using NextAuth session
- Student-guardian relationship verification
- Multi-tenant isolation with schoolId scoping
- Comprehensive error handling
- Type-safe with Zod validation

### UI Components

- **child-grades-view.tsx** - Tabbed view for exam results and class scores
- **child-assignments-view.tsx** - Assignments table with submission status and grades
- **child-timetable-view.tsx** - Weekly timetable grouped by day

All components:

- Server components using async/await
- Type-safe props interfaces
- shadcn/ui components for consistent styling
- Responsive tables with proper empty states
- Badge indicators for status visualization

---

**Last Review:** 2025-10-11
**Next Review:** After implementing report cards download feature
