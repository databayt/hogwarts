// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createSchoolYear,
  deleteSchoolYear,
  getSchoolYearOptions,
  getSchoolYears,
  updateSchoolYear,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

const SCHOOL_ID = "school-1"

function mockAdminContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    role: "ADMIN",
    requestId: null,
    isPlatformAdmin: false,
  })
}

function mockStudentContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    role: "STUDENT",
    requestId: null,
    isPlatformAdmin: false,
  })
}

function mockNoSchoolContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    role: null,
    requestId: null,
    isPlatformAdmin: false,
  })
}

const validInput = {
  yearName: "2025-2026",
  startDate: new Date("2025-09-01"),
  endDate: new Date("2026-06-30"),
}

// ============================================================================
// Tests
// ============================================================================

describe("School Year Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createSchoolYear
  // ==========================================================================

  describe("createSchoolYear", () => {
    it("creates school year with valid input", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolYear.create).mockResolvedValue({
        id: "year-1",
      } as any)

      const result = await createSchoolYear(validInput)

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual({ id: "year-1" })
      expect(db.schoolYear.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          yearName: "2025-2026",
        }),
      })
    })

    it("rejects missing year name (Zod validation)", async () => {
      mockAdminContext()

      const result = await createSchoolYear({
        ...validInput,
        yearName: "",
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Year name")
    })

    it("prevents duplicate year names", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "existing-year",
      } as any)

      const result = await createSchoolYear(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("already exists")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await createSchoolYear(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await createSchoolYear(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Missing school")
    })
  })

  // ==========================================================================
  // updateSchoolYear
  // ==========================================================================

  describe("updateSchoolYear", () => {
    it("updates school year", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst)
        .mockResolvedValueOnce({ id: "year-1" } as any) // exists check
        .mockResolvedValueOnce(null) // duplicate check
      vi.mocked(db.schoolYear.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updateSchoolYear({
        id: "year-1",
        yearName: "2026-2027",
      })

      expect(result.success).toBe(true)
    })

    it("returns error for non-existent year", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)

      const result = await updateSchoolYear({
        id: "nonexistent",
        yearName: "2026-2027",
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await updateSchoolYear({
        id: "year-1",
        yearName: "2026-2027",
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // deleteSchoolYear
  // ==========================================================================

  describe("deleteSchoolYear", () => {
    it("deletes school year without dependencies", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        _count: { terms: 0, periods: 0 },
      } as any)
      vi.mocked(db.schoolYear.deleteMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await deleteSchoolYear({ id: "year-1" })

      expect(result.success).toBe(true)
    })

    it("blocks deletion when terms exist", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
        _count: { terms: 3, periods: 0 },
      } as any)

      const result = await deleteSchoolYear({ id: "year-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Cannot delete")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await deleteSchoolYear({ id: "year-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // getSchoolYears
  // ==========================================================================

  describe("getSchoolYears", () => {
    it("returns years for current school (no RBAC)", async () => {
      mockAdminContext()
      const mockRows = [
        {
          id: "y1",
          yearName: "2025-2026",
          startDate: new Date("2025-09-01"),
          endDate: new Date("2026-06-30"),
          createdAt: new Date(),
          _count: { terms: 2, periods: 8 },
        },
      ]
      vi.mocked(db.schoolYear.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.schoolYear.count).mockResolvedValue(1)

      const result = await getSchoolYears()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.rows).toHaveLength(1)
        expect(result.data?.total).toBe(1)
      }
    })
  })

  // ==========================================================================
  // getSchoolYearOptions
  // ==========================================================================

  describe("getSchoolYearOptions", () => {
    it("returns id/yearName pairs", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findMany).mockResolvedValue([
        { id: "y1", yearName: "2025-2026" },
      ] as any)

      const result = await getSchoolYearOptions()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([{ id: "y1", yearName: "2025-2026" }])
      }
    })
  })
})
