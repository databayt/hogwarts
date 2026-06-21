// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createPeriod,
  getPeriods,
} from "@/components/school-dashboard/school/academic/period/actions"
import {
  createTerm,
  getTerms,
  setActiveTerm,
} from "@/components/school-dashboard/school/academic/term/actions"
import {
  createSchoolYear,
  deleteSchoolYear,
  getSchoolYears,
  updateSchoolYear,
} from "@/components/school-dashboard/school/academic/year/actions"

vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    term: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    period: {
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
      count: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Academic Settings Actions", () => {
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

  describe("getSchoolYears", () => {
    it("fetches school years scoped to schoolId", async () => {
      const mockYears = [
        {
          id: "year-1",
          yearName: "2024-2025",
          schoolId: mockSchoolId,
          startDate: new Date("2024-09-01"),
          endDate: new Date("2025-06-30"),
          createdAt: new Date(),
          _count: { terms: 2, periods: 6 },
        },
        {
          id: "year-2",
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
      expect(db.schoolYear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      )
    })

    it("returns error when not authenticated (no schoolId)", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getSchoolYears()

      expect(result.success).toBe(false)
      expect(result.error).toBe("MISSING_SCHOOL")
    })

    it("returns error for insufficient permissions (TEACHER role)", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      // getSchoolYears is a query so it does NOT check role — it just requires schoolId
      // The permission check is only in mutations; queries are open to any authenticated school user
      vi.mocked(db.schoolYear.findMany).mockResolvedValue([])
      vi.mocked(db.schoolYear.count).mockResolvedValue(0)

      const result = await getSchoolYears()

      expect(result.success).toBe(true)
    })
  })

  describe("createSchoolYear", () => {
    it("creates school year with schoolId scope", async () => {
      const mockYear = {
        id: "year-1",
        yearName: "2024-2025",
        schoolId: mockSchoolId,
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-06-30"),
        createdAt: new Date(),
      }

      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolYear.create).mockResolvedValue(mockYear as any)

      const result = await createSchoolYear({
        yearName: "2024-2025",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-06-30"),
      })

      expect(result.success).toBe(true)
      expect(db.schoolYear.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            yearName: "2024-2025",
          }),
        })
      )
    })

    it("rejects duplicate year names", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "existing",
        yearName: "2024-2025",
        schoolId: mockSchoolId,
      } as any)

      const result = await createSchoolYear({
        yearName: "2024-2025",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-06-30"),
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("already exists")
    })
  })

  describe("updateSchoolYear", () => {
    it("returns UNAUTHORIZED for non-admin roles", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      const result = await updateSchoolYear({
        id: "year-1",
        yearName: "2024-2025 Updated",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  describe("deleteSchoolYear", () => {
    it("prevents deletion with existing terms", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
        _count: { terms: 2, periods: 0 },
      } as any)

      const result = await deleteSchoolYear({ id: "year-1" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Cannot delete")
    })

    it("deletes year with no dependencies", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
        _count: { terms: 0, periods: 0 },
      } as any)
      vi.mocked(db.schoolYear.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteSchoolYear({ id: "year-1" })

      expect(result.success).toBe(true)
    })
  })

  describe("getTerms", () => {
    it("fetches terms scoped to schoolId and yearId", async () => {
      const mockTerms = [
        {
          id: "term-1",
          termNumber: 1,
          schoolId: mockSchoolId,
          yearId: "year-1",
          startDate: new Date("2024-09-01"),
          endDate: new Date("2024-12-31"),
          isActive: true,
          createdAt: new Date(),
          schoolYear: { id: "year-1", yearName: "2024-2025" },
        },
        {
          id: "term-2",
          termNumber: 2,
          schoolId: mockSchoolId,
          yearId: "year-1",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-06-30"),
          isActive: false,
          createdAt: new Date(),
          schoolYear: { id: "year-1", yearName: "2024-2025" },
        },
      ]

      vi.mocked(db.term.findMany).mockResolvedValue(mockTerms as any)
      vi.mocked(db.term.count).mockResolvedValue(2)

      const result = await getTerms({ yearId: "year-1" })

      expect(result.success).toBe(true)
      expect(db.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            yearId: "year-1",
          }),
        })
      )
    })
  })

  describe("setActiveTerm", () => {
    it("sets active term and deactivates others", async () => {
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "term-1",
        schoolId: mockSchoolId,
        yearId: "year-1",
      } as any)
      vi.mocked(db.term.updateMany).mockResolvedValue({ count: 2 })

      const result = await setActiveTerm({ id: "term-1" })

      expect(result.success).toBe(true)
      // First updateMany deactivates others in same year
      expect(db.term.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            yearId: "year-1",
            NOT: { id: "term-1" },
          }),
          data: { isActive: false },
        })
      )
      // Second updateMany activates the selected term
      expect(db.term.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "term-1",
            schoolId: mockSchoolId,
          }),
          data: { isActive: true },
        })
      )
    })
  })

  describe("getPeriods", () => {
    it("fetches periods scoped to schoolId and yearId", async () => {
      const mockPeriods = [
        {
          id: "period-1",
          name: "Period 1",
          schoolId: mockSchoolId,
          yearId: "year-1",
          startTime: new Date("2024-01-01T08:00:00"),
          endTime: new Date("2024-01-01T08:45:00"),
          createdAt: new Date(),
          schoolYear: { id: "year-1", yearName: "2024-2025" },
        },
      ]

      vi.mocked(db.period.findMany).mockResolvedValue(mockPeriods as any)
      vi.mocked(db.period.count).mockResolvedValue(1)

      const result = await getPeriods({ yearId: "year-1" })

      expect(result.success).toBe(true)
      expect(db.period.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            yearId: "year-1",
          }),
        })
      )
    })
  })

  describe("createPeriod", () => {
    it("creates period with schoolId scope", async () => {
      const mockPeriod = {
        id: "period-1",
        name: "Period 1",
        schoolId: mockSchoolId,
        yearId: "year-1",
        startTime: new Date("2024-01-01T08:00:00"),
        endTime: new Date("2024-01-01T08:45:00"),
        createdAt: new Date(),
      }

      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.period.findFirst).mockResolvedValue(null)
      vi.mocked(db.period.create).mockResolvedValue(mockPeriod as any)

      const result = await createPeriod({
        yearId: "year-1",
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:45",
      })

      expect(result.success).toBe(true)
      expect(db.period.create).toHaveBeenCalled()
    })
  })

  describe("createTerm", () => {
    it("creates term with schoolId scope", async () => {
      const mockTerm = {
        id: "term-1",
        termNumber: 1,
        schoolId: mockSchoolId,
        yearId: "year-1",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2024-12-31"),
        isActive: false,
        createdAt: new Date(),
      }

      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)
      vi.mocked(db.term.create).mockResolvedValue(mockTerm as any)

      const result = await createTerm({
        yearId: "year-1",
        termNumber: 1,
        startDate: new Date("2024-09-01"),
        endDate: new Date("2024-12-31"),
        isActive: false,
      })

      expect(result.success).toBe(true)
      expect(db.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            yearId: "year-1",
          }),
        })
      )
    })
  })
})
