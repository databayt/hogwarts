// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  bulkEnrollStudents,
  getSchoolEnrollments,
} from "@/components/stream/settings/enrollments/actions"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    enrollment: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    subject: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockEnrollFindMany = db.enrollment.findMany as ReturnType<typeof vi.fn>
const mockEnrollCreate = db.enrollment.createMany as ReturnType<typeof vi.fn>
const mockSubjectFind = db.subject.findUnique as ReturnType<typeof vi.fn>
const mockUserFindMany = db.user.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockEnrollFindMany.mockResolvedValue([])
  mockEnrollCreate.mockResolvedValue({ count: 0 })
  mockSubjectFind.mockResolvedValue({ id: "subj-1", name: "Math" })
  // Default: every requested userId belongs to the current school (the
  // membership filter is a pass-through). Tests that exercise the
  // cross-tenant guard override this to return a subset.
  mockUserFindMany.mockImplementation(async (args: any) =>
    (args.where.id.in as string[]).map((id) => ({ id }))
  )
})

describe("getSchoolEnrollments — auth/tenant", () => {
  it("returns [] without session", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getSchoolEnrollments()
    expect(result).toEqual([])
    expect(mockEnrollFindMany).not.toHaveBeenCalled()
  })

  it("returns [] without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getSchoolEnrollments()
    expect(result).toEqual([])
  })

  it.each(["TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await getSchoolEnrollments()
      expect(result).toEqual([])
      expect(mockEnrollFindMany).not.toHaveBeenCalled()
    }
  )

  it("permits ADMIN", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    await getSchoolEnrollments()
    expect(mockEnrollFindMany).toHaveBeenCalledOnce()
  })

  it("permits DEVELOPER", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "DEVELOPER" } })
    await getSchoolEnrollments()
    expect(mockEnrollFindMany).toHaveBeenCalledOnce()
  })
})

describe("getSchoolEnrollments — query", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "u-1", role: "ADMIN" } })
  })

  it("scopes findMany by current schoolId", async () => {
    await getSchoolEnrollments()
    expect(mockEnrollFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: "school-1" } })
    )
  })

  it("only counts COMPLETED progress entries (not in-flight)", async () => {
    await getSchoolEnrollments()
    const call = mockEnrollFindMany.mock.calls[0][0] as {
      include: { progress: { where: { isCompleted: boolean } } }
    }
    expect(call.include.progress.where.isCompleted).toBe(true)
  })

  it("flattens user/subject and counts completed lessons", async () => {
    mockEnrollFindMany.mockResolvedValueOnce([
      {
        id: "e-1",
        isActive: true,
        status: "ACTIVE",
        createdAt: new Date(),
        user: { username: "harry", email: "h@x.com" },
        subject: { name: "Math", slug: "math" },
        progress: [{ id: "p1" }, { id: "p2" }],
      },
    ])
    const result = await getSchoolEnrollments()
    expect(result).toEqual([
      expect.objectContaining({
        id: "e-1",
        studentName: "harry",
        studentEmail: "h@x.com",
        name: "Math",
        subjectSlug: "math",
        completedLessons: 2,
      }),
    ])
  })
})

describe("bulkEnrollStudents — auth/tenant", () => {
  const input = { catalogSubjectId: "subj-1", userIds: ["u-1", "u-2"] }

  it("returns failure without session", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await bulkEnrollStudents(input)
    expect(result.success).toBe(false)
    expect(mockEnrollCreate).not.toHaveBeenCalled()
  })

  it("returns failure without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await bulkEnrollStudents(input)
    expect(result.success).toBe(false)
  })

  it.each(["TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await bulkEnrollStudents(input)
      expect(result.success).toBe(false)
      expect(mockEnrollCreate).not.toHaveBeenCalled()
    }
  )
})

describe("bulkEnrollStudents — flow", () => {
  const input = { catalogSubjectId: "subj-1", userIds: ["u-1", "u-2", "u-3"] }

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
  })

  it("returns failure when subject missing", async () => {
    mockSubjectFind.mockResolvedValueOnce(null)
    const result = await bulkEnrollStudents(input)
    expect(result.success).toBe(false)
    expect(result.enrolled).toBe(0)
    expect(mockEnrollCreate).not.toHaveBeenCalled()
  })

  it("scopes existing-enrollment lookup by current schoolId", async () => {
    await bulkEnrollStudents(input)
    expect(mockEnrollFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: "school-1" }),
      })
    )
  })

  it("skips users who are already enrolled", async () => {
    mockEnrollFindMany.mockResolvedValueOnce([{ userId: "u-1" }])
    await bulkEnrollStudents(input)
    expect(mockEnrollCreate).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: "u-2" }),
        expect.objectContaining({ userId: "u-3" }),
      ],
    })
  })

  it("returns success with 0 enrolled when all are duplicates", async () => {
    mockEnrollFindMany.mockResolvedValueOnce([
      { userId: "u-1" },
      { userId: "u-2" },
      { userId: "u-3" },
    ])
    const result = await bulkEnrollStudents(input)
    expect(result.success).toBe(true)
    expect(result.enrolled).toBe(0)
    expect(mockEnrollCreate).not.toHaveBeenCalled()
  })

  it("writes schoolId + ACTIVE status on every new enrollment", async () => {
    await bulkEnrollStudents(input)
    const dataArr = (mockEnrollCreate.mock.calls[0][0] as { data: unknown[] })
      .data
    for (const row of dataArr) {
      expect(row).toEqual(
        expect.objectContaining({
          schoolId: "school-1",
          isActive: true,
          status: "ACTIVE",
          catalogSubjectId: "subj-1",
        })
      )
    }
  })

  it("returns success + count on full-enrollment path", async () => {
    const result = await bulkEnrollStudents(input)
    expect(result.success).toBe(true)
    expect(result.enrolled).toBe(3)
  })
})

describe("bulkEnrollStudents — tenant safety", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
  })

  it("drops userIds that do not belong to the current school (cross-tenant guard)", async () => {
    // Caller asks to enroll three ids, but only u-1 is a member of school-1.
    // u-2 (foreign school) and u-9 (nonexistent) must be filtered out.
    mockUserFindMany.mockResolvedValueOnce([{ id: "u-1" }])

    const result = await bulkEnrollStudents({
      catalogSubjectId: "subj-1",
      userIds: ["u-1", "u-2", "u-9"],
    })

    // user.findMany must be scoped by the current school.
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: "school-1" }),
      })
    )
    // Only the validated member is enrolled.
    expect(result.enrolled).toBe(1)
    expect(mockEnrollCreate).toHaveBeenCalledWith({
      data: [expect.objectContaining({ userId: "u-1" })],
    })
    // The foreign ids never reach createMany.
    const created = (mockEnrollCreate.mock.calls[0][0] as { data: any[] }).data
    expect(created.map((r) => r.userId)).not.toContain("u-2")
    expect(created.map((r) => r.userId)).not.toContain("u-9")
  })

  it("fails cleanly when none of the userIds belong to the school", async () => {
    mockUserFindMany.mockResolvedValueOnce([])

    const result = await bulkEnrollStudents({
      catalogSubjectId: "subj-1",
      userIds: ["foreign-1", "foreign-2"],
    })

    expect(result.success).toBe(false)
    expect(result.enrolled).toBe(0)
    expect(mockEnrollCreate).not.toHaveBeenCalled()
  })

  it("rejects an empty userIds array via Zod", async () => {
    const result = await bulkEnrollStudents({
      catalogSubjectId: "subj-1",
      userIds: [],
    })

    expect(result.success).toBe(false)
    expect(mockUserFindMany).not.toHaveBeenCalled()
    expect(mockEnrollCreate).not.toHaveBeenCalled()
  })
})
