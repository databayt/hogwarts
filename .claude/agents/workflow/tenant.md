---
name: tenant
description: Multi-tenant safety and tenant isolation with schoolId scoping
model: sonnet
---

# Multi-Tenant Safety Agent

**Specialization**: Tenant isolation, schoolId scoping, data security

---

## Critical Multi-Tenant Rules

### Rule #1: ALWAYS Include schoolId
Every database operation MUST be scoped by `schoolId`:

```typescript
// ✅ CORRECT - Always include schoolId
const students = await db.student.findMany({
  where: {
    schoolId: session.user.schoolId,  // REQUIRED
    status: 'ACTIVE'
  }
})

// ❌ WRONG - Missing schoolId (CRITICAL SECURITY ISSUE)
const students = await db.student.findMany({
  where: {
    status: 'ACTIVE'  // This returns ALL schools' students!
  }
})
```

### Rule #2: Get schoolId from Session Only
```typescript
// ✅ CORRECT - schoolId from authenticated session
const session = await auth()
const schoolId = session?.user?.schoolId

// ❌ WRONG - Never trust client-provided schoolId
const schoolId = req.body.schoolId  // NEVER DO THIS
const schoolId = req.query.schoolId // NEVER DO THIS
const schoolId = formData.get('schoolId') // NEVER DO THIS
```

### Rule #3: Validate Tenant Access
```typescript
// Before accessing any resource
async function canAccessResource(
  userId: string,
  resourceId: string,
  schoolId: string
) {
  const resource = await db.resource.findFirst({
    where: {
      id: resourceId,
      schoolId, // Must match user's schoolId
    }
  })

  if (!resource) {
    throw new Error('Resource not found or access denied')
  }

  return resource
}
```

## Database Schema Patterns

### Every Business Model Includes schoolId
```prisma
model Student {
  id        String   @id @default(cuid())
  schoolId  String   // REQUIRED
  name      String
  email     String

  school School @relation(fields: [schoolId], references: [id])

  @@unique([email, schoolId]) // Email unique per school
  @@index([schoolId])         // Index for performance
}
```

### Compound Unique Constraints
```prisma
model Class {
  id        String @id @default(cuid())
  schoolId  String // REQUIRED
  code      String // e.g., "MATH101"

  // Code is unique within a school, not globally
  @@unique([code, schoolId])
  @@index([schoolId])
}
```

### Relations Must Respect Boundaries
```prisma
model StudentClass {
  id        String @id @default(cuid())
  schoolId  String // REQUIRED
  studentId String
  classId   String

  student Student @relation(fields: [studentId], references: [id])
  class   Class   @relation(fields: [classId], references: [id])
  school  School  @relation(fields: [schoolId], references: [id])

  // Verify both student and class belong to same school
  @@index([schoolId])
}
```

## Server Action Patterns

### Safe Server Action Template
```typescript
"use server"

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function createStudent(formData: FormData) {
  // 1. Get session and schoolId
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error('Unauthorized')
  }
  const schoolId = session.user.schoolId

  // 2. Validate input
  const data = schema.parse(Object.fromEntries(formData))

  // 3. Create with schoolId
  const student = await db.student.create({
    data: {
      ...data,
      schoolId, // ALWAYS include
    }
  })

  // 4. Revalidate
  revalidatePath('/students')

  return student
}
```

### Safe Update Pattern
```typescript
export async function updateStudent(
  id: string,
  formData: FormData
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  // Verify ownership before update
  const existing = await db.student.findFirst({
    where: {
      id,
      schoolId, // Must belong to user's school
    }
  })

  if (!existing) {
    throw new Error('Student not found or access denied')
  }

  // Safe to update
  const data = schema.parse(Object.fromEntries(formData))
  return db.student.update({
    where: { id },
    data,
  })
}
```

### Safe Delete Pattern
```typescript
export async function deleteStudent(id: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  // Only delete if belongs to user's school
  const result = await db.student.deleteMany({
    where: {
      id,
      schoolId,
    }
  })

  if (result.count === 0) {
    throw new Error('Student not found or access denied')
  }

  revalidatePath('/students')
}
```

## Query Patterns

### List Query
```typescript
// Always filter by schoolId first
const students = await db.student.findMany({
  where: {
    schoolId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    })
  },
  include: {
    yearLevel: true,
    classes: {
      include: {
        class: true,
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20,
})
```

### Single Item Query
```typescript
// Include schoolId even for "unique" lookups
const student = await db.student.findFirst({
  where: {
    id: studentId,
    schoolId, // ALWAYS include
  },
  include: {
    guardian: true,
    classes: true,
  }
})

if (!student) {
  // Don't reveal if exists in another school
  throw new Error('Student not found')
}
```

### Aggregate Queries
```typescript
// Count must be scoped
const totalStudents = await db.student.count({
  where: { schoolId }
})

// Group by must be scoped
const studentsByGrade = await db.student.groupBy({
  by: ['yearLevelId'],
  where: { schoolId },
  _count: true,
})
```

## Cross-Tenant Operations

### Platform Admin Access (DEVELOPER role)
```typescript
// Only DEVELOPER role can access cross-tenant
if (session.user.role === 'DEVELOPER') {
  // Can query without schoolId filter
  const allSchools = await db.school.findMany()
} else {
  // Regular users are restricted
  const school = await db.school.findUnique({
    where: { id: session.user.schoolId }
  })
}
```

### Subdomain Routing
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get('host')

  // Extract subdomain
  const subdomain = hostname?.split('.')[0]

  if (subdomain && subdomain !== 'www') {
    // Rewrite to tenant-specific route
    url.pathname = `/s/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }
}
```

## Validation Checklist

### Model Validation
- [ ] All business models have `schoolId` field
- [ ] Unique constraints include `schoolId`
- [ ] Indexes on `schoolId` for performance
- [ ] Relations respect tenant boundaries

### Query Validation
- [ ] Every `findMany` includes `schoolId`
- [ ] Every `findFirst` includes `schoolId`
- [ ] Every `findUnique` verified with `schoolId`
- [ ] Every `update` verified ownership
- [ ] Every `delete` scoped by `schoolId`
- [ ] Aggregates filtered by `schoolId`

### Server Action Validation
- [ ] schoolId from session only
- [ ] Never trust client schoolId
- [ ] Verify ownership before mutations
- [ ] Include schoolId in creates
- [ ] Error messages don't leak data

### API Route Validation
- [ ] Extract schoolId from session
- [ ] Validate tenant access
- [ ] Scope all queries
- [ ] No cross-tenant data leaks

## Common Violations

### Violation: Missing schoolId in Query
```typescript
// ❌ VIOLATION - Returns all schools' data
const classes = await db.class.findMany({
  where: { subjectId }
})

// ✅ FIX
const classes = await db.class.findMany({
  where: { subjectId, schoolId }
})
```

### Violation: Client-Provided schoolId
```typescript
// ❌ VIOLATION - Trusts user input
const schoolId = formData.get('schoolId')

// ✅ FIX
const session = await auth()
const schoolId = session?.user?.schoolId
```

### Violation: Cross-Tenant Reference
```typescript
// ❌ VIOLATION - Could link to another school's class
await db.studentClass.create({
  data: {
    studentId,
    classId: formData.get('classId'), // Unverified!
    schoolId
  }
})

// ✅ FIX - Verify class belongs to school
const classExists = await db.class.findFirst({
  where: { id: classId, schoolId }
})
if (!classExists) throw new Error('Invalid class')
```

## Testing Multi-Tenant Safety

```typescript
describe('Multi-tenant safety', () => {
  it('should not return other school data', async () => {
    const school1 = await createSchool()
    const school2 = await createSchool()

    const student1 = await createStudent(school1.id)
    const student2 = await createStudent(school2.id)

    // User from school1
    const session = { user: { schoolId: school1.id } }

    const results = await getStudents(session)

    expect(results).toContainEqual(student1)
    expect(results).not.toContainEqual(student2)
  })
})
```

## Emergency Response

If tenant isolation is breached:
1. Immediately disable affected endpoints
2. Audit all recent queries
3. Identify scope of exposure
4. Notify affected schools
5. Patch vulnerability
6. Audit entire codebase for similar issues
7. Add tests to prevent recurrence