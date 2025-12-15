# Settings — Production Readiness Tracker

**Status:** 🔴 BLOCKED - Academic Year Setup Incomplete
**Completion:** 60%
**Last Updated:** 2025-12-14

---

## Critical Blocker

### Academic Year Setup (15% COMPLETE)

| Property          | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| **URL**           | `/[lang]/s/[subdomain]/(platform)/school/academic`           |
| **Current State** | Models exist, CRUD UI/actions incomplete                     |
| **Impact**        | Cannot set active academic year for timetable, exams, grades |

**Missing Implementation:**

- `createAcademicYear(data)` server action - partial
- `updateAcademicYear(id, data)` server action - missing
- `deleteAcademicYear(id)` server action - missing
- `setActiveYear(yearId)` server action - missing
- `createTerm(yearId, data)` server action - missing
- `updateTerm(id, data)` server action - missing
- `deleteTerm(id)` server action - missing
- Term management UI - missing
- Period definitions CRUD - missing

**Prisma Models (Exist ✅):**

```prisma
model SchoolYear {
  id        String   @id @default(cuid())
  schoolId  String
  name      String
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(false)
  terms     Term[]
}

model Term {
  id          String     @id @default(cuid())
  schoolYearId String
  name        String
  startDate   DateTime
  endDate     DateTime
}
```

**Files to Create/Modify:**

- `src/components/platform/settings/academic-year/actions.ts` - Complete CRUD
- `src/components/platform/settings/academic-year/form.tsx` - Year form
- `src/components/platform/settings/academic-year/term-form.tsx` - Term form
- `src/components/platform/settings/academic-year/content.tsx` - Main UI

---

## Current Status

**Completed Features ✅**

- [x] School profile
- [x] Locale selection
- [x] Timezone configuration
- [x] Subdomain management
- [x] Branding/logo configuration

**Blocked 🔴**

- [ ] **Academic year configuration** ← MVP BLOCKER
- [ ] Term management within years
- [ ] Period definitions

**Planned ⏸️**

- [ ] Grading scale configuration
- [ ] Email templates
- [ ] Notification preferences
- [ ] Backup and restore
- [ ] API access management

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
- 🔴 BLOCKED - Critical blocker preventing MVP completion

**Last Review:** 2025-12-14
**Current Blocker:** Academic Year Setup (models exist, actions incomplete)
**Next Review:** After resolving academic year CRUD actions
