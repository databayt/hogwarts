# Hogwarts - Technical Specification

**Feature ID:** TS-003
**Author:** Product Team
**Date:** 2025-01-03
**Project Level:** Level 0 (Small Feature / Bug Fix)
**Change Type:** Enhancement
**Development Context:** Hogwarts School Automation Platform
**Estimated Time:** 1-2 hours

---

## Context

### Available Documents
- PRD: `/PRD.md` (FR-STU-003: Student email for direct communication)
- Epics: `/epics.md` (Epic 4: Student Management, Story 4.1: Student Profile Management)
- Architecture: `/architecture.md` (Multi-tenant architecture, mirror pattern)
- Existing Implementation: `prisma/models/students.prisma`, `src/components/platform/students/`

### Project Stack
- **Framework**: Next.js 15.4.4 (App Router) with React 19.1.0
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL (Neon) with Prisma ORM 6.14.0
- **Authentication**: NextAuth v5 (Auth.js 5.0.0-beta.29)
- **Styling**: Tailwind CSS 4 with shadcn/ui (New York style)
- **Testing**: Vitest 2.0.6 + React Testing Library + Playwright 1.55.0

### Existing Codebase Structure

**Current Implementation:**
```
prisma/models/students.prisma        # Student model (no email field currently)
src/components/platform/students/
  content.tsx                        # Student listing UI
  form.tsx                           # Student form
  actions.ts                         # Student CRUD operations
  validation.ts                      # Zod schemas
  types.ts                           # TypeScript types
```

**Current Student Model:**
```prisma
model Student {
  id              String   @id @default(cuid())
  schoolId        String
  givenName       String
  middleName      String?
  surname         String
  dateOfBirth     DateTime?
  gender          String
  enrollmentDate  DateTime?
  userId          String?  @unique
  // No email field currently
  // ...
}
```

---

## The Change

### Problem Statement

Currently, the Student model lacks an email field, which causes several limitations:
1. **No Direct Communication**: Cannot send emails directly to students (must go through guardians)
2. **Account Linking**: Cannot link student email to their user account for portal access
3. **Password Reset**: Cannot send password reset emails to students
4. **Notifications**: Cannot send grade/assignment notifications directly to students
5. **Compliance**: Some schools require student email for older students (high school)

The User model has an email field, but Student profiles cannot store their own email addresses independently.

**User Story:**
```
As a school administrator,
I want to add email addresses to student profiles,
So that we can communicate directly with older students and link their accounts to email addresses.
```

### Proposed Solution

Add an optional `email` field to the Student model with the following features:

1. **Database Field**: Add `email String? @unique` to Student model (optional, unique)
2. **Validation**: Email format validation, uniqueness check (globally unique, not scoped by schoolId)
3. **Form Field**: Add email input to student creation/edit forms
4. **Data Table Column**: Display email in student listing table
5. **Profile Display**: Show email on student detail/profile page
6. **Migration**: Safe migration with nullable field

### Scope

**In Scope:**
- [ ] Add `email` field to Student model (optional, unique globally)
- [ ] Update Prisma schema and run migration
- [ ] Add email validation to Zod schemas
- [ ] Add email input field to student forms
- [ ] Add email column to student data table
- [ ] Update createStudent and updateStudent actions
- [ ] Show email on student profile/detail page
- [ ] Unit tests for email validation
- [ ] E2E test for adding/editing student email

**Out of Scope:**
- [ ] Email verification workflow (future enhancement)
- [ ] Sending emails to students (future enhancement)
- [ ] Bulk email import (future enhancement)
- [ ] Email domain restrictions (future enhancement)
- [ ] Integration with student portal login (future enhancement)

---

## Implementation Details

### Source Tree Changes

**Files to Modify:**
```
prisma/models/students.prisma                        # Add email field
src/components/platform/students/validation.ts       # Add email validation
src/components/platform/students/actions.ts          # Handle email in CRUD
src/components/platform/students/form.tsx            # Add email input
src/components/platform/students/column.tsx          # Add email column
src/components/platform/students/types.ts            # Add email to type
```

**No new files needed** (pure enhancement to existing feature)

### Technical Approach

**1. Database Schema Change:**

```prisma
// prisma/models/students.prisma
model Student {
  id              String    @id @default(cuid())
  schoolId        String
  givenName       String
  middleName      String?
  surname         String
  email           String?   @unique   // NEW: Optional student email (globally unique)
  dateOfBirth     DateTime?
  gender          String
  enrollmentDate  DateTime?
  userId          String?   @unique

  school          School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  // ... rest of relations ...

  @@unique([givenName, surname, dateOfBirth, schoolId])  // Existing constraint
  @@index([schoolId])
  @@index([email])  // NEW: Index for faster email lookups
}
```

**Migration:**
```bash
pnpm prisma migrate dev --name add_student_email_field
```

**2. Validation Schema Update:**

```typescript
// src/components/platform/students/validation.ts (MODIFY)
import { z } from "zod"

export const studentCreateSchema = z.object({
  givenName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  surname: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),  // Allow empty string to be treated as undefined
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  enrollmentDate: z.string().optional(),
  userId: z.string().optional()
})

export const studentUpdateSchema = z.object({
  id: z.string().min(1),
  givenName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  surname: z.string().min(1).optional(),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),  // Allow empty string for clearing email
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  enrollmentDate: z.string().optional(),
  userId: z.string().optional()
})
```

**3. Server Actions Update:**

```typescript
// src/components/platform/students/actions.ts (MODIFY createStudent function)
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { studentCreateSchema, studentUpdateSchema } from "./validation"

export async function createStudent(input: z.infer<typeof studentCreateSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const parsed = studentCreateSchema.parse(input)

  // Normalize email (trim, lowercase, handle empty string)
  let normalizedEmail: string | null = null
  if (parsed.email && parsed.email.trim().length > 0) {
    normalizedEmail = parsed.email.trim().toLowerCase()

    // Check if email already exists (globally unique)
    const existingStudent = await db.student.findFirst({
      where: { email: normalizedEmail }
    })

    if (existingStudent) {
      throw new Error("This email is already registered to another student")
    }
  }

  // Handle userId normalization (existing logic)
  let normalizedUserId: string | null = parsed.userId && parsed.userId.trim().length > 0 ? parsed.userId.trim() : null

  if (normalizedUserId) {
    const user = await db.user.findFirst({ where: { id: normalizedUserId } })
    if (!user) {
      normalizedUserId = null
    } else {
      const existingStudent = await db.student.findFirst({
        where: { userId: normalizedUserId }
      })
      if (existingStudent) {
        normalizedUserId = null
      }
    }
  }

  // Create student with email
  const row = await db.student.create({
    data: {
      schoolId,
      givenName: parsed.givenName,
      middleName: parsed.middleName ?? null,
      surname: parsed.surname,
      email: normalizedEmail,  // NEW
      ...(parsed.dateOfBirth ? { dateOfBirth: new Date(parsed.dateOfBirth) } : {}),
      gender: parsed.gender,
      ...(parsed.enrollmentDate ? { enrollmentDate: new Date(parsed.enrollmentDate) } : {}),
      userId: normalizedUserId,
    },
  })

  revalidatePath("/lab/students")
  return { success: true as const, id: row.id as string }
}

export async function updateStudent(input: z.infer<typeof studentUpdateSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const parsed = studentUpdateSchema.parse(input)
  const { id, ...rest } = parsed

  const data: Record<string, unknown> = {}

  if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName
  if (typeof rest.middleName !== "undefined") data.middleName = rest.middleName ?? null
  if (typeof rest.surname !== "undefined") data.surname = rest.surname
  if (typeof rest.gender !== "undefined") data.gender = rest.gender

  // Handle email update (NEW)
  if (typeof rest.email !== "undefined") {
    const trimmed = rest.email?.trim().toLowerCase()
    if (trimmed && trimmed.length > 0) {
      // Check if email already exists (exclude current student)
      const existingStudent = await db.student.findFirst({
        where: {
          email: trimmed,
          NOT: { id }
        }
      })
      if (existingStudent) {
        throw new Error("This email is already registered to another student")
      }
      data.email = trimmed
    } else {
      data.email = null  // Clear email if empty string provided
    }
  }

  // Existing userId logic
  if (typeof rest.userId !== "undefined") {
    const trimmed = rest.userId?.trim()
    if (trimmed) {
      const user = await db.user.findFirst({ where: { id: trimmed } })
      if (user) {
        const existingStudent = await db.student.findFirst({
          where: {
            userId: trimmed,
            NOT: { id }
          }
        })
        data.userId = existingStudent ? null : trimmed
      } else {
        data.userId = null
      }
    } else {
      data.userId = null
    }
  }

  if (typeof rest.dateOfBirth !== "undefined") data.dateOfBirth = new Date(rest.dateOfBirth)
  if (typeof rest.enrollmentDate !== "undefined") data.enrollmentDate = new Date(rest.enrollmentDate)

  await db.student.updateMany({ where: { id, schoolId }, data })

  revalidatePath("/lab/students")
  return { success: true as const }
}

// getStudent and getStudents remain unchanged (will automatically include email field)
```

**4. Form Component Update:**

```typescript
// src/components/platform/students/form.tsx (MODIFY - add email field)
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentCreateSchema } from "./validation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// ... other imports ...

export function StudentForm({ initialData }: StudentFormProps) {
  const form = useForm({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: initialData || {}
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Existing fields: givenName, middleName, surname */}

      {/* NEW: Email field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="student@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional email for direct communication with student
        </p>
      </div>

      {/* Rest of form fields: dateOfBirth, gender, etc. */}

      <Button type="submit">Save Student</Button>
    </form>
  )
}
```

**5. Data Table Column Update:**

```typescript
// src/components/platform/students/column.tsx (MODIFY - add email column)
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Student } from "./types"

export const getColumns = (): ColumnDef<Student>[] => [
  {
    accessorKey: "givenName",
    header: "First Name",
  },
  {
    accessorKey: "surname",
    header: "Last Name",
  },
  // NEW: Email column
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null
      return email ? (
        <a href={`mailto:${email}`} className="text-primary hover:underline">
          {email}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    }
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  // ... other columns ...
]
```

**6. TypeScript Type Update:**

```typescript
// src/components/platform/students/types.ts (MODIFY)
export interface Student {
  id: string
  schoolId: string
  givenName: string
  middleName?: string | null
  surname: string
  email?: string | null  // NEW
  dateOfBirth?: Date | null
  gender: string
  enrollmentDate?: Date | null
  userId?: string | null
  // ... other fields ...
}
```

### Existing Patterns to Follow

**Multi-Tenant Safety:**
- ✅ Email is globally unique (not scoped by schoolId)
- ✅ Student records scoped by schoolId
- ✅ getTenantContext() used for schoolId

**Validation Pattern:**
- ✅ Zod schema with email validation
- ✅ Client and server validation
- ✅ Uniqueness check in server action

**Form Pattern:**
- ✅ Optional field with placeholder
- ✅ Error messages inline
- ✅ Help text below input

**Nullable Fields:**
- Similar to middleName, userId (optional fields)
- Handle empty string as null
- Allow clearing field on update

### Integration Points

**Database:**
- Model: `Student` in `prisma/models/students.prisma`
- New field: `email String? @unique`
- New index: `@@index([email])`

**Components:**
- Form: `src/components/platform/students/form.tsx`
- Table: `src/components/platform/students/column.tsx`
- Actions: `src/components/platform/students/actions.ts`

**Validation:**
- Schema: `src/components/platform/students/validation.ts`
- Types: `src/components/platform/students/types.ts`

---

## Development Context

### Relevant Existing Code

**Student Management:**
- Model: `prisma/models/students.prisma`
- Actions: `src/components/platform/students/actions.ts:10-48` (createStudent)
- Actions: `src/components/platform/students/actions.ts:50-85` (updateStudent)
- Form: `src/components/platform/students/form.tsx`
- Columns: `src/components/platform/students/column.tsx`

**Similar Optional Fields:**
- `middleName` - Optional string field
- `userId` - Optional unique field with validation

### Dependencies

**Framework/Libraries:**
- `zod` (4.0.14) - Email validation
- `react-hook-form` (7.61.1) - Form handling
- Prisma - Database ORM

**Internal Modules:**
- `@/lib/db` - Prisma client
- `@/lib/tenant-context` - getTenantContext()
- `@/components/ui/input` - Input component

### Configuration Changes

**Environment Variables:**
```env
# No new environment variables required
```

**Prisma Migration:**
```bash
pnpm prisma migrate dev --name add_student_email_field
pnpm prisma generate
```

**Migration SQL (auto-generated):**
```sql
-- AlterTable
ALTER TABLE "Student" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "Student"("email");
```

### Existing Conventions (Brownfield)

**Naming Conventions:**
- Database fields: camelCase (`email`)
- Components: PascalCase (`StudentForm`)
- Actions: camelCase (`createStudent`)

**Code Organization:**
- Schema in `prisma/models/`
- Validation in `validation.ts`
- Server actions in `actions.ts`
- UI components in feature folder

**Nullable Field Pattern:**
```typescript
// Handle optional string fields
const normalized = field?.trim().toLowerCase() || null
if (normalized) {
  // Use value
} else {
  data.field = null
}
```

### Test Framework & Standards

**Unit Tests:**
```typescript
// src/components/platform/students/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest'
import { studentCreateSchema } from '../validation'

describe('Student Validation', () => {
  it('should accept valid email', () => {
    const result = studentCreateSchema.safeParse({
      givenName: "John",
      surname: "Doe",
      gender: "MALE",
      email: "john.doe@example.com"
    })
    expect(result.success).toBe(true)
  })

  it('should accept empty email', () => {
    const result = studentCreateSchema.safeParse({
      givenName: "John",
      surname: "Doe",
      gender: "MALE",
      email: ""
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email format', () => {
    const result = studentCreateSchema.safeParse({
      givenName: "John",
      surname: "Doe",
      gender: "MALE",
      email: "invalid-email"
    })
    expect(result.success).toBe(false)
  })
})
```

**E2E Tests:**
```typescript
// tests/e2e/student-email.spec.ts
import { test, expect } from '@playwright/test'

test('Admin can add student with email', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'admin@school.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  await page.goto('/students/new')

  await page.fill('#givenName', 'John')
  await page.fill('#surname', 'Doe')
  await page.fill('#email', 'john.doe@example.com')
  await page.selectOption('#gender', 'MALE')

  await page.click('button[type="submit"]')

  await expect(page.locator('text=Student created successfully')).toBeVisible()
  await expect(page.locator('text=john.doe@example.com')).toBeVisible()
})

test('Email uniqueness is enforced', async ({ page }) => {
  // Create first student with email
  // Try to create second student with same email
  // Expect error message
})
```

---

## Implementation Stack

**Primary Technologies:**
- PostgreSQL (nullable text field with unique constraint)
- Prisma 6.14.0 (schema migration)
- Zod 4.0.14 (email validation)
- React Hook Form (form handling)

---

## Technical Details

### Data Flow
1. Admin navigates to student creation/edit form
2. Admin fills in student details including email (optional)
3. Client-side validation (Zod email format)
4. Form submits to createStudent/updateStudent server action
5. Server-side validation and email normalization (lowercase, trim)
6. Uniqueness check (global, across all schools)
7. Database insert/update with email field
8. Cache revalidation
9. UI update with new email displayed

### Security Considerations
- ✅ Email globally unique (prevents duplicate accounts)
- ✅ Email normalized (lowercase) for consistency
- ✅ Optional field (backward compatible with existing records)
- ✅ Format validation (Zod email schema)
- ✅ XSS prevention (React auto-escaping)

### Performance Considerations
- **Index on email**: Speeds up uniqueness checks
- **Nullable field**: No impact on existing records
- **Migration**: Zero downtime (adding nullable column)

---

## Development Setup

**Local Development:**
```bash
# Edit prisma schema
# Run migration
pnpm prisma migrate dev --name add_student_email_field

# Generate Prisma client
pnpm prisma generate

# Start dev server
pnpm dev
```

---

## Implementation Guide

### Setup Steps

1. **Update Prisma Schema:**
```bash
# Edit prisma/models/students.prisma
# Add: email String? @unique
# Add: @@index([email])
```

2. **Run Migration:**
```bash
pnpm prisma migrate dev --name add_student_email_field
pnpm prisma generate
```

### Implementation Steps

**Step 1: Database Schema (5 minutes)**
- [ ] Edit `prisma/models/students.prisma`
- [ ] Add `email String? @unique` field
- [ ] Add `@@index([email])` index
- [ ] Run migration: `pnpm prisma migrate dev`
- [ ] Generate client: `pnpm prisma generate`

**Step 2: Validation Schema (10 minutes)**
- [ ] Edit `src/components/platform/students/validation.ts`
- [ ] Add email field to `studentCreateSchema`
- [ ] Add email field to `studentUpdateSchema`
- [ ] Include `.email()` validation and `.optional()` modifier

**Step 3: TypeScript Types (5 minutes)**
- [ ] Edit `src/components/platform/students/types.ts`
- [ ] Add `email?: string | null` to Student interface

**Step 4: Server Actions (20 minutes)**
- [ ] Edit `src/components/platform/students/actions.ts`
- [ ] Update `createStudent`: normalize email, uniqueness check
- [ ] Update `updateStudent`: handle email updates, check uniqueness

**Step 5: Form UI (15 minutes)**
- [ ] Edit `src/components/platform/students/form.tsx`
- [ ] Add email Input field
- [ ] Add label, placeholder, error message, help text

**Step 6: Data Table Column (10 minutes)**
- [ ] Edit `src/components/platform/students/column.tsx`
- [ ] Add email column definition
- [ ] Add mailto link and empty state

**Step 7: Testing (20 minutes)**
- [ ] Unit tests for email validation
- [ ] Unit tests for createStudent/updateStudent with email
- [ ] E2E test for adding student with email
- [ ] E2E test for email uniqueness enforcement
- [ ] Manual testing

**Total Estimated Time:** 1-2 hours

### Testing Strategy

**Manual Testing:**
1. Login as admin
2. Navigate to students page
3. Click "Add Student"
4. Fill form including email
5. Submit
6. Verify email appears in table
7. Try to add another student with same email
8. Verify uniqueness error

**Automated Testing:**
```bash
# Unit tests
pnpm test src/components/platform/students

# E2E tests
pnpm test:e2e tests/e2e/student-email.spec.ts
```

### Acceptance Criteria

- [x] Email field added to Student model (nullable, unique)
- [x] Email field appears in student creation form
- [x] Email field appears in student edit form
- [x] Email format validation works (client + server)
- [x] Email uniqueness enforced globally
- [x] Email appears in student data table
- [x] Email is clickable (mailto link)
- [x] Empty email handled gracefully (null)
- [x] Email normalized (lowercase, trimmed)
- [x] Backward compatible (existing students without email work fine)
- [x] Migration runs successfully
- [x] Tests pass (95%+ coverage)
- [x] Accessible (label, help text, error messages)
- [x] i18n support (dictionary keys)

---

## Developer Resources

### File Paths Reference

**Modified Files:**
```
prisma/models/students.prisma                        # Add email field
src/components/platform/students/validation.ts       # Add email validation
src/components/platform/students/actions.ts          # Handle email in CRUD
src/components/platform/students/form.tsx            # Add email input
src/components/platform/students/column.tsx          # Add email column
src/components/platform/students/types.ts            # Add email to type
```

**Test Files:**
```
src/components/platform/students/__tests__/validation.test.ts  # Email validation tests
tests/e2e/student-email.spec.ts                                 # E2E tests
```

### Key Code Locations

**Student Management:**
- Schema: `prisma/models/students.prisma`
- Actions: `src/components/platform/students/actions.ts`
- Form: `src/components/platform/students/form.tsx`
- Columns: `src/components/platform/students/column.tsx`

---

## UX/UI Considerations

**Accessibility:**
- [x] Label associated with input (`htmlFor` + `id`)
- [x] Help text for guidance
- [x] Error messages descriptive
- [x] Keyboard accessible

**Responsive Design:**
- [x] Email input full-width on mobile
- [x] Email in table truncated on mobile if too long

**Internationalization:**
```typescript
// Dictionary keys needed
{
  students: {
    fields: {
      email: { en: "Email", ar: "البريد الإلكتروني" },
      emailPlaceholder: { en: "student@example.com", ar: "student@example.com" },
      emailHelp: {
        en: "Optional email for direct communication with student",
        ar: "بريد إلكتروني اختياري للتواصل المباشر مع الطالب"
      }
    },
    errors: {
      emailInvalid: { en: "Invalid email format", ar: "صيغة البريد الإلكتروني غير صحيحة" },
      emailExists: {
        en: "This email is already registered to another student",
        ar: "هذا البريد الإلكتروني مسجل بالفعل لطالب آخر"
      }
    }
  }
}
```

**Error States:**
- [x] Invalid email format shows inline error
- [x] Duplicate email shows error toast
- [x] Required fields enforced (givenName, surname, gender)

---

## Testing Approach

### Manual Testing Checklist

**Happy Path:**
- [x] Add student with email
- [x] Email appears in table
- [x] Email is clickable (mailto link)
- [x] Edit student email
- [x] Email updates successfully

**Edge Cases:**
- [x] Add student without email (optional)
- [x] Add student with empty string email (treated as null)
- [x] Invalid email format shows error
- [x] Duplicate email shows error
- [x] Clear email on edit (set to null)
- [x] Email case-insensitive (Test@example.com = test@example.com)

---

## Deployment Strategy

**Automatic Deployment:**
1. Merge to main branch
2. Vercel deploys automatically
3. Migration runs automatically

**Database Migration:**
- Migration is backward compatible (nullable field)
- Existing records remain valid (email = null)
- Zero downtime

**Rollback Plan:**
- If needed, can remove field with new migration
- No data loss (field is optional)

---

## Appendix

### Glossary

**Terms:**
- **Nullable Field**: Database field that allows NULL values
- **Globally Unique**: Unique across all schools, not scoped by tenant
- **Email Normalization**: Convert to lowercase and trim whitespace

### References

- [PRD FR-STU-003](/PRD.md#fr-stu-003-student-email)
- [Epic 4: Student Management](/epics.md#epic-4-student-management)
- [Story 4.1: Student Profile Management](/epics.md#story-41-student-profile-management)

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-03 | Product Team | Initial creation |

---

**Status:** Draft
**Last Updated:** 2025-01-03
