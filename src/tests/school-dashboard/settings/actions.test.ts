// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createSchoolYear,
  deleteSchoolYear,
  getSchoolYears,
  updateSchoolYear,
} from "@/components/school-dashboard/school/academic/year/actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Settings Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ADMIN",
      locale: "en",
    })
  })

  describe("updateSchoolYear", () => {
    it("updates school year within same school", async () => {
      // First findFirst: existence check → returns the record
      // Second findFirst: duplicate-name check → returns null (no duplicate)
      vi.mocked(db.schoolYear.findFirst)
        .mockResolvedValueOnce({
          id: "year-1",
          yearName: "2024-2025",
          schoolId: mockSchoolId,
        } as any)
        .mockResolvedValueOnce(null)
      vi.mocked(db.schoolYear.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateSchoolYear({
        id: "year-1",
        yearName: "2024-2025 Updated",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating year from different school (NOT_FOUND)", async () => {
      // findFirst returns null when schoolId doesn't match
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)

      const result = await updateSchoolYear({
        id: "year-from-other-school",
        yearName: "Updated",
      })

      expect(result.success).toBe(false)
    })

    it("requires ADMIN role to update school years", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "TEACHER", // Not admin
        locale: "en",
      })

      const result = await updateSchoolYear({
        id: "year-1",
        yearName: "Blocked Update",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  describe("getSchoolYears", () => {
    it("fetches school years scoped to schoolId", async () => {
      const mockYears = [
        {
          id: "1",
          yearName: "2024-2025",
          schoolId: mockSchoolId,
          startDate: new Date("2024-09-01"),
          endDate: new Date("2025-06-30"),
          createdAt: new Date(),
          _count: { terms: 2, periods: 6 },
        },
        {
          id: "2",
          yearName: "2023-2024",
          schoolId: mockSchoolId,
          startDate: new Date("2023-09-01"),
          endDate: new Date("2024-06-30"),
          createdAt: new Date(),
          _count: { terms: 2, periods: 6 },
        },
      ]

      vi.mocked(db.schoolYear.findMany).mockResolvedValue(mockYears as any)
      vi.mocked(db.schoolYear.count).mockResolvedValue(2)

      const result = await getSchoolYears()

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
    })

    it("applies schoolId filter to query", async () => {
      vi.mocked(db.schoolYear.findMany).mockResolvedValue([])
      vi.mocked(db.schoolYear.count).mockResolvedValue(0)

      await getSchoolYears()

      expect(db.schoolYear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })

  describe("deleteSchoolYear (school data export equivalent)", () => {
    it("deletes year only for current school", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: mockSchoolId,
        yearName: "Test Year",
        _count: { terms: 0, periods: 0 },
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.schoolYear.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteSchoolYear({ id: mockSchoolId })

      expect(result.success).toBe(true)
      expect(db.schoolYear.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: mockSchoolId }),
        })
      )
    })

    it("returns error when school year not found", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)

      const result = await deleteSchoolYear({ id: "nonexistent-year" })

      expect(result.success).toBe(false)
    })
  })

  describe("createSchoolYear", () => {
    it("requires MISSING_SCHOOL error when schoolId is null", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test-school",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createSchoolYear({
        yearName: "2026-2027",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2027-06-30"),
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("MISSING_SCHOOL")
    })
  })
})
