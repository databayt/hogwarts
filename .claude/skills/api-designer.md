# API Designer Skill

**Purpose**: RESTful patterns, server action best practices, API route design, and Zod validation for Next.js App Router

## Core Principles

### 1. Server Actions Best Practices

#### Pattern Structure

```typescript
// actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"

// 1. Define validation schema
const createSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  schoolId: z.string().uuid(),
})

// 2. Type-safe server action
export async function createItem(formData: FormData) {
  // Authentication check
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Unauthorized")
  }

  // Parse and validate
  const raw = Object.fromEntries(formData)
  const validated = createSchema.parse(raw)

  // Multi-tenant scope
  const data = {
    ...validated,
    schoolId: session.user.schoolId, // Always include
  }

  try {
    // Database operation
    const result = await db.item.create({ data })

    // Revalidate cache
    revalidatePath("/items")

    // Return success
    return { success: true, data: result }
  } catch (error) {
    // Error handling
    return {
      success: false,
      error: "Failed to create item",
    }
  }
}
```

#### Server Action Patterns

**CRUD Operations**

```typescript
// CREATE
export async function createStudent(formData: FormData) {
  // Validate → Create → Revalidate → Return
}

// READ (typically in RSC, not action)
export async function getStudents(params: GetStudentsParams) {
  // Validate params → Query with schoolId → Return
}

// UPDATE
export async function updateStudent(id: string, formData: FormData) {
  // Validate → Check ownership → Update → Revalidate → Return
}

// DELETE
export async function deleteStudent(id: string) {
  // Check permissions → Soft delete → Revalidate → Return
}

// BULK
export async function bulkUpdateStudents(
  ids: string[],
  data: Partial<Student>
) {
  // Validate → Transaction → Revalidate → Return
}
```

### 2. API Route Design (App Router)

#### Route Structure

```typescript
// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"

// GET /api/students
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")

  const students = await db.student.findMany({
    where: { schoolId: session.user.schoolId },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    data: students,
    meta: {
      page,
      limit,
      total: await db.student.count({
        where: { schoolId: session.user.schoolId },
      }),
    },
  })
}

// POST /api/students
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  // Validate request body
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    yearLevel: z.number().min(1).max(12),
  })

  try {
    const validated = schema.parse(body)

    const student = await db.student.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
      },
    })

    return NextResponse.json({ data: student }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### 3. RESTful Design Patterns

#### Resource Naming

```typescript
// Good: Plural nouns, kebab-case
;/api/denssttu / api / student -
  grades / api / attendance -
  records /
    // Bad: Verbs, camelCase, singular
    api /
    getStudent / // ❌ Verb
    api /
    studentGrades / // ❌ camelCase
    api /
    student // ❌ Singular
```

#### HTTP Methods

```typescript
// GET: Read operations
GET /api/students          // List
GET /api/students/:id      // Single

// POST: Create operations
POST /api/students         // Create new

// PUT/PATCH: Update operations
PUT /api/students/:id      // Full update
PATCH /api/students/:id    // Partial update

// DELETE: Delete operations
DELETE /api/students/:id   // Delete
```

#### Status Codes

```typescript
// Success
200 OK                     // GET, PUT, PATCH success
201 Created               // POST success
204 No Content            // DELETE success

// Client Errors
400 Bad Request           // Validation errors
401 Unauthorized          // No auth
403 Forbidden            // No permission
404 Not Found            // Resource not found
409 Conflict             // Duplicate resource
422 Unprocessable        // Business logic error

// Server Errors
500 Internal Server Error // Unexpected error
503 Service Unavailable  // Maintenance mode
```

### 4. Validation Patterns

#### Zod Schema Composition

```typescript
// Base schemas
const idSchema = z.string().uuid()
const emailSchema = z.string().email().toLowerCase()
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/)

// Composed schemas
const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  yearLevel: z.number().int().min(1).max(12),
  guardianIds: z.array(idSchema).min(1).max(2),
})

const updateStudentSchema = createStudentSchema.partial()

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
})
```

#### Validation Helpers

```typescript
// Validate with error handling
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error }
}

// Type-safe params
export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams)
  return schema.parse(params)
}
```

### 5. Error Handling

#### Consistent Error Response

```typescript
interface ApiError {
  error: string
  message: string
  details?: any
  timestamp: string
  path: string
}

export function createErrorResponse(
  error: string,
  message: string,
  status: number,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}
```

#### Error Classes

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
  }
}

export class ValidationError extends ApiError {
  constructor(errors: z.ZodError) {
    super(400, "Validation failed", errors.flatten())
  }
}

export class AuthorizationError extends ApiError {
  constructor(resource?: string) {
    super(403, `Not authorized to access ${resource || "resource"}`)
  }
}
```

### 6. Pagination Patterns

```typescript
interface PaginationParams {
  page: number
  limit: number
  cursor?: string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  links?: {
    self: string
    next?: string
    prev?: string
    first: string
    last: string
  }
}

export async function paginate<T>(
  query: any,
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  const { page, limit } = params
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    query.skip(skip).take(limit),
    query.count(),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
```

### 7. Multi-Tenant API Patterns

```typescript
// Tenant middleware
export async function withTenant<T>(
  handler: (schoolId: string) => Promise<T>
): Promise<T> {
  const session = await auth()

  if (!session?.user?.schoolId) {
    throw new AuthorizationError("School context required")
  }

  return handler(session.user.schoolId)
}

// Usage
export async function GET(request: NextRequest) {
  return withTenant(async (schoolId) => {
    const data = await db.student.findMany({
      where: { schoolId },
    })
    return NextResponse.json(data)
  })
}
```

### 8. Caching Strategies

```typescript
// Revalidation
import { unstable_cache } from "next/cache"

// Cache headers
export async function GET(request: NextRequest) {
  const data = await fetchData()

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  })
}

const getCachedStudents = unstable_cache(
  async (schoolId: string) => {
    return db.student.findMany({ where: { schoolId } })
  },
  ["students"],
  { revalidate: 60 } // 60 seconds
)
```

### 9. Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  // Process request
}
```

### 10. API Documentation

```typescript
/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: List students
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 */
```

## Hogwarts-Specific Patterns

### School API Endpoints

```typescript
// Multi-tenant aware endpoints
/api/schools/:subdomain/students
/api/schools/:subdomain/teachers
/api/schools/:subdomain/courses

// Admin endpoints (platform level)
/api/admin/schools
/api/admin/subscriptions
/api/admin/analytics
```

### Webhook Handling

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )

  // Process event
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data)
      break
  }

  return NextResponse.json({ received: true })
}
```

## Usage Examples

### When to Apply

- Designing new API endpoints
- Refactoring existing APIs
- Adding server actions
- Implementing webhooks
- Setting up authentication

### Example Commands

```bash
"Design API for student enrollment using api-designer"
"Apply RESTful patterns to exam module"
"Create server actions for attendance tracking"
"Design webhook handler for payment processing"
```

## References

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/api-routes)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [REST API Design](https://restfulapi.net/)
- [Zod Documentation](https://zod.dev/)
