// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Student Actions - Integration Tests
 *
 * Tests multi-tenant isolation and CRUD operations against a real database.
 * Requires DATABASE_URL to point to a Neon branch (not production).
 *
 * Run with: pnpm vitest --config vitest.config.integration.mts --run
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

// Trigger safety checks (verifies DATABASE_URL, refuses production)
import "@/test/integration/setup"

import { auth } from "@/auth"
import { cleanupTestData, createTestSchool } from "@/test/integration/helpers"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createStudent,
  deleteStudent,
  getStudent,
  getStudents,
  updateStudent,
} from "../actions"

// ---------------------------------------------------------------------------
// Mocks - getTenantContext and auth need mocking since there is no HTTP
// request context in integration tests. The real Prisma client (db) is NOT
// mocked so queries hit the actual Neon branch database.
// ---------------------------------------------------------------------------

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("server-only", () => ({}))

// Mock file export utility (not relevant to integration tests)
vi.mock("@/components/file", () => ({
  arrayToCSV: vi.fn().mockReturnValue("mock,csv"),
}))

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

let schoolA: { id: string; name: string; domain: string }
let schoolB: { id: string; name: string; domain: string }

/** IDs of students created during tests, tracked for cleanup */
const createdStudentIds: string[] = []

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Configure mocks to impersonate a tenant with ADMIN role.
 */
function setTenantContext(schoolId: string) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: "test-request-id",
    role: "ADMIN",
    isPlatformAdmin: false,
  })

  vi.mocked(auth).mockResolvedValue({
    user: {
      id: "integration-test-user",
      email: "integration@test.com",
      role: "ADMIN",
      schoolId,
    },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  })
}

/**
 * Create a student via the action and track it for cleanup.
 */
async function createAndTrack(input: {
  givenName: string
  surname: string
  gender?: "male" | "female"
}) {
  const result = await createStudent({
    givenName: input.givenName,
    surname: input.surname,
    gender: input.gender ?? "male",
  })

  if (result.success && result.data?.id) {
    createdStudentIds.push(result.data.id)
  }

  return result
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Create two isolated test schools
  const [a, b] = await Promise.all([
    createTestSchool({ name: "Integration School A" }),
    createTestSchool({ name: "Integration School B" }),
  ])
  schoolA = a
  schoolB = b
}, 15_000)

afterAll(async () => {
  // Clean up any students that were created but not deleted by tests.
  // Use direct db calls to ensure cleanup even if actions have bugs.
  if (createdStudentIds.length > 0) {
    await db.student
      .deleteMany({
        where: { id: { in: createdStudentIds } },
      })
      .catch(() => {
        // Ignore errors during cleanup - some may already be deleted
      })
  }

  // Remove test schools and all cascading data
  await Promise.all([
    cleanupTestData(schoolA.id),
    cleanupTestData(schoolB.id),
  ]).catch((err) => {
    console.error("[integration cleanup] Error:", err)
  })
}, 15_000)

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// 1. MULTI-TENANT ISOLATION
// ===========================================================================

describe("Multi-tenant isolation", () => {
  let studentAId: string

  beforeAll(async () => {
    // Create a student in School A
    setTenantContext(schoolA.id)
    const result = await createAndTrack({
      givenName: "Tenant",
      surname: "Isolated",
      gender: "female",
    })

    expect(result.success).toBe(true)
    studentAId = (result as { success: true; data: { id: string } }).data.id
  })

  describe("School B cannot access School A students", () => {
    beforeEach(() => {
      setTenantContext(schoolB.id)
    })

    it("cannot read School A student via getStudent", async () => {
      const result = await getStudent({ id: studentAId })

      expect(result.success).toBe(true)
      // The query succeeds but returns null because schoolId filter excludes it
      expect(result.data).toBeNull()
    })

    it("cannot list School A students via getStudents", async () => {
      const result = await getStudents({ name: "Tenant" })

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(0)
      expect(result.data?.total).toBe(0)
    })

    it("cannot update School A student via updateStudent", async () => {
      const result = await updateStudent({
        id: studentAId,
        givenName: "Hacked",
      })

      // updateMany with schoolId scope returns success but count=0 (no rows matched)
      expect(result.success).toBe(true)

      // Verify the student was NOT modified by switching back to School A
      setTenantContext(schoolA.id)
      const verify = await getStudent({ id: studentAId })
      expect(verify.success).toBe(true)
      expect((verify.data as any)?.givenName).toBe("Tenant")
    })

    it("cannot delete School A student via deleteStudent", async () => {
      const result = await deleteStudent({ id: studentAId })

      // deleteMany with schoolId scope returns success but count=0 (no rows matched)
      expect(result.success).toBe(true)

      // Verify the student still exists by switching back to School A
      setTenantContext(schoolA.id)
      const verify = await getStudent({ id: studentAId })
      expect(verify.success).toBe(true)
      expect(verify.data).not.toBeNull()
      expect((verify.data as any)?.id).toBe(studentAId)
    })
  })

  describe("School A can access its own students", () => {
    beforeEach(() => {
      setTenantContext(schoolA.id)
    })

    it("can read its own student via getStudent", async () => {
      const result = await getStudent({ id: studentAId })

      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()
      expect((result.data as any)?.id).toBe(studentAId)
      expect((result.data as any)?.schoolId).toBe(schoolA.id)
    })

    it("can list its own students via getStudents", async () => {
      const result = await getStudents({ name: "Tenant" })

      expect(result.success).toBe(true)
      expect(result.data?.rows.length).toBeGreaterThanOrEqual(1)
      expect(result.data?.rows.some((r) => r.id === studentAId)).toBe(true)
    })
  })
})

// ===========================================================================
// 2. CRUD OPERATIONS
// ===========================================================================

describe("CRUD operations", () => {
  beforeEach(() => {
    setTenantContext(schoolA.id)
  })

  describe("createStudent", () => {
    it("persists a student in the database with correct schoolId", async () => {
      const result = await createAndTrack({
        givenName: "Create",
        surname: "Test",
        gender: "male",
      })

      expect(result.success).toBe(true)
      const id = (result as { success: true; data: { id: string } }).data.id
      expect(id).toBeTruthy()

      // Verify directly in database
      const row = await db.student.findUnique({ where: { id } })
      expect(row).not.toBeNull()
      expect(row!.givenName).toBe("Create")
      expect(row!.surname).toBe("Test")
      expect(row!.schoolId).toBe(schoolA.id)
    })

    it("returns error when schoolId is missing", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: null,
        role: null,
        isPlatformAdmin: false,
      })

      const result = await createStudent({
        givenName: "No",
        surname: "School",
        gender: "male",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("school")
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await createStudent({
        givenName: "No",
        surname: "Auth",
        gender: "male",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("authenticated")
    })
  })

  describe("updateStudent", () => {
    let studentId: string

    beforeAll(async () => {
      setTenantContext(schoolA.id)
      const result = await createAndTrack({
        givenName: "Update",
        surname: "Target",
      })
      studentId = (result as { success: true; data: { id: string } }).data.id
    })

    it("updates student fields and persists changes", async () => {
      setTenantContext(schoolA.id)
      const result = await updateStudent({
        id: studentId,
        givenName: "Updated",
        surname: "Changed",
      })

      expect(result.success).toBe(true)

      // Verify via direct DB read
      const row = await db.student.findUnique({ where: { id: studentId } })
      expect(row!.givenName).toBe("Updated")
      expect(row!.surname).toBe("Changed")
    })

    it("handles partial updates (only specified fields change)", async () => {
      setTenantContext(schoolA.id)

      // First set known state
      await updateStudent({
        id: studentId,
        givenName: "Partial",
        surname: "Before",
      })

      // Update only givenName
      const result = await updateStudent({
        id: studentId,
        givenName: "After",
      })

      expect(result.success).toBe(true)

      const row = await db.student.findUnique({ where: { id: studentId } })
      expect(row!.givenName).toBe("After")
      // surname should remain unchanged
      expect(row!.surname).toBe("Before")
    })
  })

  describe("deleteStudent", () => {
    it("removes student from the database", async () => {
      setTenantContext(schoolA.id)

      // Create a student to delete
      const createResult = await createAndTrack({
        givenName: "Delete",
        surname: "Me",
      })
      const id = (createResult as { success: true; data: { id: string } }).data
        .id

      // Delete it
      const result = await deleteStudent({ id })
      expect(result.success).toBe(true)

      // Verify it is gone
      const row = await db.student.findUnique({ where: { id } })
      expect(row).toBeNull()

      // Remove from tracking since it is already deleted
      const idx = createdStudentIds.indexOf(id)
      if (idx !== -1) createdStudentIds.splice(idx, 1)
    })

    it("succeeds silently when student does not exist (idempotent)", async () => {
      setTenantContext(schoolA.id)

      const result = await deleteStudent({ id: "nonexistent-id-12345" })

      // deleteMany returns success with count=0
      expect(result.success).toBe(true)
    })
  })

  describe("getStudent", () => {
    let studentId: string

    beforeAll(async () => {
      setTenantContext(schoolA.id)
      const result = await createAndTrack({
        givenName: "GetSingle",
        surname: "Student",
        gender: "female",
      })
      studentId = (result as { success: true; data: { id: string } }).data.id
    })

    it("retrieves a student by ID with correct fields", async () => {
      setTenantContext(schoolA.id)
      const result = await getStudent({ id: studentId })

      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()

      const student = result.data as Record<string, unknown>
      expect(student.id).toBe(studentId)
      expect(student.givenName).toBe("GetSingle")
      expect(student.surname).toBe("Student")
      expect(student.schoolId).toBe(schoolA.id)
      expect(student.createdAt).toBeDefined()
    })

    it("returns null for non-existent student", async () => {
      setTenantContext(schoolA.id)
      const result = await getStudent({ id: "nonexistent-id-99999" })

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe("getStudents (pagination and filtering)", () => {
    const batchIds: string[] = []

    beforeAll(async () => {
      setTenantContext(schoolA.id)

      // Create 5 students with distinct names for search/pagination tests
      const names = [
        { givenName: "Alpha", surname: "First" },
        { givenName: "Beta", surname: "Second" },
        { givenName: "Gamma", surname: "Third" },
        { givenName: "Delta", surname: "Fourth" },
        { givenName: "Epsilon", surname: "Fifth" },
      ]

      for (const name of names) {
        const result = await createAndTrack({ ...name, gender: "male" })
        if (result.success) {
          batchIds.push(
            (result as { success: true; data: { id: string } }).data.id
          )
        }
      }
    })

    it("returns paginated results", async () => {
      setTenantContext(schoolA.id)

      const page1 = await getStudents({ page: 1, perPage: 2 })
      expect(page1.success).toBe(true)
      expect(page1.data?.rows.length).toBeLessThanOrEqual(2)
      expect(page1.data?.total).toBeGreaterThanOrEqual(5)
    })

    it("filters by name (given name search)", async () => {
      setTenantContext(schoolA.id)

      const result = await getStudents({ name: "Alpha" })
      expect(result.success).toBe(true)
      expect(result.data?.rows.length).toBeGreaterThanOrEqual(1)
      expect(result.data?.rows.some((r) => r.name.includes("Alpha"))).toBe(true)
    })

    it("filters by name (surname search)", async () => {
      setTenantContext(schoolA.id)

      const result = await getStudents({ name: "Fifth" })
      expect(result.success).toBe(true)
      expect(result.data?.rows.length).toBeGreaterThanOrEqual(1)
      expect(result.data?.rows.some((r) => r.name.includes("Epsilon"))).toBe(
        true
      )
    })

    it("returns empty results for non-matching search", async () => {
      setTenantContext(schoolA.id)

      const result = await getStudents({ name: "ZZZNonexistent999" })
      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(0)
      expect(result.data?.total).toBe(0)
    })

    it("respects per-page limit", async () => {
      setTenantContext(schoolA.id)

      const result = await getStudents({ page: 1, perPage: 3 })
      expect(result.success).toBe(true)
      expect(result.data?.rows.length).toBeLessThanOrEqual(3)
    })
  })
})

// ===========================================================================
// 3. CROSS-SCHOOL DATA INTEGRITY
// ===========================================================================

describe("Cross-school data integrity", () => {
  it("students created in different schools are fully isolated", async () => {
    // Create a student in School A
    setTenantContext(schoolA.id)
    const resultA = await createAndTrack({
      givenName: "CrossCheck",
      surname: "SchoolA",
    })
    expect(resultA.success).toBe(true)

    // Create a student in School B
    setTenantContext(schoolB.id)
    const resultB = await createAndTrack({
      givenName: "CrossCheck",
      surname: "SchoolB",
    })
    expect(resultB.success).toBe(true)

    // School A should only see its own CrossCheck student
    setTenantContext(schoolA.id)
    const listA = await getStudents({ name: "CrossCheck" })
    expect(listA.success).toBe(true)
    expect(listA.data?.rows.every((r) => r.name.includes("SchoolA"))).toBe(true)
    expect(listA.data?.rows.some((r) => r.name.includes("SchoolB"))).toBe(false)

    // School B should only see its own CrossCheck student
    setTenantContext(schoolB.id)
    const listB = await getStudents({ name: "CrossCheck" })
    expect(listB.success).toBe(true)
    expect(listB.data?.rows.every((r) => r.name.includes("SchoolB"))).toBe(true)
    expect(listB.data?.rows.some((r) => r.name.includes("SchoolA"))).toBe(false)
  })

  it("student counts are scoped per school", async () => {
    // Get counts for each school
    setTenantContext(schoolA.id)
    const countA = await getStudents({})
    expect(countA.success).toBe(true)

    setTenantContext(schoolB.id)
    const countB = await getStudents({})
    expect(countB.success).toBe(true)

    // The totals should be independent (School A has more students from CRUD tests)
    expect(countA.data?.total).not.toBe(countB.data?.total)
  })
})

// ===========================================================================
// 4. AUTHORIZATION EDGE CASES
// ===========================================================================

describe("Authorization edge cases", () => {
  it("rejects operations when auth returns null session", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: schoolA.id,
      requestId: "test",
      role: "ADMIN",
      isPlatformAdmin: false,
    })
    vi.mocked(auth).mockResolvedValue(null)

    const createResult = await createStudent({
      givenName: "No",
      surname: "Auth",
      gender: "male",
    })
    expect(createResult.success).toBe(false)
    expect(createResult.error).toContain("authenticated")

    const getResult = await getStudent({ id: "any-id" })
    expect(getResult.success).toBe(false)
    expect(getResult.error).toContain("authenticated")

    const updateResult = await updateStudent({ id: "any-id", givenName: "X" })
    expect(updateResult.success).toBe(false)
    expect(updateResult.error).toContain("authenticated")

    const deleteResult = await deleteStudent({ id: "any-id" })
    expect(deleteResult.success).toBe(false)
    expect(deleteResult.error).toContain("authenticated")
  })

  it("rejects operations when tenant context has no schoolId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "test-user",
        email: "test@test.com",
        role: "ADMIN",
        schoolId: schoolA.id,
      },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    })
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    })

    const result = await createStudent({
      givenName: "No",
      surname: "Tenant",
      gender: "male",
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain("school")
  })
})
