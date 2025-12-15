# Multi-Tenant Validator Skill

**Purpose**: Tenant isolation verification, schoolId scoping enforcement, cross-tenant security validation for SaaS platform

## Core Multi-Tenant Principles

### 1. Database Isolation Pattern

#### Every Business Table MUST Have schoolId

```prisma
// ✅ CORRECT: All business models include schoolId
model Student {
  id        String   @id @default(cuid())
  name      String
  email     String
  schoolId  String   // REQUIRED for tenant isolation
  school    School   @relation(fields: [schoolId], references: [id])

  @@unique([email, schoolId]) // Email unique per school
  @@index([schoolId])         // Performance optimization
}

// ❌ WRONG: Missing schoolId
model Student {
  id    String @id @default(cuid())
  name  String
  email String @unique // Global uniqueness breaks multi-tenancy!
}
```

#### Unique Constraints Scoped by Tenant

```prisma
// ✅ CORRECT: Uniqueness within tenant
model Teacher {
  id           String @id @default(cuid())
  employeeId   String
  email        String
  schoolId     String

  @@unique([employeeId, schoolId]) // Employee ID unique per school
  @@unique([email, schoolId])      // Email can exist in multiple schools
  @@index([schoolId])
}
```

### 2. Query Isolation Patterns

#### EVERY Query MUST Include schoolId

```typescript
// ❌ VULNERABLE: Cross-tenant data leak
const students = await db.student.findMany()
const student = await db.student.findUnique({
  where: { id },
})

// ✅ SECURE: Tenant-isolated queries
const students = await db.student.findMany({
  where: { schoolId: session.user.schoolId },
})

const student = await db.student.findFirst({
  where: {
    id,
    schoolId: session.user.schoolId, // Always verify ownership
  },
})
```

#### Complex Query Isolation

```typescript
// ✅ CORRECT: Multi-table queries with isolation
const classWithStudents = await db.class.findFirst({
  where: {
    id: classId,
    schoolId: session.user.schoolId,
  },
  include: {
    students: {
      where: {
        schoolId: session.user.schoolId, // Verify relations too
      },
    },
    teacher: {
      where: {
        schoolId: session.user.schoolId,
      },
    },
  },
})

// Transaction with isolation
await db.$transaction(async (tx) => {
  // Verify all operations are in same tenant
  const student = await tx.student.findFirst({
    where: { id: studentId, schoolId },
  })

  if (!student) throw new Error("Student not found")

  await tx.attendance.create({
    data: {
      studentId,
      classId,
      schoolId, // Always include
      status: "PRESENT",
    },
  })
})
```

### 3. Server Action Validation

#### Pattern for All Server Actions

```typescript
"use server"

export async function createStudent(formData: FormData) {
  // 1. ALWAYS get session first
  const session = await auth()
  const schoolId = session?.user?.schoolId

  // 2. NEVER proceed without schoolId
  if (!schoolId) {
    throw new Error("School context required")
  }

  // 3. Validate input
  const validated = schema.parse(Object.fromEntries(formData))

  // 4. ALWAYS include schoolId in operations
  const student = await db.student.create({
    data: {
      ...validated,
      schoolId, // Critical: Never let client provide this
    },
  })

  // 5. Verify relationships belong to same tenant
  if (validated.classId) {
    const classExists = await db.class.findFirst({
      where: {
        id: validated.classId,
        schoolId, // Verify class is in same school
      },
    })

    if (!classExists) {
      throw new Error("Invalid class selection")
    }
  }

  revalidatePath("/students")
  return { success: true }
}
```

### 4. Relationship Validation

#### Prevent Cross-Tenant References

```typescript
// Validation helper
async function validateSameTenant(
  schoolId: string,
  entities: Array<{ table: string; id: string }>
) {
  for (const { table, id } of entities) {
    const exists = await db[table].findFirst({
      where: { id, schoolId },
    })

    if (!exists) {
      throw new Error(`Invalid ${table} reference: ${id}`)
    }
  }
}

// Usage in server action
export async function assignStudentToClass(studentId: string, classId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) throw new Error("Unauthorized")

  // Validate both entities belong to same school
  await validateSameTenant(schoolId, [
    { table: "student", id: studentId },
    { table: "class", id: classId },
  ])

  // Safe to proceed
  await db.studentClass.create({
    data: { studentId, classId, schoolId },
  })
}
```

### 5. Subdomain Routing

#### Middleware Pattern

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get("host")

  // Extract subdomain
  const subdomain = hostname?.split(".")[0]?.toLowerCase()

  // Platform routes (no subdomain)
  if (!subdomain || subdomain === "www") {
    return NextResponse.next()
  }

  // Rewrite to tenant routes
  url.pathname = `/s/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}
```

#### Getting Tenant Context

```typescript
// lib/tenant-context.ts
export async function getTenantContext() {
  const pathname = headers().get("x-pathname")
  const subdomain = pathname?.split("/")[2] // /s/[subdomain]/...

  if (!subdomain) {
    return null
  }

  // Cache school lookup
  const school = await unstable_cache(
    async () => {
      return db.school.findUnique({
        where: { subdomain },
      })
    },
    [`school-${subdomain}`],
    { revalidate: 3600 } // 1 hour cache
  )()

  return school
}
```

### 6. Session Management

#### Extended Session with schoolId

```typescript
// auth.config.ts
export const authConfig = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.schoolId = user.schoolId
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.schoolId = token.schoolId
        session.user.role = token.role
      }
      return session
    },

    async signIn({ user, account, profile }) {
      // Determine schoolId from subdomain or user selection
      const subdomain = headers().get("x-subdomain")

      if (subdomain) {
        const school = await db.school.findUnique({
          where: { subdomain },
        })

        if (school) {
          user.schoolId = school.id
        }
      }

      return true
    },
  },
}
```

### 7. API Route Protection

```typescript
// app/api/students/route.ts
export async function GET(request: NextRequest) {
  // Get tenant context
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return NextResponse.json(
      { error: "School context required" },
      { status: 401 }
    )
  }

  // All queries scoped
  const students = await db.student.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(students)
}
```

### 8. Data Migration Safety

```typescript
// Safe data migration with tenant isolation
async function migrateData() {
  // Process each school separately
  const schools = await db.school.findMany()

  for (const school of schools) {
    await db.$transaction(async (tx) => {
      // All operations scoped to single school
      const students = await tx.student.findMany({
        where: { schoolId: school.id },
      })

      // Process students for this school only
      for (const student of students) {
        await tx.student.update({
          where: {
            id: student.id,
            schoolId: school.id, // Double-check isolation
          },
          data: {
            /* updates */
          },
        })
      }
    })
  }
}
```

### 9. Testing Multi-Tenant Isolation

```typescript
describe("Multi-tenant Isolation", () => {
  const school1Id = "school-1"
  const school2Id = "school-2"

  it("should prevent cross-tenant data access", async () => {
    // Create data for school 1
    const student1 = await db.student.create({
      data: {
        name: "Student 1",
        schoolId: school1Id,
      },
    })

    // Try to access from school 2 context
    const session = { user: { schoolId: school2Id } }

    const result = await db.student.findFirst({
      where: {
        id: student1.id,
        schoolId: session.user.schoolId,
      },
    })

    expect(result).toBeNull() // Should not find
  })

  it("should enforce unique constraints per tenant", async () => {
    // Same email in different schools should work
    await db.teacher.create({
      data: {
        email: "teacher@example.com",
        schoolId: school1Id,
      },
    })

    await db.teacher.create({
      data: {
        email: "teacher@example.com",
        schoolId: school2Id,
      },
    })

    // Same email in same school should fail
    await expect(
      db.teacher.create({
        data: {
          email: "teacher@example.com",
          schoolId: school1Id,
        },
      })
    ).rejects.toThrow()
  })
})
```

## Validation Checklist

### Database Schema

- [ ] All business tables have `schoolId` field
- [ ] Unique constraints include `schoolId`
- [ ] Foreign keys don't cross tenant boundaries
- [ ] Indexes on `schoolId` for performance

### Query Patterns

- [ ] Every `findMany` includes `where: { schoolId }`
- [ ] Every `findUnique` changed to `findFirst` with schoolId
- [ ] Every `create` includes schoolId
- [ ] Every `update` verifies schoolId ownership
- [ ] Every `delete` checks schoolId

### Server Actions

- [ ] Session check at start
- [ ] schoolId extracted from session
- [ ] Never accept schoolId from client
- [ ] Relationship validation

### API Routes

- [ ] Authentication required
- [ ] schoolId from session only
- [ ] All responses filtered by tenant
- [ ] Error messages don't leak tenant info

### Frontend

- [ ] No hardcoded schoolIds
- [ ] Subdomain routing works
- [ ] Tenant context preserved

## Common Anti-Patterns to Detect

```typescript
// ❌ ANTI-PATTERN 1: Global unique constraint
model Student {
  email String @unique // Should be @@unique([email, schoolId])
}

// ❌ ANTI-PATTERN 2: Missing schoolId in query
await db.student.findMany({
  where: { yearLevel: 10 } // Missing schoolId
});

// ❌ ANTI-PATTERN 3: Client-provided schoolId
const schoolId = formData.get('schoolId'); // NEVER trust client

// ❌ ANTI-PATTERN 4: Cross-tenant JOIN without verification
await db.student.update({
  where: { id },
  data: { classId } // Not verified if class belongs to same school
});

// ❌ ANTI-PATTERN 5: Leaking tenant info in errors
throw new Error(`School ${schoolId} not found`); // Don't expose IDs
```

## Automated Validation

### Prisma Schema Validator

```typescript
// scripts/validate-multi-tenant.ts
import { readFileSync } from "fs"

function validatePrismaSchema() {
  const schema = readFileSync("prisma/schema.prisma", "utf-8")
  const models = schema.match(/model \w+ {[\s\S]*?}/g) || []

  const issues = []

  for (const model of models) {
    const modelName = model.match(/model (\w+)/)?.[1]

    // Skip auth tables
    if (["User", "Account", "Session"].includes(modelName)) continue

    // Check for schoolId
    if (!model.includes("schoolId")) {
      issues.push(`${modelName}: Missing schoolId field`)
    }

    // Check unique constraints
    if (model.includes("@unique(") && !model.includes("schoolId]")) {
      issues.push(`${modelName}: Unique constraint not scoped by schoolId`)
    }
  }

  return issues
}
```

### Runtime Validation

```typescript
// lib/multi-tenant-guard.ts
export function withTenantGuard(fn: Function) {
  return async function (...args: any[]) {
    const session = await auth()

    if (!session?.user?.schoolId) {
      throw new Error("Tenant context required")
    }

    // Log all database queries in dev
    if (process.env.NODE_ENV === "development") {
      console.log(`[TENANT: ${session.user.schoolId}]`, fn.name)
    }

    return fn(...args, session.user.schoolId)
  }
}
```

## Platform Admin Exceptions

```typescript
// Platform admins (DEVELOPER role) can access all schools
export async function getPlatformStats() {
  const session = await auth()

  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Platform admin only")
  }

  // No schoolId filter for platform admins
  return db.school.findMany({
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
        },
      },
    },
  })
}
```

## Usage

### When to Apply

- Adding new database models
- Creating server actions
- Writing API routes
- Database queries
- Reviewing PRs

### Example Commands

```bash
"Validate multi-tenant isolation in student module"
"Check tenant safety of new API endpoints"
"Review Prisma schema for multi-tenant compliance"
"Add tenant validation to exam system"
```

## References

- [Multi-tenant SaaS Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Prisma Multi-tenancy](https://www.prisma.io/docs/guides/database/multi-tenancy)
