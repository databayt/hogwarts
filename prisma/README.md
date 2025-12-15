# School Database

This directory contains the multi-file Prisma schema for a multi-tenant school management SaaS platform. The schema supports multiple schools in a single database with complete data isolation.

## Architecture Overview

### Tenant Isolation Strategy

- **Row-Level Security**: Each model includes a `schoolId` field for complete data isolation
- **Shared Schema**: All schools use the same database schema
- **Domain-Based Routing**: Schools are identified by domain (e.g., `hogwarts.schoolapp.com`)

### Schema Organization

The schema is organized into logical domains for better maintainability:

#### 1. **school.prisma**

- `School` - Main tenant entity (school information, domain, subscription)
- `SchoolYear` - Academic years with start/end dates (per school)
- `Period` - Daily class periods (per school)
- `Term` - Academic terms within a school year (per school)
- `YearLevel` - Grade levels (Year 1-7) (per school)

#### 2. **staff.prisma**

- `Teacher` - Teacher information with support for multiple departments
- `Department` - Academic departments (e.g., Transfiguration, Potions)
- `TeacherDepartment` - Many-to-many relationship for teachers in departments
- `TeacherPhoneNumber` - Multiple phone numbers per teacher

#### 3. **students.prisma**

- `Student` - Student information
- `Guardian` - Guardian/parent information (can be linked to teachers)
- `GuardianType` - Types of guardians (mother, father, guardian)
- `StudentGuardian` - Student-guardian relationships
- `GuardianPhoneNumber` - Multiple phone numbers per guardian
- `StudentYearLevel` - Tracks student's grade level per school year

#### 4. **subjects.prisma**

- `Subject` - Academic subjects within departments
- `Class` - Actual class instances with teacher, time, and location
- `StudentClass` - Student enrollment in classes
- `ScoreRange` - Grade ranges (A+, A, B, etc.)

#### 5. **classrooms.prisma**

- `Classroom` - Physical classroom locations
- `ClassroomType` - Types of classrooms (regular, lab, library)

#### 6. **assessments.prisma**

- `Assignment` - Tests, quizzes, homework, projects
- `AssignmentSubmission` - Student submissions with grading

#### 7. **attendance.prisma**

- `Attendance` - Daily attendance records per class

#### 8. **auth.prisma**

- Authentication models (User, Account, tokens)
- Multi-tenant user management with school-specific isolation
- Support for Guardian login with GUARDIAN role
- Links to Student, Teacher, and Guardian models

## Authentication & Authorization

### User Roles

- **DEVELOPER**: Platform admin (no `schoolId` - can access all schools)
- **ADMIN**: School administrator
- **TEACHER**: Teaching staff
- **STUDENT**: Enrolled students
- **GUARDIAN**: Student guardians/parents (can login to view their children's progress)
- **ACCOUNTANT**: School finance/accounting staff
- **STAFF**: General school staff
- **USER**: Default role for new users

### School Model (Tenant Entity)

```typescript
model School {
  id          String  @id @default(cuid())
  name        String
  domain      String  @unique // e.g., "hogwarts"
  logoUrl     String?
  address     String?
  phoneNumber String?
  email       String?
  website     String?
  timezone    String  @default("UTC")

  // Subscription/billing
  planType    String  @default("basic")
  maxStudents Int     @default(100)
  maxTeachers Int     @default(10)
  isActive    Boolean @default(true)
}
```

### Multi-School User Management

```typescript
model User {
  schoolId String? // null for DEVELOPER role
  email    String?
  role     UserRole @default(USER)

  @@unique([email, schoolId]) // Same email can exist across schools
}
```

## Data Isolation

### Automatic Tenant Filtering

Every query must include the `schoolId` to ensure data isolation:

```typescript
// ✅ Correct - Always include schoolId
const students = await prisma.student.findMany({
  where: { schoolId: "school_123" },
})

// ❌ Wrong - Missing schoolId
const students = await prisma.student.findMany()
```

### Unique Constraints

All unique constraints include `schoolId` to allow data duplication across schools:

```typescript
// Teachers can have same email across different schools
@@unique([schoolId, emailAddress])

// Students can have same class names across schools
@@unique([schoolId, name])

// Departments can have same names across schools
@@unique([schoolId, departmentName])
```

## Application Integration

### Middleware for Tenant Context

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const subdomain = hostname.split(".")[0]

  // Find school by domain
  const school = await prisma.school.findUnique({
    where: { domain: subdomain },
  })

  if (!school) {
    return NextResponse.redirect("/school-not-found")
  }

  // Add school context to headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-school-id", school.id)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}
```

### Server Actions with Tenant Context

```typescript
// lib/tenant.ts
import { headers } from "next/headers"

export function getSchoolId(): string {
  const headersList = headers()
  const schoolId = headersList.get("x-school-id")

  if (!schoolId) {
    throw new Error("School context not found")
  }

  return schoolId
}

// actions/students.ts
export async function getStudents() {
  const schoolId = getSchoolId()

  return await prisma.student.findMany({
    where: { schoolId },
  })
}
```

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Multi-tenancy
DEFAULT_SCHOOL_DOMAIN="demo"
ALLOW_SCHOOL_SIGNUP="true"

# Features per plan
BASIC_MAX_STUDENTS=100
PREMIUM_MAX_STUDENTS=500
ENTERPRISE_MAX_STUDENTS=2000
```

### Performance Optimization

- **Database Indexes**: Add indexes on `schoolId` for all frequently queried tables
- **Connection Pooling**: Use connection pooling for better performance
- **Caching**: Implement Redis caching with school-specific keys

```sql
-- Recommended indexes
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_classes_school_id ON classes(school_id);
```

## Security Best Practices

### 1. Always Filter by School ID

```typescript
// ✅ Good
const student = await prisma.student.findUnique({
  where: {
    id: studentId,
    schoolId: userSchoolId,
  },
})

// ❌ Dangerous - can access other schools' data
const student = await prisma.student.findUnique({
  where: { id: studentId },
})
```

### 2. Validate School Access

```typescript
export async function validateSchoolAccess(
  userId: string,
  schoolId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  // DEVELOPER can access all schools
  if (user?.role === "DEVELOPER") return true

  // Others can only access their school
  return user?.schoolId === schoolId
}
```

### 3. Database-Level Constraints

```sql
-- Ensure schoolId is never null (except for DEVELOPER)
ALTER TABLE users ADD CONSTRAINT check_school_id
CHECK (role = 'DEVELOPER' OR school_id IS NOT NULL);
```

## Running Migrations & Seeds

### Initial Setup

```bash
# Generate Prisma Client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name multi-tenant-init

# Apply migrations to production
pnpm prisma migrate deploy

# Seed multiple schools
pnpm prisma db seed

# Or use specific seed types
npx ts-node prisma/generator/seed-selector.ts multi-school
npx ts-node prisma/generator/seed-selector.ts schools-only
```

### Sample Data

The seed files create three sample schools:

- **Hogwarts** (`hogwarts.schoolapp.com`)
- **Beauxbatons** (`beauxbatons.schoolapp.com`)
- **Durmstrang** (`durmstrang.schoolapp.com`)

Each school has:

- Complete academic structure (years, terms, periods)
- Departments and subjects
- Teachers with multiple phone numbers
- Students with guardian relationships
- Class enrollments and assignments
- Attendance records
- Score ranges and grading system

## Additional Resources

- [Prisma Multi-Schema Guide](https://www.prisma.io/docs/guides/schema/prisma-schema-files) - Official Prisma documentation
