// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getChildrenProgress } from "../actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "guardian-user-1", schoolId: "school-123", role: "GUARDIAN" },
  }),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    guardian: {
      findUnique: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
    },
    catalogLesson: {
      count: vi.fn(),
    },
  },
}))

const mockGetTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindGuardian = db.guardian.findUnique as ReturnType<typeof vi.fn>
const mockFindEnrollments = db.enrollment.findMany as ReturnType<typeof vi.fn>
const mockLessonCount = db.catalogLesson.count as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetTenant.mockResolvedValue({ schoolId: "school-123", subdomain: "demo" })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getChildrenProgress", () => {
  it("includes schoolId in enrollment query", async () => {
    mockFindGuardian.mockResolvedValue({
      id: "guardian-1",
      studentGuardians: [
        {
          student: {
            id: "student-1",
            givenName: "Harry",
            surname: "Potter",
            userId: "student-user-1",
          },
        },
      ],
    })
    mockFindEnrollments.mockResolvedValue([])

    await getChildrenProgress()

    expect(mockFindEnrollments).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "student-user-1",
          isActive: true,
          schoolId: "school-123",
        },
      })
    )
  })

  it("returns empty array when no school context", async () => {
    mockGetTenant.mockResolvedValue({ schoolId: null, subdomain: null })

    const result = await getChildrenProgress()

    expect(result).toEqual([])
    expect(mockFindGuardian).not.toHaveBeenCalled()
  })

  it("returns only current school enrollments with progress", async () => {
    mockFindGuardian.mockResolvedValue({
      id: "guardian-1",
      studentGuardians: [
        {
          student: {
            id: "student-1",
            givenName: "Harry",
            surname: "Potter",
            userId: "student-user-1",
          },
        },
      ],
    })
    mockFindEnrollments.mockResolvedValue([
      {
        id: "enroll-1",
        isActive: true,
        subject: { id: "subj-1", name: "Math", slug: "math" },
        progress: [{ isCompleted: true }, { isCompleted: false }],
      },
    ])
    mockLessonCount.mockResolvedValue(5)

    const result = await getChildrenProgress()

    expect(result).toHaveLength(1)
    expect(result[0].student.givenName).toBe("Harry")
    expect(result[0].enrollments).toHaveLength(1)
    expect(result[0].enrollments[0].completedLessons).toBe(1)
    expect(result[0].enrollments[0].totalLessons).toBe(5)
    expect(result[0].enrollments[0].progressPercent).toBe(20)
  })
})
