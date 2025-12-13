import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getSchoolYears,
  createSchoolYear,
  updateSchoolYear,
  deleteSchoolYear,
  getTermsForYear,
  createTerm,
  setActiveTerm,
  getPeriodsForYear,
  createPeriod,
  bulkCreatePeriods,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    term: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    period: {
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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
        { id: "year-1", yearName: "2024-2025", schoolId: mockSchoolId },
        { id: "year-2", yearName: "2023-2024", schoolId: mockSchoolId },
      ]

      vi.mocked(db.schoolYear.findMany).mockResolvedValue(mockYears as any)

      const result = await getSchoolYears()

      expect(result.success).toBe(true)
      expect(db.schoolYear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId },
        })
      )
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getSchoolYears()

      expect(result.success).toBe(false)
      expect(result.message).toBe("School not found")
    })

    it("returns error for insufficient permissions", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      const result = await getSchoolYears()

      expect(result.success).toBe(false)
      expect(result.message).toBe("Insufficient permissions")
    })
  })

  describe("createSchoolYear", () => {
    it("creates school year with schoolId scope", async () => {
      const mockYear = {
        id: "year-1",
        yearName: "2024-2025",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolYear.create).mockResolvedValue(mockYear as any)

      const formData = new FormData()
      formData.set("yearName", "2024-2025")
      formData.set("startDate", "2024-09-01")
      formData.set("endDate", "2025-06-30")

      const result = await createSchoolYear(formData)

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

      const formData = new FormData()
      formData.set("yearName", "2024-2025")
      formData.set("startDate", "2024-09-01")
      formData.set("endDate", "2025-06-30")

      const result = await createSchoolYear(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain("already exists")
    })
  })

  describe("deleteSchoolYear", () => {
    it("prevents deletion with existing terms", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
        _count: { terms: 2, periods: 0 },
      } as any)

      const formData = new FormData()
      formData.set("id", "year-1")

      const result = await deleteSchoolYear(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Cannot delete")
    })

    it("deletes year with no dependencies", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
        _count: { terms: 0, periods: 0 },
      } as any)
      vi.mocked(db.schoolYear.delete).mockResolvedValue({} as any)

      const formData = new FormData()
      formData.set("id", "year-1")

      const result = await deleteSchoolYear(formData)

      expect(result.success).toBe(true)
    })
  })

  describe("getTermsForYear", () => {
    it("fetches terms scoped to schoolId and yearId", async () => {
      const mockTerms = [
        { id: "term-1", termNumber: 1, schoolId: mockSchoolId, yearId: "year-1" },
        { id: "term-2", termNumber: 2, schoolId: mockSchoolId, yearId: "year-1" },
      ]

      vi.mocked(db.term.findMany).mockResolvedValue(mockTerms as any)

      const result = await getTermsForYear("year-1")

      expect(result.success).toBe(true)
      expect(db.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId, yearId: "year-1" },
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
      vi.mocked(db.term.update).mockResolvedValue({} as any)

      const formData = new FormData()
      formData.set("id", "term-1")

      const result = await setActiveTerm(formData)

      expect(result.success).toBe(true)
      expect(db.term.updateMany).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          yearId: "year-1",
          NOT: { id: "term-1" },
        },
        data: { isActive: false },
      })
      expect(db.term.update).toHaveBeenCalledWith({
        where: { id: "term-1" },
        data: { isActive: true },
      })
    })
  })

  describe("getPeriodsForYear", () => {
    it("fetches periods scoped to schoolId and yearId", async () => {
      const mockPeriods = [
        {
          id: "period-1",
          name: "Period 1",
          schoolId: mockSchoolId,
          yearId: "year-1",
          startTime: new Date("2024-01-01T08:00:00"),
          endTime: new Date("2024-01-01T08:45:00"),
        },
      ]

      vi.mocked(db.period.findMany).mockResolvedValue(mockPeriods as any)

      const result = await getPeriodsForYear("year-1")

      expect(result.success).toBe(true)
      expect(db.period.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId, yearId: "year-1" },
        })
      )
    })
  })

  describe("bulkCreatePeriods", () => {
    it("creates multiple periods with schoolId scope", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.period.deleteMany).mockResolvedValue({ count: 0 })
      vi.mocked(db.period.createMany).mockResolvedValue({ count: 6 })

      const periods = [
        { name: "Period 1", startTime: "08:00", endTime: "08:45" },
        { name: "Period 2", startTime: "08:50", endTime: "09:35" },
      ]

      const formData = new FormData()
      formData.set("yearId", "year-1")
      formData.set("periods", JSON.stringify(periods))

      const result = await bulkCreatePeriods(formData)

      expect(result.success).toBe(true)
      expect(db.period.createMany).toHaveBeenCalled()
    })
  })
})
