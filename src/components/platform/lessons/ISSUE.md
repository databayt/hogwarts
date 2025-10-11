# Lessons — Production Readiness Tracker

**Status:** ✅ Production-Ready MVP
**Last Updated:** 2025-10-10

---

## Current Status

**Production-Ready MVP Features ✅**
- [x] CRUD operations
- [x] Class and subject linking
- [x] Lesson content management
- [x] Multi-tenant isolation

---

## Enhancement Items

### Critical Issues (Priority 1) 🔴
- [ ] Resource attachments (file upload)
- [ ] Link to timetable slots
- [ ] Learning objectives framework
- [ ] Lesson templates library
- [ ] Curriculum mapping
- [ ] Progress tracking

### Additional Features
- [ ] Collaborative lesson planning
- [ ] Lesson sharing between teachers
- [ ] Standards alignment
- [ ] Assessment integration
- [ ] Student progress notes

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

**Last Review:** 2025-10-10
