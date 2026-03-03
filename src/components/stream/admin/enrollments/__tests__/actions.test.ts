// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { bulkEnrollStudents } from "../actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-123", role: "ADMIN" },
  }),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogSubject: {
      findUnique: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const mockGetTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindSubject = db.catalogSubject.findUnique as ReturnType<typeof vi.fn>
const mockFindEnrollments = db.enrollment.findMany as ReturnType<typeof vi.fn>
const mockCreateMany = db.enrollment.createMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetTenant.mockResolvedValue({ schoolId: "school-123", subdomain: "demo" })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("bulkEnrollStudents", () => {
  it("includes schoolId in enrollment dedup query", async () => {
    mockFindSubject.mockResolvedValue({ id: "subj-1", name: "Math" })
    mockFindEnrollments.mockResolvedValue([{ userId: "student-1" }])
    mockCreateMany.mockResolvedValue({ count: 1 })

    await bulkEnrollStudents({
      catalogSubjectId: "subj-1",
      userIds: ["student-1", "student-2"],
    })

    expect(mockFindEnrollments).toHaveBeenCalledWith({
      where: {
        catalogSubjectId: "subj-1",
        userId: { in: ["student-1", "student-2"] },
        schoolId: "school-123",
      },
      select: { userId: true },
    })
  })

  it("enrolls students not yet enrolled in current school", async () => {
    mockFindSubject.mockResolvedValue({ id: "subj-1", name: "Math" })
    mockFindEnrollments.mockResolvedValue([{ userId: "student-1" }])
    mockCreateMany.mockResolvedValue({ count: 1 })

    const result = await bulkEnrollStudents({
      catalogSubjectId: "subj-1",
      userIds: ["student-1", "student-2"],
    })

    expect(result.success).toBe(true)
    expect(result.enrolled).toBe(1)
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "student-2",
          catalogSubjectId: "subj-1",
          schoolId: "school-123",
          isActive: true,
          status: "ACTIVE",
        },
      ],
    })
  })
})
