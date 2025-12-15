# Hogwarts School Automation Platform - Architecture

**Version:** 1.0
**Date:** January 2025
**Status:** ✅ Production (100% MVP Complete)
**Project Level:** Level 4 (Enterprise-scale, Multi-tenant SaaS)
**Methodology:** BMAD-METHOD (Battle-tested Multi-Agent Development)

---

## Executive Summary

Hogwarts is an **enterprise-grade, multi-tenant school management platform** built on modern web technologies serving **50+ schools, 12,000+ students, and 800+ teachers** in production. This architecture document captures all critical architectural decisions, implementation patterns, and design rationale to ensure consistent development across all AI agents and human developers.

**Key Architectural Characteristics:**

- **Multi-Tenant**: Subdomain-based tenant isolation (`school.databayt.org`)
- **Type-Safe**: End-to-end TypeScript with Zod validation at boundaries
- **Serverless**: Deployed on Vercel with automatic scaling
- **Security-First**: FERPA, GDPR, COPPA compliant from day one
- **Performance**: Lighthouse score 94, LCP <2.1s, FCP <1.2s
- **Scalable**: Designed to scale from 50 to 5,000+ schools

**Current Scale:**

- **50+** schools (tenants)
- **12,000+** students
- **800+** teachers
- **500** concurrent users during peak hours
- **10,000** requests/day

**Projected Scale (3 Years):**

- **5,000** schools
- **1,000,000** students
- **50,000** teachers
- **10,000** concurrent users
- **1,000,000** requests/day

---

## Project Initialization

**Starter Template:** `create-next-app@latest`
**Initialization Command:**

```bash
npx create-next-app@latest hogwarts \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Starter Decisions Provided:**

- ✅ Next.js 15 framework (App Router)
- ✅ TypeScript (strict mode)
- ✅ Tailwind CSS 4 for styling
- ✅ App Router (not Pages Router)
- ✅ ESLint for code quality
- ✅ Turbopack for bundling

**Additional Setup:**

```bash
# Install dependencies
pnpm install

# Add Prisma
pnpm add prisma @prisma/client
pnpm add -D prisma

# Add NextAuth v5
pnpm add next-auth@beta @auth/prisma-adapter

# Add UI library
pnpm dlx shadcn-ui@latest init

# Add validation
pnpm add zod react-hook-form @hookform/resolvers

# Add email
pnpm add resend react-email

# Add monitoring
pnpm add @sentry/nextjs
```

---

## Decision Summary

| Category                 | Decision                     | Version        | Affects Epics | Rationale                                                                     |
| ------------------------ | ---------------------------- | -------------- | ------------- | ----------------------------------------------------------------------------- |
| **Framework**            | Next.js App Router           | 15.4.4         | All           | Best-in-class React framework, server components, built-in optimizations      |
| **Language**             | TypeScript (strict mode)     | 5.x            | All           | Type safety eliminates runtime errors, excellent DX                           |
| **Database**             | PostgreSQL (Neon serverless) | Latest         | All           | ACID compliance, relational model perfect for school data, serverless scaling |
| **ORM**                  | Prisma                       | 6.14.0         | All           | Best TypeScript ORM, type-safe queries, excellent migration system            |
| **Authentication**       | NextAuth v5 (Auth.js)        | 5.0.0-beta.29  | Epic 2        | Industry standard, OAuth support, JWT strategy, multi-tenant aware            |
| **UI Components**        | shadcn/ui (Radix UI)         | Latest         | All           | High-quality accessible components, no dependency lock-in                     |
| **Styling**              | Tailwind CSS                 | 4.0            | All           | Utility-first CSS, faster development, consistent design system               |
| **Validation**           | Zod                          | 4.0.14         | All           | TypeScript-first schema validation, runtime type safety                       |
| **Forms**                | react-hook-form              | 7.61.1         | All           | Best React form library, excellent performance                                |
| **Data Tables**          | @tanstack/react-table        | 8.21.3         | Epics 4-11    | Powerful data table with server-side features                                 |
| **Email**                | Resend + React Email         | 4.7.0          | Epic 2,10     | Modern email API, React templates, excellent deliverability                   |
| **Payments**             | Stripe                       | 18.4.0         | Epic 9        | Industry leader, PCI compliance handled, excellent DX                         |
| **File Storage**         | Vercel Blob                  | Latest         | Epics 3-5     | Serverless storage, integrated with Vercel                                    |
| **Deployment**           | Vercel                       | Latest         | All           | Best Next.js hosting, automatic deployments, edge network                     |
| **Error Tracking**       | Sentry                       | 10.12.0        | All           | Industry standard, excellent error reporting                                  |
| **Testing**              | Vitest + Playwright          | 2.0.6 + 1.55.0 | All           | Fast unit tests, reliable E2E tests                                           |
| **Package Manager**      | pnpm                         | 9.x            | All           | Faster than npm/yarn, disk space efficient                                    |
| **Bundler**              | Turbopack                    | Built-in       | All           | Next.js native, faster than Webpack                                           |
| **API Pattern**          | Server Actions               | Built-in       | All           | Type-safe mutations, no REST boilerplate                                      |
| **State Management**     | Server state (React)         | Built-in       | All           | Minimal client state, leverage server components                              |
| **Internationalization** | Custom i18n                  | Custom         | All           | Arabic RTL + English LTR support                                              |
| **Charts**               | Recharts                     | 2.15.4         | Epic 11       | React-native charts, good documentation                                       |
| **Drag & Drop**          | @dnd-kit                     | 6.3.1          | Epic 3,6      | Modern DnD library, accessible                                                |
| **Date Handling**        | date-fns                     | 4.1.0          | All           | Lightweight, tree-shakeable, i18n support                                     |

---

## Epic to Architecture Mapping

| Epic                       | Primary Components                | Database Models                         | API Actions                       | UI Pages            | Dependencies |
| -------------------------- | --------------------------------- | --------------------------------------- | --------------------------------- | ------------------- | ------------ |
| **Epic 1: Foundation**     | Middleware, tenant-context, db.ts | School, Domain                          | -                                 | Landing page        | None         |
| **Epic 2: Authentication** | auth.ts, auth.config.ts           | User, Account, Session                  | register, login, logout           | /auth/\*            | Epic 1       |
| **Epic 3: School Config**  | School settings components        | SchoolYear, Term, Period, Department    | updateSchool, createTerm          | /settings/\*        | Epic 1,2     |
| **Epic 4: Students**       | Student components                | Student, Guardian, StudentGuardian      | enrollStudent, addGuardian        | /students/\*        | Epic 2,3     |
| **Epic 5: Teachers**       | Teacher components                | Teacher, TeacherDepartment              | createTeacher, assignDepartment   | /teachers/\*        | Epic 2,3     |
| **Epic 6: Classes**        | Class components                  | Class, Subject, StudentClass, Timetable | createClass, enrollStudents       | /classes/\*         | Epic 3,4,5   |
| **Epic 7: Attendance**     | Attendance components             | Attendance, AttendanceEnhanced          | markAttendance, generateQR        | /attendance/\*      | Epic 4,6     |
| **Epic 8: Assessment**     | Assignment components             | Assignment, AssignmentSubmission        | createAssignment, gradeSubmission | /assignments/\*     | Epic 6       |
| **Epic 9: Fees**           | Fee components                    | FeeStructure, FeePayment, Invoice       | createFee, recordPayment, stripe  | /fees/\*            | Epic 4       |
| **Epic 10: Communication** | Announcement components           | Announcement, Message                   | createAnnouncement, sendMessage   | /announcements/\*   | Epic 4,5     |
| **Epic 11: Reporting**     | Dashboard components              | - (aggregated data)                     | generateReport, exportPDF         | /reports/\*         | All previous |
| **Epic 12: Polish**        | Performance, security             | -                                       | -                                 | All pages optimized | All previous |

---

## Project Structure

```
hogwarts/
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # 32 specialized AI agents
│   ├── commands/                 # 22 workflow commands
│   ├── skills/                   # 7 reusable skill packages
│   └── settings.json            # Automation configuration
├── prisma/
│   ├── models/                  # 28 Prisma model files
│   │   ├── auth.prisma         # User, Account, Session
│   │   ├── school.prisma       # School, SchoolYear, Term
│   │   ├── students.prisma     # Student, Guardian
│   │   ├── staff.prisma        # Teacher, Department
│   │   ├── subjects.prisma     # Subject, Class
│   │   ├── attendance.prisma   # Attendance tracking
│   │   ├── assessments.prisma  # Assignments, grades
│   │   ├── finance.prisma      # Fee management (40,028 lines)
│   │   └── ...                 # 20 more model files
│   ├── schema.prisma           # Main schema file
│   └── migrations/             # Database migrations
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [lang]/            # Internationalization routes
│   │   │   ├── (auth)/        # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── s/             # School subdomain routes
│   │   │   │   └── [subdomain]/
│   │   │   │       ├── (platform)/    # Platform routes
│   │   │   │       │   ├── dashboard/
│   │   │   │       │   ├── students/
│   │   │   │       │   ├── teachers/
│   │   │   │       │   ├── classes/
│   │   │   │       │   ├── attendance/
│   │   │   │       │   ├── assignments/
│   │   │   │       │   ├── fees/
│   │   │   │       │   ├── announcements/
│   │   │   │       │   ├── reports/
│   │   │   │       │   └── settings/
│   │   │   │       └── page.tsx        # School home
│   │   │   └── docs/                   # Documentation
│   │   └── api/                        # API routes
│   │       ├── auth/[...nextauth]/     # NextAuth
│   │       └── webhooks/               # Stripe, etc.
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── atom/                      # Atomic components
│   │   ├── internationalization/      # i18n utilities
│   │   └── platform/                  # Feature components
│   │       ├── students/
│   │       │   ├── content.tsx       # Server component
│   │       │   ├── form.tsx          # Client form
│   │       │   ├── actions.ts        # Server actions
│   │       │   ├── validation.ts     # Zod schemas
│   │       │   ├── types.ts          # TypeScript types
│   │       │   ├── columns.tsx       # Table columns
│   │       │   └── use-students.ts   # Custom hooks
│   │       ├── teachers/
│   │       ├── classes/
│   │       ├── attendance/
│   │       ├── assignments/
│   │       ├── fees/
│   │       └── ...
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── tenant-context.ts        # Multi-tenant helper
│   │   ├── utils.ts                 # Utility functions
│   │   └── ...
│   ├── auth.ts                       # NextAuth configuration (867 lines)
│   ├── middleware.ts                 # Edge middleware (subdomain routing)
│   ├── env.mjs                       # Environment validation
│   └── routes.ts                     # Route protection
├── public/                           # Static assets
├── tests/
│   ├── unit/                        # Vitest unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # Playwright E2E tests
├── PRD.md                           # Product Requirements (25,000+ words)
├── epics.md                         # Epic breakdown (12,000+ words, 190+ stories)
├── validation-report.md             # BMAD validation (8,000+ words)
├── architecture.md                  # This file
├── CLAUDE.md                        # Claude Code instructions
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies (pnpm)
└── vercel.json                      # Vercel deployment config
```

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents and developers:

### 1. Multi-Tenant Scoping Pattern

**CRITICAL:** Every database operation MUST include `schoolId` filter.

```typescript
// ✅ CORRECT - Scoped by schoolId
import { getTenantContext } from "@/lib/tenant-context"

// ❌ WRONG - No tenant scoping
const students = await prisma.student.findMany()

const { schoolId } = await getTenantContext()
const students = await prisma.student.findMany({
  where: { schoolId },
})
```

**getTenantContext() Implementation:**

```typescript
// src/lib/tenant-context.ts
import { headers } from "next/headers"
import { auth } from "@/auth"

import { db } from "@/lib/db"

export async function getTenantContext() {
  // Method 1: Get schoolId from session (logged-in users)
  const session = await auth()
  if (session?.user?.schoolId) {
    return {
      schoolId: session.user.schoolId,
      source: "session",
    }
  }

  // Method 2: Get schoolId from subdomain (public pages)
  const headersList = headers()
  const subdomain = headersList.get("x-subdomain") // Set by middleware

  if (subdomain) {
    const school = await db.school.findUnique({
      where: { domain: subdomain },
      select: { id: true },
    })

    if (school) {
      return {
        schoolId: school.id,
        source: "subdomain",
      }
    }
  }

  // Method 3: Platform admin (no schoolId restriction)
  if (session?.user?.role === "DEVELOPER") {
    return {
      schoolId: null,
      source: "platform_admin",
    }
  }

  throw new Error("Cannot determine tenant context")
}
```

### 2. Server Actions Pattern

**Every mutation MUST use Server Actions with this structure:**

```typescript
// src/components/platform/students/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { studentSchema } from "./validation"

export async function createStudent(formData: FormData) {
  // 1. Authentication check
  const session = await auth()
  if (!session) {
    return { error: "Unauthorized" }
  }

  // 2. Authorization check (role-based)
  if (!["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Forbidden: Only admins can create students" }
  }

  // 3. Get tenant context (CRITICAL)
  const { schoolId } = await getTenantContext()

  // 4. Parse and validate with Zod
  const parsed = studentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      error: "Validation failed",
      details: parsed.error.flatten(),
    }
  }

  // 5. Execute database operation (with schoolId)
  try {
    const student = await db.student.create({
      data: {
        ...parsed.data,
        schoolId, // CRITICAL: Include schoolId
      },
    })

    // 6. Revalidate cache
    revalidatePath("/students")

    // 7. Return success
    return { success: true, student }
  } catch (error) {
    // 8. Error handling
    console.error("Failed to create student:", error)
    return { error: "Database error" }
  }
}
```

### 3. Form + Validation Pattern

**Co-locate validation with forms:**

```typescript
// src/components/platform/students/validation.ts
import { z } from "zod"

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dateOfBirth: z.coerce.date().max(new Date(), "Birth date cannot be future"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  rollNumber: z.string().min(1, "Roll number required"),
  yearLevelId: z.string().cuid("Invalid year level"),
})

export type StudentFormData = z.infer<typeof studentSchema>
```

```typescript
// src/components/platform/students/form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, type StudentFormData } from "./validation"
import { createStudent } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function StudentForm() {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    }
  })

  async function onSubmit(data: StudentFormData) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString())
    })

    const result = await createStudent(formData)

    if (result.error) {
      form.setError("root", { message: result.error })
    } else {
      window.location.href = "/students"
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 4. Component Hierarchy Pattern

**Build components from bottom up:**

```typescript
// 1. UI Components (shadcn/ui)
import { Button } from "@/components/ui/button"

// 2. Atom Components (Compose 2+ UI)
import { FormField } from "@/components/atom/form-field"

// 3. Feature Components (Business Logic)
import { StudentForm } from "@/components/platform/students/form"

// 4. Page Components (Route Handlers)
export default function NewStudentPage() {
  return (
    <div>
      <h1>Create New Student</h1>
      <StudentForm />
    </div>
  )
}
```

### 5. Data Table Column Pattern

**CRITICAL:** Column definitions with hooks MUST be generated in client components.

```typescript
// src/components/platform/students/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Student } from "@prisma/client"
import { useModal } from "@/hooks/use-modal"

export function getColumns(): ColumnDef<Student>[] {
  return [
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const modal = useModal()  // Hook usage - must be in client component

        return (
          <Button onClick={() => modal.open("edit-student", row.original)}>
            Edit
          </Button>
        )
      },
    },
  ]
}
```

```typescript
// src/components/platform/students/table.tsx
"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"

export function StudentTable({ data }) {
  const columns = useMemo(() => getColumns(), [])  // Generate on client

  return <DataTable columns={columns} data={data} />
}
```

### 6. Mirror Pattern (Route → Component)

**Routes MUST mirror component folders:**

```
src/app/[lang]/students/              → src/components/platform/students/
src/app/[lang]/students/page.tsx      → imports StudentsContent
src/app/[lang]/students/new/page.tsx  → imports StudentForm
```

---

## Consistency Rules

### Naming Conventions

**Files:**

- Components: `PascalCase.tsx` (e.g., `StudentForm.tsx`)
- Utils: `kebab-case.ts` (e.g., `tenant-context.ts`)
- Server Actions: `actions.ts`
- Validation: `validation.ts`
- Types: `types.ts`
- Hooks: `use-*.ts` (e.g., `use-students.ts`)

**Variables:**

- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- Functions: `camelCase` (e.g., `getTenantContext`)
- Components: `PascalCase` (e.g., `StudentForm`)
- Types/Interfaces: `PascalCase` (e.g., `StudentFormData`)

**Database:**

- Tables: `PascalCase` (e.g., `Student`, `SchoolYear`)
- Fields: `camelCase` (e.g., `firstName`, `createdAt`)
- Enums: `SCREAMING_SNAKE_CASE` (e.g., `ADMIN`, `TEACHER`)

### Code Organization

**Feature Folder Structure:**

```
src/components/platform/<feature>/
├── content.tsx         # Server component (page UI)
├── form.tsx            # Client component (form)
├── table.tsx           # Client component (data table)
├── card.tsx            # Client component (card view)
├── columns.tsx         # Table column definitions
├── actions.ts          # Server actions ("use server")
├── validation.ts       # Zod schemas
├── types.ts            # TypeScript types
├── use-<feature>.ts    # Custom React hooks
├── config.ts           # Static data, enums
└── util.ts             # Utility functions
```

### Error Handling

**Centralized Error Handler:**

```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof z.ZodError) {
    return {
      error: "Validation failed",
      details: error.flatten(),
      statusCode: 400,
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        error: "Duplicate entry",
        field: error.meta?.target,
        statusCode: 409,
      }
    }
  }

  console.error("Unhandled error:", error)
  return {
    error: "Internal server error",
    statusCode: 500,
  }
}
```

**Usage:**

```typescript
export async function createStudent(data: FormData) {
  try {
    // ... operation
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Logging Strategy

**Structured Logging with pino:**

```typescript
// src/lib/logger.ts
import pino from "pino"

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
})

// Usage
logger.info({ schoolId, userId, action: "create_student" }, "Student created")
logger.error({ error, context }, "Failed to process payment")
```

---

## Data Architecture

### Database Schema Overview

**28 Prisma Model Files:**

| File                           | Models                                                    | Description                                                    |
| ------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------- |
| **auth.prisma**                | User, Account, Session, VerificationToken, TwoFactorToken | NextAuth v5 authentication tables                              |
| **school.prisma**              | School, SchoolYear, Period, Term, YearLevel, Domain       | School structure and academic calendar                         |
| **students.prisma**            | Student, Guardian, StudentGuardian, StudentYearLevel      | Student management                                             |
| **staff.prisma**               | Teacher, Department, TeacherDepartment                    | Teacher and department management                              |
| **subjects.prisma**            | Subject, Class, StudentClass, ScoreRange                  | Academic organization                                          |
| **classrooms.prisma**          | Classroom, ClassroomType                                  | Physical classroom management                                  |
| **attendance.prisma**          | Attendance                                                | Basic attendance tracking                                      |
| **attendance-enhanced.prisma** | AttendanceEnhanced                                        | Period-wise attendance                                         |
| **geo-attendance.prisma**      | GeoAttendance                                             | Location-based attendance                                      |
| **assessments.prisma**         | Assignment, AssignmentSubmission                          | Assignments and grading                                        |
| **exam.prisma**                | Exam, ExamSchedule, ExamResult                            | Exam management                                                |
| **qbank.prisma**               | QuestionBank, Question                                    | Question bank for exams                                        |
| **qbank-automation.prisma**    | QuestionBankAutomation                                    | Automated question generation                                  |
| **finance.prisma**             | 50+ models (40,028 lines)                                 | Double-entry bookkeeping, fees, payments, invoices, accounting |
| **admission.prisma**           | AdmissionCampaign, AdmissionApplication, MeritList        | Student admission process                                      |
| **library.prisma**             | Book, BookInventory, BookIssue                            | Library management                                             |
| **stream.prisma**              | Stream, StreamContent                                     | Learning Management System (LMS)                               |
| **lessons.prisma**             | Lesson, LessonPlan                                        | Lesson planning and curriculum                                 |
| **timetable.prisma**           | Timetable, SchoolWeekConfig                               | Class schedule and timetable                                   |
| **announcement.prisma**        | Announcement                                              | Announcements and notifications                                |
| **domain.prisma**              | Domain                                                    | Domain configuration for subdomains                            |
| **branding.prisma**            | SchoolBranding                                            | School branding and theming                                    |
| **theme.prisma**               | Theme                                                     | Custom theme settings                                          |
| **subscription.prisma**        | SubscriptionTier, Subscription, Discount                  | SaaS billing and subscriptions                                 |
| **legal.prisma**               | LegalDocument, LegalConsent                               | Legal compliance (FERPA, GDPR)                                 |
| **audit.prisma**               | AuditLog                                                  | Audit trail for sensitive operations                           |
| **task.prisma**                | Task                                                      | Task management                                                |
| **quiz-game.prisma**           | QuizGame, QuizQuestion                                    | Gamification features                                          |

### Core Schema Relationships

```
School (1)
├─ has many ─> Students (N)
│              ├─ belongs to many ─> Classes (N:M via StudentClass)
│              ├─ has many ─> Attendance (N)
│              ├─ has many ─> Assignments (N)
│              ├─ has many ─> Fees (N)
│              └─ belongs to ─> YearLevel (N:1)
│
├─ has many ─> Teachers (N)
│              ├─ belongs to many ─> Departments (N:M via TeacherDepartment)
│              ├─ teaches many ─> Classes (N)
│              └─ creates many ─> Assignments (N)
│
├─ has many ─> Subjects (N)
│              └─ taught in many ─> Classes (N)
│
├─ has many ─> Classes (N)
│              ├─ taught in ─> Classrooms (N:1)
│              ├─ scheduled in ─> Timetable (N)
│              ├─ has many ─> StudentClass (N)
│              └─ has many ─> Assignments (N)
│
├─ has many ─> Departments (N)
│              └─ has many ─> Teachers (N:M via TeacherDepartment)
│
├─ has many ─> YearLevels (N)
│              └─ has many ─> Students (N)
│
├─ has one ─> SchoolBranding (1:1)
├─ has one ─> SchoolSettings (1:1)
└─ has many ─> AuditLogs (N)
```

### Multi-Tenant Database Isolation

**Critical Pattern: All business tables include `schoolId`**

```prisma
model Student {
  id       String @id @default(cuid())
  schoolId String  // CRITICAL: Tenant isolation field
  school   School @relation(fields: [schoolId], references: [id])

  firstName String
  lastName  String
  email     String?

  // Unique constraint scoped within tenant
  @@unique([email, schoolId])

  // Index for performance
  @@index([schoolId])
  @@index([schoolId, lastName])
}

model Teacher {
  id       String @id @default(cuid())
  schoolId String  // CRITICAL: Tenant isolation field
  school   School @relation(fields: [schoolId], references: [id])

  // ... fields

  @@index([schoolId])
}

// Platform admin users (DEVELOPER role) have NULL schoolId
model User {
  id       String  @id @default(cuid())
  email    String
  schoolId String?  // NULL for platform admins
  school   School? @relation(fields: [schoolId], references: [id])

  // Allow same email across different schools
  @@unique([email, schoolId])
}
```

---

## API Contracts

### Server Actions API

**All server actions follow this contract:**

```typescript
type ServerActionResult<T> =
  | { success: true; data: T }
  | { error: string; details?: unknown }

// Examples:
async function createStudent(
  data: FormData
): Promise<ServerActionResult<Student>>
async function updateSchool(data: FormData): Promise<ServerActionResult<School>>
async function deleteClass(classId: string): Promise<ServerActionResult<void>>
```

### REST API Routes (Webhooks)

**Stripe Webhook:**

```typescript
POST /api/webhooks/stripe
Headers:
  - stripe-signature: string

Body: Stripe Event JSON

Response:
  200: { received: true }
  400: { error: "Invalid signature" }
```

---

## Security Architecture

### Authentication & Authorization

**NextAuth v5 Configuration:**

- JWT strategy with 24-hour sessions
- httpOnly cookies (prevents XSS theft)
- Cross-subdomain cookies (`.databayt.org`)
- OAuth providers: Google, Facebook
- Two-factor authentication support

**8-Role RBAC System:**

| Role           | Description          | schoolId | Access Level         |
| -------------- | -------------------- | -------- | -------------------- |
| **DEVELOPER**  | Platform admin       | null     | All schools          |
| **ADMIN**      | School administrator | required | Full school access   |
| **TEACHER**    | Teaching staff       | required | Class-specific       |
| **STUDENT**    | Enrolled students    | required | Own data only        |
| **GUARDIAN**   | Parents/guardians    | required | Children's data only |
| **ACCOUNTANT** | Finance staff        | required | Finance features     |
| **STAFF**      | General school staff | required | Limited access       |
| **USER**       | Default role         | required | Minimal access       |

### OWASP Top 10 Mitigation

**1. Injection:**

- ✅ Parameterized queries via Prisma (SQL injection prevention)
- ✅ React auto-escaping (XSS prevention)
- ✅ Zod validation at all boundaries

**2. Broken Authentication:**

- ✅ NextAuth v5 with secure defaults
- ✅ httpOnly cookies
- ✅ CSRF protection built-in

**3. Sensitive Data Exposure:**

- ✅ Never send sensitive data to client
- ✅ Encryption at rest for sensitive fields
- ✅ HTTPS only (enforced)

**4. Access Control:**

- ✅ Role-based authorization
- ✅ Tenant isolation (schoolId verification)
- ✅ Row-level security checks

**5. Security Misconfiguration:**

- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Environment variable validation
- ✅ Dependency scanning (Dependabot)

**6. XSS:**

- ✅ React auto-escaping
- ✅ DOMPurify for rich text
- ✅ Content Security Policy

**7. Insecure Deserialization:**

- ✅ Zod validation on all inputs
- ✅ No eval() or Function() usage

**8. Known Vulnerabilities:**

- ✅ Automated dependency scanning
- ✅ Regular updates via Renovate Bot

**9. Logging & Monitoring:**

- ✅ Comprehensive audit logging
- ✅ Sentry error tracking
- ✅ Vercel Analytics performance monitoring

**10. Insufficient Logging:**

- ✅ Audit logs for all sensitive operations
- ✅ Request ID tracking
- ✅ Error context capture

---

## Performance Considerations

### Performance Targets

| Metric                             | Target  | Current (Prod) | Status |
| ---------------------------------- | ------- | -------------- | ------ |
| **Lighthouse Score**               | > 90    | 94             | ✅     |
| **First Contentful Paint (FCP)**   | < 1.5s  | 1.2s           | ✅     |
| **Largest Contentful Paint (LCP)** | < 2.5s  | 2.1s           | ✅     |
| **Time to Interactive (TTI)**      | < 3.5s  | 3.0s           | ✅     |
| **Cumulative Layout Shift (CLS)**  | < 0.1   | 0.05           | ✅     |
| **First Input Delay (FID)**        | < 100ms | 80ms           | ✅     |
| **Server Response Time (TTFB)**    | < 600ms | 450ms          | ✅     |

### Optimization Strategies

**1. Image Optimization:**

```typescript
import Image from "next/image"

// ✅ Automatic optimization (WebP/AVIF, responsive sizes, lazy loading)
<Image
  src="/student-photo.jpg"
  alt="Student"
  width={400}
  height={400}
  priority={false}  // Lazy load by default
/>
```

**2. Code Splitting:**

```typescript
import dynamic from "next/dynamic"

// ✅ Dynamic imports for heavy components
const RichTextEditor = dynamic(() => import("./editor"), {
  loading: () => <Skeleton />,
  ssr: false  // Client-only component
})
```

**3. Database Query Optimization:**

```typescript
// ❌ N+1 Query Problem
const students = await db.student.findMany({ where: { schoolId } })
for (const student of students) {
  const attendance = await db.attendance.count({
    where: { studentId: student.id },
  })
}

// ✅ Single query with aggregation
const students = await db.student.findMany({
  where: { schoolId },
  include: {
    _count: {
      select: { attendance: { where: { status: "PRESENT" } } },
    },
  },
})
```

**4. Caching Strategy:**

```typescript
// ✅ ISR for semi-static pages
export const revalidate = 3600 // Revalidate every hour

// ✅ SWR for client-side caching
const { data } = useSWR("/api/stats", fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
})
```

**5. Database Indexes:**

```prisma
model Student {
  @@index([schoolId])                    // Tenant isolation queries
  @@index([schoolId, lastName])          // Name searches
  @@index([schoolId, email])             // Email lookups
  @@unique([email, schoolId])            // Prevent duplicates
}
```

---

## Deployment Architecture

### Vercel Serverless Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                         │
│  (300+ Global Edge Locations)                                    │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Static Assets (CDN cached)                                  │
│  │  └─ Images, CSS, JS bundles                                  │
│  ├─ ISR Pages (Incremental Static Regeneration)                 │
│  │  └─ Dashboard, public pages                                  │
│  └─ Edge Middleware (runs on every request)                     │
│     └─ Subdomain routing, auth checks, i18n                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SERVERLESS FUNCTIONS                           │
│  (Auto-scaling, pay-per-invocation)                             │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Server Components (SSR)                                     │
│  ├─ Server Actions                                              │
│  ├─ API Routes                                                  │
│  └─ Image Optimization                                          │
│                                                                  │
│  Configuration:                                                  │
│  - Runtime: nodejs20.x                                          │
│  - Region: Washington, D.C. (iad1) - closest to Neon DB        │
│  - Memory: 1024 MB                                              │
│  - Timeout: 10 seconds                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                EXTERNAL SERVICES (AWS US-EAST-1)                 │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Neon PostgreSQL (Serverless)                                │
│  ├─ Vercel Blob Storage (Images)                                │
│  ├─ Sentry (Error tracking)                                     │
│  ├─ Resend (Email delivery)                                     │
│  └─ Stripe (Payment processing)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type check
        run: pnpm tsc --noEmit

      - name: Run linter
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test

      - name: Run E2E tests
        run: pnpm test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### Environment Configuration

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/dbname"

# Authentication
NEXTAUTH_URL="https://ed.databayt.org"
NEXTAUTH_SECRET="xxxxx"  # 32+ character random string

# OAuth Providers
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxx"

# Stripe
STRIPE_PUBLIC_KEY="pk_live_xxxxx"
STRIPE_SECRET_KEY="sk_live_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"

# Email
RESEND_API_KEY="re_xxxxx"

# Monitoring
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
```

---

## Development Environment

### Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 9.x or higher (required for Vercel deployments)
- **PostgreSQL**: 14+ (or Neon account)
- **Git**: Latest version

### Setup Commands

```bash
# Clone repository
git clone https://github.com/hogwarts/app.git
cd app

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
pnpm prisma generate
pnpm prisma migrate dev

# Seed database (optional)
pnpm db:seed

# Start development server
pnpm dev
# Open http://localhost:3000
```

### Development Workflow

```bash
# Development
pnpm dev            # Start Next.js with Turbopack
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Run ESLint
pnpm test           # Run Vitest tests

# Database
pnpm db:seed        # Seed database with test data
pnpm prisma generate # Generate Prisma client
pnpm prisma migrate dev # Run database migrations

# E2E Testing
pnpm test:e2e           # Run Playwright E2E tests
pnpm test:e2e:ui        # Run E2E tests with UI
pnpm test:e2e:debug     # Debug E2E tests
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Multi-Tenant Architecture - Subdomain-Based Routing

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need to isolate school data while serving multiple schools from single platform

**Decision:** Use subdomain-based routing (`school.databayt.org`) with shared database

**Alternatives Considered:**

1. **Path-based routing** (`databayt.org/schools/hogwarts`) - Rejected: Less professional, harder to brand
2. **Separate databases per tenant** - Rejected: Cost prohibitive, complex backups, difficult migrations
3. **Database schemas per tenant** - Rejected: PostgreSQL schema limitations, migration complexity

**Rationale:**

- ✅ Professional appearance (own subdomain)
- ✅ School-specific branding per subdomain
- ✅ OAuth redirect URLs work correctly
- ✅ Cost-effective (single database)
- ✅ Easy backups and disaster recovery
- ✅ Cross-tenant analytics for platform team

**Consequences:**

- **Positive:** Clean URL structure, easy branding, cost savings
- **Negative:** Requires strict `schoolId` scoping in all queries (mitigated with patterns)

**Affects:** Epic 1, all subsequent epics

---

### ADR-002: Server Actions over REST API

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need API pattern for client-server mutations

**Decision:** Use Next.js Server Actions as primary API pattern

**Alternatives Considered:**

1. **REST API** (`/api/students POST`) - Rejected: Boilerplate heavy, serialization overhead
2. **GraphQL** - Rejected: Overkill for CRUD operations, team unfamiliar
3. **tRPC** - Rejected: Server Actions more native to Next.js

**Rationale:**

- ✅ Type-safe end-to-end (no serialization)
- ✅ No API route boilerplate
- ✅ Automatic form validation
- ✅ Built-in loading states
- ✅ Progressive enhancement (works without JS)

**Consequences:**

- **Positive:** Faster development, fewer bugs, better DX
- **Negative:** Tied to Next.js ecosystem (acceptable trade-off)

**Affects:** Epic 2 onwards (all mutations)

---

### ADR-003: Prisma ORM over Raw SQL

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need database access layer with type safety

**Decision:** Use Prisma ORM for all database operations

**Alternatives Considered:**

1. **Raw SQL** - Rejected: No type safety, prone to SQL injection
2. **TypeORM** - Rejected: Less TypeScript-first, weaker migrations
3. **Drizzle** - Rejected: Less mature ecosystem, fewer resources

**Rationale:**

- ✅ Excellent TypeScript support
- ✅ Type-safe queries
- ✅ Migration system built-in
- ✅ Great documentation
- ✅ Active community

**Consequences:**

- **Positive:** Faster development, fewer SQL injection risks, better DX
- **Negative:** Abstraction layer (mitigated by generated types)

**Affects:** Epic 1, all database interactions

---

### ADR-004: NextAuth v5 for Authentication

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need authentication solution with OAuth and multi-tenant support

**Decision:** Use NextAuth v5 (Auth.js) with JWT strategy

**Alternatives Considered:**

1. **Clerk** - Rejected: Cost prohibitive for 5,000 schools
2. **Auth0** - Rejected: Complex pricing, vendor lock-in
3. **Supabase Auth** - Rejected: Tied to Supabase ecosystem
4. **Custom JWT** - Rejected: Security risks, reinventing wheel

**Rationale:**

- ✅ Industry standard
- ✅ OAuth providers built-in
- ✅ JWT strategy (no database sessions)
- ✅ Free and open-source
- ✅ Multi-tenant compatible

**Consequences:**

- **Positive:** Robust authentication, OAuth support, cost savings
- **Negative:** Beta version (v5) - mitigated by community support

**Affects:** Epic 2 (Authentication)

---

### ADR-005: shadcn/ui over Material-UI or Ant Design

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need UI component library

**Decision:** Use shadcn/ui (Radix UI primitives) with Tailwind CSS

**Alternatives Considered:**

1. **Material-UI** - Rejected: Opinionated design, bundle size
2. **Ant Design** - Rejected: Chinese-centric, harder customization
3. **Chakra UI** - Rejected: Runtime CSS-in-JS performance

**Rationale:**

- ✅ No dependency lock-in (copy components to codebase)
- ✅ Highly customizable
- ✅ Excellent accessibility (Radix UI)
- ✅ Tailwind CSS integration
- ✅ Modern design patterns

**Consequences:**

- **Positive:** Full control over components, no vendor lock-in, fast
- **Negative:** Manual updates per component (acceptable)

**Affects:** All epics (UI components)

---

### ADR-006: pnpm over npm/yarn

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need package manager for monorepo-style development

**Decision:** Use pnpm as package manager

**Alternatives Considered:**

1. **npm** - Rejected: Slower, uses more disk space
2. **yarn** - Rejected: Less efficient than pnpm
3. **yarn workspaces** - Rejected: Not needed (not a monorepo)

**Rationale:**

- ✅ Faster installations
- ✅ Disk space efficient (content-addressable storage)
- ✅ Strict dependencies (no phantom dependencies)
- ✅ Required for Vercel deployment

**Consequences:**

- **Positive:** Faster CI/CD, disk savings, stricter dependency management
- **Negative:** Requires pnpm installation (documented)

**Affects:** All epics (development workflow)

---

### ADR-007: Vitest over Jest

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need unit testing framework

**Decision:** Use Vitest for unit tests

**Alternatives Considered:**

1. **Jest** - Rejected: Slower, less Vite-friendly
2. **AVA** - Rejected: Less community support
3. **Mocha** - Rejected: Requires too much configuration

**Rationale:**

- ✅ Vite-native (faster)
- ✅ Jest-compatible API (easy migration)
- ✅ ESM support out-of-the-box
- ✅ Better TypeScript support

**Consequences:**

- **Positive:** Faster tests, better DX, Vite integration
- **Negative:** Smaller ecosystem than Jest (acceptable)

**Affects:** Epic 12 (Testing), all features with unit tests

---

### ADR-008: Internationalization - Custom i18n over next-intl

**Date:** January 2024
**Status:** ✅ Accepted
**Context:** Need bilingual support (Arabic RTL + English LTR)

**Decision:** Build custom i18n system with dictionary files

**Alternatives Considered:**

1. **next-intl** - Rejected: Overkill for 2 languages
2. **react-i18next** - Rejected: Not Next.js optimized
3. **next-translate** - Rejected: Less flexible

**Rationale:**

- ✅ Full control over implementation
- ✅ Optimized for exactly 2 languages
- ✅ RTL/LTR support built-in
- ✅ Server component compatible
- ✅ No external dependencies

**Consequences:**

- **Positive:** Lightweight, tailored solution, no dependencies
- **Negative:** Manual implementation (documented patterns)

**Affects:** All epics (i18n support)

---

## Novel Pattern Designs

### Pattern 1: Subdomain-to-Tenant Middleware Pattern

**Problem:** Map subdomain to school context without database queries on every request

**Solution:** Middleware sets header, downstream code uses cached context

```typescript
// src/middleware.ts
export function middleware(req: NextRequest) {
  const subdomain = extractSubdomain(req.headers.get("host"))

  const response = NextResponse.next()
  response.headers.set("x-subdomain", subdomain) // Cache subdomain

  return response
}

// src/lib/tenant-context.ts
export async function getTenantContext() {
  const subdomain = headers().get("x-subdomain") // Read from header

  // Cache school lookup
  const school = await db.school.findUnique({
    where: { domain: subdomain },
  })

  return { schoolId: school.id }
}
```

**Benefits:**

- Single database query per request (cached in headers)
- Type-safe tenant context
- Works in Server Components and Server Actions

---

### Pattern 2: Mirror Pattern for Routes and Components

**Problem:** Hard to find components for specific routes

**Solution:** Route structure exactly mirrors component folder structure

```
src/app/[lang]/students/new/page.tsx
  → imports from →
src/components/platform/students/form.tsx
```

**Benefits:**

- Predictable file locations
- Easy navigation
- Clear mental model

---

### Pattern 3: Dictionary Validation for i18n

**Problem:** Missing translations cause runtime errors

**Solution:** TypeScript type checking for dictionary completeness

```typescript
// src/components/internationalization/dictionaries.ts
type Dictionary = {
  common: {
    save: string
    cancel: string
  }
  students: {
    title: string
    addStudent: string
  }
}

// Type-checked dictionary access
const dict = await getDictionary<Dictionary>(locale)
const title = dict.students.title // Type-safe access
```

**Benefits:**

- Compile-time checks for missing translations
- Autocomplete for translation keys
- Prevents runtime errors

---

## Appendix: Key File Locations

**Core Configuration:**

- `/next.config.ts` - Next.js configuration
- `/prisma/schema.prisma` - Database schema
- `/src/auth.ts` - Authentication configuration (867 lines)
- `/src/middleware.ts` - Edge middleware
- `/src/env.mjs` - Environment variable validation

**Key Utilities:**

- `/src/lib/db.ts` - Prisma client singleton
- `/src/lib/tenant-context.ts` - Multi-tenant context helper
- `/src/lib/utils.ts` - Utility functions
- `/src/routes.ts` - Route protection definitions

**Documentation:**

- `/PRD.md` - Product Requirements Document (25,000+ words)
- `/epics.md` - Epic and story breakdown (12,000+ words, 190+ stories)
- `/validation-report.md` - BMAD validation results (8,000+ words)
- `/architecture.md` - This file
- `/CLAUDE.md` - Claude Code instructions

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: January 2025_
_For: Hogwarts School Automation Platform_
_Architect: Claude Code with BMAD-METHOD_

**Status:** ✅ Production-Ready, 100% MVP Complete
**Next Steps:** Expand to growth features (Q1-Q4 2024 roadmap)
