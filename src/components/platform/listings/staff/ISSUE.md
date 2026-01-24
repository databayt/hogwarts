# Staff — Production Readiness Tracker

Track production readiness and enhancements for the Staff feature.

**Status:** ✅ Production-Ready MVP
**Last Updated:** 2025-01-25

---

## Current Status

**Production-Ready MVP Features ✅**

- [x] CRUD operations with Zod validation
- [x] Staff information form
- [x] Employment status tracking (Active, On Leave, Terminated, Retired)
- [x] Employment type tracking (Full Time, Part Time, Contract, Temporary)
- [x] Department assignment
- [x] User account linking
- [x] Search and filtering
- [x] Multi-tenant isolation (schoolId scoping)

---

## Admin Capabilities Checklist

### Core Features

- [x] Create staff records
- [x] Edit staff records
- [x] Delete staff records
- [x] View staff list
- [x] Search by name, position
- [x] Filter by status, type
- [ ] Export staff list to CSV
- [ ] Import staff from CSV
- [ ] Bulk operations

### Data Integrity

- [x] Multi-tenant scoping (schoolId)
- [x] Validation on all inputs
- [x] Email format validation
- [x] Required field enforcement
- [ ] Duplicate email detection

---

## Polish & Enhancement Items

### Priority 1 - High Value 🔴

**Leave Management**

- [ ] Leave request workflow
- [ ] Leave balance tracking
- [ ] Leave calendar view
- [ ] Manager approvals
- [ ] Leave history

**Attendance Tracking**

- [ ] Check-in/check-out
- [ ] Attendance reports
- [ ] Late arrival tracking
- [ ] Overtime calculation

### Priority 2 - Medium Value

**Document Management**

- [ ] Upload employee documents
- [ ] Contract storage
- [ ] ID/certification copies
- [ ] Document expiry alerts

**Department Integration**

- [ ] Department hierarchy
- [ ] Reporting structure
- [ ] Organization chart view

### Priority 3 - Nice to Have

**Performance Reviews**

- [ ] Review cycle management
- [ ] Performance goals
- [ ] 360 feedback
- [ ] Performance history

**Payroll Integration**

- [ ] Salary information
- [ ] Payslip generation
- [ ] Tax calculations
- [ ] Bank details

---

## Database & Schema

### Current Schema

```prisma
model StaffMember {
  id               String   @id @default(cuid())
  schoolId         String
  employeeId       String?
  givenName        String
  surname          String
  gender           String?
  emailAddress     String
  position         String?
  departmentId     String?
  employmentStatus String   @default("ACTIVE")
  employmentType   String   @default("FULL_TIME")
  joiningDate      DateTime?
  userId           String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  school     School     @relation(fields: [schoolId], references: [id])
  department Department? @relation(fields: [departmentId], references: [id])
  user       User?      @relation(fields: [userId], references: [id])

  @@unique([emailAddress, schoolId])
  @@index([schoolId])
}
```

---

## Server Actions

### Current Actions (Implemented ✅)

- [x] `createStaff(input)` - Create staff record
- [x] `updateStaff(input)` - Update staff
- [x] `deleteStaff(input)` - Delete staff
- [x] `getStaff(input)` - Fetch single staff
- [x] `getStaffList(input)` - Fetch staff list with filters

### Actions to Implement

- [ ] `exportStaffCSV(filters)` - Export to CSV
- [ ] `importStaffCSV(file)` - Import from CSV
- [ ] `bulkUpdateStatus(ids, status)` - Bulk status update
- [ ] `linkUserAccount(staffId, userId)` - Link user account

---

## UI Components

### Current Components (Implemented ✅)

- [x] `content.tsx` - Server component with staff list
- [x] `table.tsx` - Client data table
- [x] `columns.tsx` - Column definitions
- [x] `form.tsx` - Staff form
- [x] `actions.ts` - Server actions
- [x] `validation.ts` - Zod schemas
- [x] `queries.ts` - Query builders
- [x] `authorization.ts` - RBAC checks

### Components to Create

- [ ] `staff-card.tsx` - Grid view card
- [ ] `leave-management.tsx` - Leave tracking UI
- [ ] `attendance-tracker.tsx` - Attendance UI
- [ ] `document-manager.tsx` - Document upload

---

## Testing

### Unit Tests

- [ ] Test validation schemas
- [ ] Test authorization rules
- [ ] Test query builders

### Integration Tests

- [ ] Test CRUD operations
- [ ] Test search and filtering
- [ ] Test user linking

### E2E Tests

- [ ] Test staff creation workflow
- [ ] Test staff editing
- [ ] Test list filtering

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

**Last Review:** 2025-01-25
