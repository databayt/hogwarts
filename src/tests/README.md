# Hogwarts Unit Testing Guide

> Comprehensive guide to unit testing in the Hogwarts school automation platform.

**Target Coverage**: 95%+ across all features
**Framework**: Vitest 2.1.9 + React Testing Library 16.3.0
**E2E**: Playwright 1.55.0

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Configuration](#test-configuration)
3. [Core Testing Patterns](#core-testing-patterns)
   - [Server Actions Testing](#server-actions-testing)
   - [Component Testing](#component-testing)
   - [Multi-Tenant Testing](#multi-tenant-testing)
   - [Validation Schema Testing](#validation-schema-testing)
   - [Query Function Testing](#query-function-testing)
4. [Test Utilities & Setup](#test-utilities--setup)
5. [Advanced Patterns](#advanced-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Installation

All testing dependencies are already installed. To verify:

```bash
pnpm install
```

### Running Tests

```bash
# Run all tests (only configured paths)
pnpm test

# Run specific test file
pnpm test src/components/saas-dashboard/tenants/__tests__/actions.test.ts

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch

# Run E2E tests
pnpm test:e2e
pnpm test:e2e:ui       # With Playwright UI
pnpm test:e2e:debug    # Debug mode
```

### Writing Your First Test

**1. Create a test file next to your source code:**

```
src/components/platform/students/
├── actions.ts
├── actions.test.ts    ← Test file
├── content.tsx
└── validation.ts
```

**2. Write a simple test:**

```typescript
// actions.test.ts
import { createMockStudent } from "@/test/factories"
import { mockPrisma, mockTenantContext } from "@/test/mocks"
import { describe, expect, it, vi } from "vitest"

import { createStudent } from "./actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({ db: mockPrisma() }))
vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext: mockTenantContext(),
}))

describe("students/actions", () => {
  it("createStudent creates a new student record", async () => {
    // Arrange
    const mockStudent = createMockStudent({ firstName: "John" })
    const prisma = mockPrisma()
    prisma.student.create.mockResolvedValue(mockStudent)

    // Act
    const result = await createStudent({
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("2010-01-01"),
    })

    // Assert
    expect(result.success).toBe(true)
    expect(result.data).toEqual(
      expect.objectContaining({
        firstName: "John",
      })
    )
  })
})
```

**3. Run your test:**

```bash
pnpm test src/components/school-dashboard/students/actions.test.ts
```

---

## Test Configuration

### Vitest Configuration

**File**: `vitest.config.ts`

```typescript
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true, // No need to import describe, it, expect
    environment: "jsdom", // Simulates browser DOM
    setupFiles: ["./src/test/setup.ts"], // Global test setup
    include: [
      "src/**/*.test.{ts,tsx}", // Include all test files
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

### Key Configuration Options

| Option                | Value                    | Purpose                                      |
| --------------------- | ------------------------ | -------------------------------------------- |
| `globals`             | `true`                   | No need to import `describe`, `it`, `expect` |
| `environment`         | `jsdom`                  | Simulates browser DOM for component tests    |
| `setupFiles`          | `./src/test/setup.ts`    | Runs before all tests                        |
| `include`             | `src/**/*.test.{ts,tsx}` | Test file pattern                            |
| `coverage.provider`   | `v8`                     | Fast native coverage                         |
| `coverage.thresholds` | `80%`                    | Minimum coverage requirements                |

### TypeScript Configuration

Tests use the same TypeScript configuration as the main project:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This enables:

- ✅ Path aliases (`@/components/*`, `@/lib/*`)
- ✅ Strict type checking
- ✅ Full IntelliSense in tests

---

## Core Testing Patterns

### Server Actions Testing

Server actions are **the most common test type** in this project (~10 test files). They test backend mutations with multi-tenant safety.

#### Standard Pattern

```typescript
import { createMockItem } from "@/test/factories"
import { mockNextCache, mockPrisma, mockTenantContext } from "@/test/mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createItem, deleteItem, updateItem } from "./actions"

// Mock database
vi.mock("@/lib/db", () => ({ db: mockPrisma() }))

// Mock authentication/tenant context
vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext: mockTenantContext({ schoolId: "s1", role: "ADMIN" }),
}))

// Mock Next.js cache functions
vi.mock("next/cache", () => mockNextCache())

describe("items/actions", () => {
  const prisma = mockPrisma()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createItem", () => {
    it("creates a new item with tenant scoping", async () => {
      // Arrange
      const mockItem = createMockItem({ name: "Test Item", schoolId: "s1" })
      prisma.item.create.mockResolvedValue(mockItem)

      // Act
      const result = await createItem({
        name: "Test Item",
        description: "Test Description",
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(
        expect.objectContaining({
          name: "Test Item",
          schoolId: "s1", // ✅ CRITICAL: Verify tenant scoping
        })
      )

      // Verify Prisma was called correctly
      expect(prisma.item.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Item",
          schoolId: "s1", // ✅ CRITICAL: Verify schoolId in create
        }),
      })
    })

    it("returns error on database failure", async () => {
      // Arrange
      prisma.item.create.mockRejectedValue(new Error("Database error"))

      // Act
      const result = await createItem({
        name: "Test Item",
      })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain("Database error")
    })
  })

  describe("updateItem", () => {
    it("updates item with tenant isolation", async () => {
      // Arrange
      const mockItem = createMockItem({ id: "i1", schoolId: "s1" })
      prisma.item.update.mockResolvedValue(mockItem)

      // Act
      const result = await updateItem({
        id: "i1",
        name: "Updated Name",
      })

      // Assert
      expect(result.success).toBe(true)

      // ✅ CRITICAL: Verify where clause includes schoolId
      const whereClause = prisma.item.update.mock.calls[0]?.[0]?.where
      expect(whereClause).toEqual({
        id: "i1",
        schoolId: "s1", // ✅ Prevents cross-tenant updates
      })
    })
  })

  describe("deleteItem", () => {
    it("deletes item with tenant isolation", async () => {
      // Arrange
      prisma.item.delete.mockResolvedValue(createMockItem())

      // Act
      const result = await deleteItem({ id: "i1" })

      // Assert
      expect(result.success).toBe(true)

      // ✅ CRITICAL: Verify where clause includes schoolId
      const whereClause = prisma.item.delete.mock.calls[0]?.[0]?.where
      expect(whereClause?.schoolId).toBe("s1")
    })
  })
})
```

#### Real-World Example

**File**: `src/components/platform/announcements/__tests__/actions.test.ts`

```typescript
import { describe, expect, it, vi } from "vitest"

import { createAnnouncement } from "../actions"

const getTenantContext = vi.fn()
vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext,
}))

const mockCreate = vi.fn()
vi.mock("@/lib/db", () => ({
  db: {
    announcement: {
      create: mockCreate,
    },
  },
}))

describe("announcements/actions", () => {
  it("createAnnouncement creates with schoolId", async () => {
    getTenantContext.mockResolvedValue({ schoolId: "s1", role: "ADMIN" })
    mockCreate.mockResolvedValue({
      id: "a1",
      schoolId: "s1",
      title: "Test",
      content: "Content",
    })

    const res = await createAnnouncement({
      title: "Test",
      content: "Content",
    })

    expect(res).toEqual({
      success: true,
      data: expect.objectContaining({
        schoolId: "s1", // ✅ Verified
      }),
    })
  })
})
```

#### Testing Checklist: Server Actions

- ✅ Mock Prisma client with `vi.mock('@/lib/db')`
- ✅ Mock authentication/tenant context
- ✅ Mock Next.js APIs (`next/cache`, `next/headers`)
- ✅ Verify `schoolId` in all database operations (**CRITICAL**)
- ✅ Test success and error cases
- ✅ Verify return shape (`{ success, data/error }`)
- ✅ Check that `revalidatePath()` or `redirect()` is called

---

### Component Testing

Component tests verify UI rendering, user interactions, and accessibility. Currently **minimal** in the project (only 1 component test exists).

#### Standard Pattern

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { StudentCard } from './student-card'
import { createMockStudent } from '@/test/factories'

describe('StudentCard', () => {
  it('renders student information', () => {
    // Arrange
    const student = createMockStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentId: 'STU001'
    })

    // Act
    render(<StudentCard student={student} />)

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('STU001')).toBeInTheDocument()
  })

  it('handles edit button click', async () => {
    // Arrange
    const student = createMockStudent()
    const onEdit = vi.fn()
    const user = userEvent.setup()

    // Act
    render(<StudentCard student={student} onEdit={onEdit} />)
    await user.click(screen.getByRole('button', { name: /edit/i }))

    // Assert
    expect(onEdit).toHaveBeenCalledWith(student)
  })

  it('displays loading state', () => {
    // Arrange & Act
    render(<StudentCard student={null} isLoading={true} />)

    // Assert
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
  })

  it('meets accessibility standards', () => {
    // Arrange
    const student = createMockStudent()

    // Act
    const { container } = render(<StudentCard student={student} />)

    // Assert - Check ARIA attributes
    const card = container.querySelector('[role="article"]')
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Student'))
  })
})
```

#### Testing Form Components

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { StudentForm } from './student-form'

describe('StudentForm', () => {
  it('validates required fields', async () => {
    // Arrange
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    // Act
    render(<StudentForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Assert - Form validation errors appear
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid form data', async () => {
    // Arrange
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    // Act
    render(<StudentForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@test.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      })
    })
  })

  it('displays server-side errors', async () => {
    // Arrange
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(
      new Error('Email already exists')
    )

    // Act
    render(<StudentForm onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'duplicate@test.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })
})
```

#### Testing with i18n

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { mockDictionary } from '@/test/utils'
import { WelcomeMessage } from './welcome-message'

describe('WelcomeMessage', () => {
  it('renders in English', () => {
    render(<WelcomeMessage />, {
      lang: 'en',
      dictionary: {
        ...mockDictionary,
        common: { ...mockDictionary.common, welcome: 'Welcome' }
      }
    })

    expect(screen.getByText('Welcome')).toBeInTheDocument()
  })

  it('renders in Arabic with RTL', () => {
    const { container } = render(<WelcomeMessage />, {
      lang: 'ar',
      dictionary: {
        ...mockDictionary,
        common: { ...mockDictionary.common, welcome: 'مرحبا' }
      }
    })

    expect(screen.getByText('مرحبا')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('dir', 'rtl')
  })
})
```

#### Testing Data Table Columns

**⚠️ CRITICAL**: Column definitions that use hooks MUST be generated in client components, not server components.

```typescript
import { createMockStudent } from "@/test/factories"
import { render } from "@/test/utils"
import { describe, expect, it } from "vitest"

import { getColumns } from "./columns"

describe("students/columns", () => {
  it("returns correct column structure", () => {
    // Act
    const columns = getColumns()

    // Assert
    expect(columns).toHaveLength(5)
    expect(columns[0]).toMatchObject({
      accessorKey: "studentId",
      meta: { label: "Student ID" },
    })
  })

  it("includes sortable metadata", () => {
    // Act
    const columns = getColumns()

    // Assert
    const nameColumn = columns.find((col) => col.accessorKey === "name")
    expect(nameColumn?.meta?.sortable).toBe(true)
  })

  it("includes filterable metadata", () => {
    // Act
    const columns = getColumns()

    // Assert
    const statusColumn = columns.find((col) => col.accessorKey === "status")
    expect(statusColumn?.meta?.filterable).toBe(true)
    expect(statusColumn?.meta?.filterOptions).toEqual([
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ])
  })
})
```

#### Testing Checklist: Components

- ✅ Use `render` from `@/test/utils` (custom render with providers)
- ✅ Test rendering without errors
- ✅ Test user interactions with `userEvent`
- ✅ Test form validation (client-side)
- ✅ Test conditional rendering
- ✅ Test accessibility (ARIA attributes, keyboard navigation)
- ✅ Test i18n (Arabic/English, RTL/LTR)
- ✅ Test loading and error states

---

### Multi-Tenant Testing

**CRITICAL**: Multi-tenant isolation is a **security-critical** concern. Every database operation MUST verify `schoolId` scoping.

#### Standard Pattern

```typescript
import { mockPrisma, mockTenantContext } from "@/test/mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getStudents, updateStudent } from "./actions"

const getTenantContext = mockTenantContext({ schoolId: "s1", role: "ADMIN" })

vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext,
}))

const prisma = mockPrisma()
vi.mock("@/lib/db", () => ({ db: prisma }))

describe("Multi-Tenant Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getStudents", () => {
    it("scopes query by schoolId", async () => {
      // Arrange
      prisma.student.findMany.mockResolvedValue([])

      // Act
      await getStudents()

      // Assert - ✅ CRITICAL: Verify where clause
      const whereClause = prisma.student.findMany.mock.calls[0]?.[0]?.where
      expect(whereClause?.schoolId).toBe("s1")
    })

    it("prevents cross-tenant access", async () => {
      // Arrange - User belongs to school s1
      getTenantContext.mockResolvedValueOnce({ schoolId: "s1", role: "ADMIN" })
      prisma.student.findMany.mockResolvedValue([
        { id: "st1", schoolId: "s1", name: "Student 1" },
        { id: "st2", schoolId: "s1", name: "Student 2" },
      ])

      // Act
      const result = await getStudents()

      // Assert - Only s1 students returned
      expect(result.data).toHaveLength(2)
      expect(result.data?.every((s) => s.schoolId === "s1")).toBe(true)

      // ✅ CRITICAL: s2 students must NOT be accessible
      expect(result.data?.some((s) => s.schoolId === "s2")).toBe(false)
    })
  })

  describe("updateStudent", () => {
    it("scopes update by schoolId", async () => {
      // Arrange
      prisma.student.update.mockResolvedValue({
        id: "st1",
        schoolId: "s1",
        firstName: "Updated",
      })

      // Act
      await updateStudent({
        id: "st1",
        firstName: "Updated",
      })

      // Assert - ✅ CRITICAL: Verify where clause includes schoolId
      const call = prisma.student.update.mock.calls[0]?.[0]
      expect(call?.where).toEqual({
        id: "st1",
        schoolId: "s1", // ✅ Prevents cross-tenant updates
      })
    })

    it("blocks update attempts on other tenants", async () => {
      // Arrange - User belongs to s1, tries to update s2 student
      getTenantContext.mockResolvedValueOnce({ schoolId: "s1", role: "ADMIN" })
      prisma.student.update.mockRejectedValue(new Error("Record not found"))

      // Act
      const result = await updateStudent({
        id: "st-belongs-to-s2", // This student belongs to another school
        firstName: "Malicious Update",
      })

      // Assert - Operation fails
      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })
  })

  describe("Role-Based Authorization", () => {
    it("allows ADMIN role to perform actions", async () => {
      // Arrange
      getTenantContext.mockResolvedValueOnce({
        schoolId: "s1",
        role: "ADMIN",
      })
      prisma.student.create.mockResolvedValue({
        id: "st1",
        schoolId: "s1",
      })

      // Act
      const result = await createStudent({ firstName: "John" })

      // Assert
      expect(result.success).toBe(true)
    })

    it("blocks TEACHER role from admin actions", async () => {
      // Arrange
      getTenantContext.mockResolvedValueOnce({
        schoolId: "s1",
        role: "TEACHER", // Teachers cannot create students
      })

      // Act
      const result = await createStudent({ firstName: "John" })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain("Unauthorized")
    })
  })

  describe("Unique Constraints", () => {
    it("enforces uniqueness within tenant only", async () => {
      // Arrange - Two schools can have same email
      const s1Student = { id: "st1", schoolId: "s1", email: "john@test.com" }
      const s2Student = { id: "st2", schoolId: "s2", email: "john@test.com" }

      // Both should be allowed (different schools)
      prisma.student.create
        .mockResolvedValueOnce(s1Student)
        .mockResolvedValueOnce(s2Student)

      // Act
      const result1 = await createStudent({
        email: "john@test.com",
        schoolId: "s1",
      })
      const result2 = await createStudent({
        email: "john@test.com",
        schoolId: "s2",
      })

      // Assert - Both succeed
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it("prevents duplicates within same tenant", async () => {
      // Arrange - Same email in same school
      prisma.student.create.mockRejectedValue(
        new Error("Unique constraint failed")
      )

      // Act
      const result = await createStudent({
        email: "duplicate@test.com",
        schoolId: "s1",
      })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain("Unique constraint")
    })
  })
})
```

#### Real-World Example

**File**: `src/components/platform/timetable/isolation.test.ts`

```typescript
import { describe, expect, it, vi } from "vitest"

import { getWeeklyTimetable, upsertTimetableSlot } from "./actions"

const getTenantContext = vi.fn()
vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext,
}))

const timetableFindMany = vi.fn()
const timetableUpsert = vi.fn()
vi.mock("@/lib/db", () => ({
  db: { timetable: { findMany: timetableFindMany, upsert: timetableUpsert } },
}))

describe("Timetable Multi-Tenant Isolation", () => {
  it("scopes weekly timetable query by schoolId", async () => {
    getTenantContext.mockResolvedValue({ schoolId: "s1", role: "ADMIN" })
    timetableFindMany.mockResolvedValue([])

    await getWeeklyTimetable({ termId: "t1" })

    const call = timetableFindMany.mock.calls[0]?.[0]
    expect(call?.where?.schoolId).toBe("s1") // ✅ Verified
  })

  it("enforces role-based access for upsert", async () => {
    getTenantContext.mockResolvedValue({ schoolId: "s1", role: "TEACHER" })

    const result = await upsertTimetableSlot({
      /* params */
    })

    expect(result instanceof Response).toBe(true) // Blocked
  })
})
```

#### Testing Checklist: Multi-Tenant

- ✅ Verify `schoolId` in ALL `where` clauses (**SECURITY-CRITICAL**)
- ✅ Test cross-tenant access is blocked
- ✅ Verify role-based authorization per tenant
- ✅ Test unique constraints scoped by `schoolId`
- ✅ Validate audit logs include `schoolId`
- ✅ Test that queries only return data for current tenant
- ✅ Test that updates/deletes only affect current tenant

---

### Validation Schema Testing

Zod schemas enforce data validation. Test both valid and invalid inputs.

#### Standard Pattern

```typescript
import { describe, expect, it } from "vitest"

import { studentSchema } from "./validation"

describe("Student Validation Schema", () => {
  describe("Valid Inputs", () => {
    it("accepts valid student data", () => {
      // Arrange
      const validData = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: new Date("2010-01-01"),
        email: "john@test.com",
        gender: "male",
      }

      // Act & Assert
      expect(() => studentSchema.parse(validData)).not.toThrow()
    })

    it("trims whitespace from strings", () => {
      // Arrange
      const data = {
        firstName: "  John  ",
        lastName: "  Doe  ",
      }

      // Act
      const result = studentSchema.parse(data)

      // Assert
      expect(result.firstName).toBe("John")
      expect(result.lastName).toBe("Doe")
    })

    it("coerces date strings to Date objects", () => {
      // Arrange
      const data = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "2010-01-01", // String input
      }

      // Act
      const result = studentSchema.parse(data)

      // Assert
      expect(result.dateOfBirth).toBeInstanceOf(Date)
    })
  })

  describe("Invalid Inputs", () => {
    it("rejects missing required fields", () => {
      // Arrange
      const invalidData = {
        lastName: "Doe", // Missing firstName
      }

      // Act & Assert
      expect(() => studentSchema.parse(invalidData)).toThrow()
    })

    it("rejects invalid email format", () => {
      // Arrange
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
      }

      // Act & Assert
      const result = studentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"])
        expect(result.error.issues[0].message).toContain("Invalid email")
      }
    })

    it("rejects too short strings", () => {
      // Arrange
      const invalidData = {
        firstName: "J", // Too short (min 2)
        lastName: "Doe",
      }

      // Act
      const result = studentSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2")
      }
    })

    it("rejects future dates of birth", () => {
      // Arrange
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: futureDate,
      }

      // Act
      const result = studentSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("handles null vs undefined for optional fields", () => {
      // Arrange
      const data1 = { firstName: "John", lastName: "Doe", phone: null }
      const data2 = { firstName: "John", lastName: "Doe", phone: undefined }

      // Act
      const result1 = studentSchema.parse(data1)
      const result2 = studentSchema.parse(data2)

      // Assert
      expect(result1.phone).toBeNull()
      expect(result2.phone).toBeUndefined()
    })

    it("handles empty strings", () => {
      // Arrange
      const data = {
        firstName: "",
        lastName: "Doe",
      }

      // Act
      const result = studentSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })
  })
})
```

#### Real-World Example

**File**: `src/lib/typography-validator.test.ts`

```typescript
import { describe, expect, it } from "vitest"

import { validateTypography } from "./typography-validator"

describe("Typography Validator", () => {
  it("detects hardcoded text-* classes", () => {
    const html = '<div className="text-2xl font-bold">Title</div>'
    const violations = validateTypography(html)

    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({
      type: "hardcoded-typography",
      element: "div",
      classes: ["text-2xl", "font-bold"],
      suggestion: "Use <h3> instead",
    })
  })

  it("allows semantic HTML", () => {
    const html = "<h2>Title</h2><p>Paragraph</p>"
    const violations = validateTypography(html)

    expect(violations).toHaveLength(0)
  })
})
```

#### Testing Checklist: Validation

- ✅ Test all valid input combinations
- ✅ Test invalid inputs (missing, wrong type, out of range)
- ✅ Test edge cases (empty, null, undefined)
- ✅ Verify error messages are helpful
- ✅ Test string transformations (trim, lowercase, etc.)
- ✅ Test type coercion (string to date, etc.)

---

### Query Function Testing

Query functions fetch data from the database. Test that Prisma args are constructed correctly.

#### Standard Pattern

```typescript
import { describe, expect, it, vi } from "vitest"

import * as dbMod from "@/lib/db"

import { getStudents } from "./queries"

describe("Student Queries", () => {
  it("constructs correct Prisma args from filters", async () => {
    // Arrange
    const mockFindMany = vi.fn().mockResolvedValue([])
    const mockCount = vi.fn().mockResolvedValue(0)

    vi.spyOn(dbMod, "db", "get").mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      student: {
        findMany: mockFindMany,
        count: mockCount,
      },
    } as any)

    // Act
    await getStudents({
      page: 2,
      perPage: 20,
      search: "john",
      isActive: "true",
      sort: [{ id: "createdAt", desc: true }],
    })

    // Assert - Verify Prisma args
    const findManyArgs = mockFindMany.mock.calls[0]?.[0]

    expect(findManyArgs).toMatchObject({
      where: {
        schoolId: expect.any(String),
        isActive: true,
        OR: [
          { firstName: { contains: "john", mode: "insensitive" } },
          { lastName: { contains: "john", mode: "insensitive" } },
          { email: { contains: "john", mode: "insensitive" } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      skip: 20, // page 2 = skip 20
    })
  })

  it("handles multiple sort columns", async () => {
    // Arrange
    const mockFindMany = vi.fn().mockResolvedValue([])
    vi.spyOn(dbMod, "db", "get").mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      student: { findMany: mockFindMany, count: vi.fn() },
    } as any)

    // Act
    await getStudents({
      sort: [
        { id: "lastName", desc: false },
        { id: "firstName", desc: false },
      ],
    })

    // Assert
    const args = mockFindMany.mock.calls[0]?.[0]
    expect(args.orderBy).toEqual([{ lastName: "asc" }, { firstName: "asc" }])
  })

  it("includes related data when specified", async () => {
    // Arrange
    const mockFindMany = vi.fn().mockResolvedValue([])
    vi.spyOn(dbMod, "db", "get").mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      student: { findMany: mockFindMany, count: vi.fn() },
    } as any)

    // Act
    await getStudents({ includeUser: true })

    // Assert
    const args = mockFindMany.mock.calls[0]?.[0]
    expect(args.include).toEqual({
      user: true,
      yearLevel: true,
    })
  })
})
```

#### Testing Checklist: Queries

- ✅ Verify `where` clause construction
- ✅ Verify `orderBy` from sort params
- ✅ Verify pagination (`take`, `skip`)
- ✅ Verify search filters (contains, OR)
- ✅ Verify `include` for related data
- ✅ Verify `select` for specific fields

---

## Test Utilities & Setup

### Global Setup

**File**: `src/test/setup.ts`

Runs automatically before all tests:

```typescript
import { cleanup } from "@testing-library/react"
import { afterEach, expect, vi } from "vitest"

afterEach(() => {
  cleanup() // Unmount React components
  vi.clearAllMocks() // Clear all mocks
})
```

### Custom Render

**File**: `src/test/utils.tsx`

Provides custom render with common providers:

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { customRender } from '@/test/utils'

// Use custom render with providers
customRender(<MyComponent />, {
  lang: 'ar',
  dictionary: myDictionary
})

// Or import as default
import { render } from '@/test/utils'  // Uses custom render
```

### Reusable Mocks

**File**: `src/test/mocks/index.ts`

Pre-configured mocks for common dependencies:

```typescript
import {
  mockNextCache,
  mockNextCookies,
  mockNextHeaders,
  mockPrisma,
  mockSession,
  mockTenantContext,
  setupNextMocks,
} from "@/test/mocks"

// Mock Prisma
vi.mock("@/lib/db", () => ({ db: mockPrisma() }))

// Mock authentication
vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue(mockSession()) }))

// Mock tenant context
vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext: mockTenantContext({ schoolId: "s1" }),
}))

// Mock all Next.js APIs at once
setupNextMocks()
```

### Test Data Factories

**File**: `src/test/factories/index.ts`

Create consistent test data:

```typescript
import {
  createBatch,
  createMockClass,
  createMockSchool,
  createMockStudent,
  createMockTeacher,
  createMockUser,
  createSchoolWithEntities,
} from "@/test/factories"

// Single entity
const school = createMockSchool({ name: "My School" })
const student = createMockStudent({ schoolId: school.id })

// Batch creation
const students = createBatch(createMockStudent, 20, { schoolId: "s1" })

// Related entities
const { school, admin, teachers, students } = createSchoolWithEntities({
  teacherCount: 5,
  studentCount: 20,
})
```

---

## Advanced Patterns

### Integration Testing

Integration tests verify multiple components/layers working together.

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { StudentListPage } from './page'
import { createMockStudent } from '@/test/factories'

describe('Student List Integration', () => {
  it('fetches and displays students', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        students: [
          createMockStudent({ firstName: 'John' }),
          createMockStudent({ firstName: 'Jane' })
        ],
        total: 2
      })
    })

    // Act
    render(<StudentListPage />)

    // Assert - Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })
  })

  it('handles search and pagination', async () => {
    // Arrange
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ students: [], total: 0 })
    })

    // Act
    render(<StudentListPage />)
    await user.type(screen.getByPlaceholderText(/search/i), 'john')
    await user.click(screen.getByRole('button', { name: /next page/i }))

    // Assert - Verify API calls
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=john&page=2')
    )
  })
})
```

### Testing with Transactions

```typescript
import { mockPrisma } from "@/test/mocks"
import { describe, expect, it, vi } from "vitest"

import { enrollStudent } from "./actions"

describe("Transaction Tests", () => {
  it("enrolls student with transaction", async () => {
    // Arrange
    const prisma = mockPrisma()
    vi.mock("@/lib/db", () => ({ db: prisma }))

    const transactionMock = vi.fn().mockImplementation(async (callback) => {
      const txClient = {
        student: {
          update: vi.fn().mockResolvedValue({ id: "st1", isEnrolled: true }),
        },
        class: {
          update: vi.fn().mockResolvedValue({ id: "c1", studentCount: 21 }),
        },
      }
      return callback(txClient)
    })

    prisma.$transaction = transactionMock

    // Act
    const result = await enrollStudent({
      studentId: "st1",
      classId: "c1",
    })

    // Assert
    expect(result.success).toBe(true)
    expect(transactionMock).toHaveBeenCalled()
  })

  it("rolls back transaction on error", async () => {
    // Arrange
    const prisma = mockPrisma()
    prisma.$transaction.mockRejectedValue(new Error("Transaction failed"))

    // Act
    const result = await enrollStudent({
      studentId: "st1",
      classId: "c1",
    })

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toContain("Transaction failed")
  })
})
```

### Testing with File Uploads

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { FileUploadForm } from './file-upload-form'

describe('File Upload Tests', () => {
  it('uploads file successfully', async () => {
    // Arrange
    const user = userEvent.setup()
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const onUpload = vi.fn()

    // Act
    render(<FileUploadForm onUpload={onUpload} />)
    const input = screen.getByLabelText(/choose file/i)
    await user.upload(input, file)

    // Assert
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test.pdf',
        type: 'application/pdf'
      }))
    })
  })

  it('validates file size', async () => {
    // Arrange
    const user = userEvent.setup()
    const largeFile = new File(
      [new ArrayBuffer(10 * 1024 * 1024)],  // 10MB
      'large.pdf',
      { type: 'application/pdf' }
    )

    // Act
    render(<FileUploadForm maxSize={5 * 1024 * 1024} />)  // Max 5MB
    await user.upload(screen.getByLabelText(/choose file/i), largeFile)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })
  })
})
```

### E2E Testing with Playwright

**File**: `e2e/auth.spec.ts`

```typescript
import { expect, test } from "@playwright/test"

test.describe("Authentication", () => {
  test("user can login", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login")

    // Fill in credentials
    await page.fill('[name="email"]', "admin@test.com")
    await page.fill('[name="password"]', "password123")

    // Submit form
    await page.click('button[type="submit"]')

    // Verify redirect to lab
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText("Welcome back")).toBeVisible()
  })

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login")

    await page.fill('[name="email"]', "wrong@test.com")
    await page.fill('[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })
})
```

---

## Best Practices

### Test Organization

```
src/components/platform/students/
├── actions.ts
├── actions.test.ts           ← Colocate with source
├── content.tsx
├── content.test.tsx           ← Colocate with source
├── validation.ts
├── validation.test.ts         ← Colocate with source
└── __tests__/                 ← Alternative: dedicated directory
    ├── actions.test.ts
    ├── content.test.ts
    └── validation.test.ts
```

**Recommendation**: Use `__tests__/` directory for complex features with many test files.

### Test Naming

**Pattern**: `describe('module/feature') → it('does something')`

```typescript
describe("students/actions", () => {
  describe("createStudent", () => {
    it("creates a new student with tenant scoping", async () => {})
    it("validates required fields", async () => {})
    it("returns error on database failure", async () => {})
  })
})
```

**Guidelines**:

- Use clear, descriptive names
- Start with action verb: "creates", "validates", "returns"
- Include context: "with tenant scoping", "on database failure"
- Avoid technical jargon in descriptions

### Arrange-Act-Assert Pattern

```typescript
it("test name", async () => {
  // Arrange - Set up test data and mocks
  const student = createMockStudent()
  const prisma = mockPrisma()
  prisma.student.create.mockResolvedValue(student)

  // Act - Execute the code under test
  const result = await createStudent({ firstName: "John" })

  // Assert - Verify the results
  expect(result.success).toBe(true)
  expect(result.data).toEqual(expect.objectContaining({ firstName: "John" }))
})
```

### DRY Principle with beforeEach

```typescript
describe("students/actions", () => {
  let prisma: ReturnType<typeof mockPrisma>

  beforeEach(() => {
    prisma = mockPrisma()
    vi.mock("@/lib/db", () => ({ db: prisma }))
    vi.clearAllMocks()
  })

  it("test 1", async () => {
    prisma.student.create.mockResolvedValue(createMockStudent())
    // ...
  })

  it("test 2", async () => {
    prisma.student.update.mockResolvedValue(createMockStudent())
    // ...
  })
})
```

### Avoid Test Interdependence

**❌ Bad**: Tests depend on order

```typescript
let studentId: string

it("creates student", async () => {
  const result = await createStudent({ firstName: "John" })
  studentId = result.data.id // Shared state
})

it("updates student", async () => {
  await updateStudent({ id: studentId, firstName: "Jane" }) // Depends on previous test
})
```

**✅ Good**: Tests are independent

```typescript
it("creates student", async () => {
  const result = await createStudent({ firstName: "John" })
  expect(result.success).toBe(true)
})

it("updates student", async () => {
  const student = createMockStudent({ id: "st1" }) // Fresh data
  const result = await updateStudent({ id: "st1", firstName: "Jane" })
  expect(result.success).toBe(true)
})
```

### Test One Thing at a Time

**❌ Bad**: Testing multiple things

```typescript
it("creates student and sends email and logs event", async () => {
  const result = await createStudent({ firstName: "John" })
  expect(result.success).toBe(true)
  expect(emailService.send).toHaveBeenCalled()
  expect(auditLog.create).toHaveBeenCalled()
})
```

**✅ Good**: Separate tests

```typescript
it("creates student successfully", async () => {
  const result = await createStudent({ firstName: "John" })
  expect(result.success).toBe(true)
})

it("sends welcome email after creation", async () => {
  await createStudent({ firstName: "John" })
  expect(emailService.send).toHaveBeenCalledWith(
    expect.objectContaining({ subject: "Welcome" })
  )
})

it("logs creation event to audit log", async () => {
  await createStudent({ firstName: "John" })
  expect(auditLog.create).toHaveBeenCalledWith(
    expect.objectContaining({ action: "student.created" })
  )
})
```

### Coverage Targets

| Code Type            | Target | Priority          |
| -------------------- | ------ | ----------------- |
| Server actions       | 95%+   | Critical          |
| Business logic       | 95%+   | Critical          |
| Multi-tenant queries | 100%   | Security-Critical |
| UI components        | 80%+   | High              |
| Validation schemas   | 90%+   | High              |
| Utility functions    | 90%+   | Medium            |
| Types/interfaces     | N/A    | -                 |

**Philosophy**: Focus on **behavior**, not implementation. Aim for 95%+ overall coverage.

---

## Troubleshooting

### Common Errors

#### Error: "Cannot find module '@/...'"

**Cause**: Path aliases not resolved

**Solution**: Ensure `vite-tsconfig-paths` is in `vitest.config.ts`:

```typescript
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // ...
})
```

#### Error: "ReferenceError: describe is not defined"

**Cause**: `globals: true` not set

**Solution**: Add to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true, // ← Add this
  },
})
```

#### Error: "Cannot access 'db' before initialization"

**Cause**: Mock order issue

**Solution**: Define mocks before imports:

```typescript
// ❌ Wrong order
import { createStudent, createStudent } from "./actions" // After mock

// ✅ Correct order
vi.mock("@/lib/db", () => ({ db: mockPrisma() }))

// Before mock
vi.mock("@/lib/db", () => ({ db: mockPrisma() }))
```

#### Error: "TypeError: Cannot read property 'mockResolvedValue' of undefined"

**Cause**: Mock not properly initialized

**Solution**: Use factory functions:

```typescript
// ❌ Wrong
const prisma = mockPrisma()
vi.mock("@/lib/db", () => ({ db: prisma })) // prisma not yet available

// ✅ Correct
vi.mock("@/lib/db", () => ({ db: mockPrisma() })) // Factory function
```

#### Warning: "Warning: An update to Component inside a test was not wrapped in act(...)"

**Cause**: Async state updates not awaited

**Solution**: Use `waitFor`:

```typescript
import { waitFor } from '@/test/utils'

it('updates component', async () => {
  render(<MyComponent />)

  // Wait for async updates
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

#### Error: "Error: Could not find router"

**Cause**: Next.js router not mocked in client component test

**Solution**: Mock `useRouter`:

```typescript
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))
```

### Debugging Tests

#### Enable Verbose Output

```bash
pnpm test --reporter=verbose
```

#### Debug Single Test

```typescript
it.only("debugs this test", () => {
  // ← .only
  // ...
})
```

#### Inspect Rendered Output

```typescript
import { screen, debug } from '@/test/utils'

it('debugs render', () => {
  render(<MyComponent />)
  screen.debug()  // Prints DOM to console
})
```

#### Use VS Code Debugger

1. Add breakpoint in test file
2. Run "Debug Test at Cursor" in VS Code
3. Step through code

#### Check Mock Calls

```typescript
it("debugs mock calls", () => {
  const mockFn = vi.fn()
  mockFn({ foo: "bar" })

  console.log(mockFn.mock.calls) // [[ { foo: 'bar' } ]]
  console.log(mockFn.mock.calls[0][0]) // { foo: 'bar' }
})
```

---

## CI/CD Integration

### GitHub Actions

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true
```

### Coverage Reporting

**Codecov**: Upload coverage reports

```bash
# Local coverage
pnpm test --coverage

# View in browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

**Coverage Badge** (README.md):

```markdown
[![Coverage](https://codecov.io/gh/username/hogwarts/branch/main/graph/badge.svg)](https://codecov.io/gh/username/hogwarts)
```

### Pre-Commit Hook

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
pnpm test --run
```

---

## Summary

### Key Takeaways

1. **Multi-Tenant Testing is Critical**: ALWAYS verify `schoolId` in database operations
2. **Use Test Utilities**: Reduce boilerplate with `@/test/mocks` and `@/test/factories`
3. **Target 95%+ Coverage**: Focus on server actions and business logic first
4. **Colocate Tests**: Keep tests next to source code for better maintainability
5. **Test Behavior, Not Implementation**: Focus on what code does, not how

### Quick Reference Card

| Task              | Command                     |
| ----------------- | --------------------------- |
| Run all tests     | `pnpm test`                 |
| Run specific test | `pnpm test path/to/test.ts` |
| Run with coverage | `pnpm test --coverage`      |
| Run in watch mode | `pnpm test --watch`         |
| Run E2E tests     | `pnpm test:e2e`             |
| Debug test        | Add `it.only()`             |

### Next Steps

1. ✅ Read this guide
2. ⬜ Write tests for critical server actions
3. ⬜ Achieve 80%+ coverage on your feature
4. ⬜ Add E2E tests for critical flows
5. ⬜ Set up CI/CD with coverage reporting

### Resources

- **Vitest Docs**: https://vitest.dev
- **React Testing Library**: https://testing-library.com/react
- **Playwright Docs**: https://playwright.dev
- **Example Tests**: `src/components/operator/tenants/__tests__/`
- **Geo Testing Guide**: `src/components/platform/attendance/geofence/TESTING.md`

---

**Questions?** Open an issue or ask in the team chat.

**Found a bug in this guide?** Submit a PR to improve it!

**Version**: 1.0.0 | **Last Updated**: 2025-01-05
