// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createPeriod,
  deletePeriod,
  getPeriodOptions,
  getPeriods,
  updatePeriod,
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
      findFirst: vi.fn(),
    },
    period: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    timetable: {
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
  yearId: "year-1",
  name: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
}

// ============================================================================
// Tests
// ============================================================================

describe("Period Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createPeriod
  // ==========================================================================

  describe("createPeriod", () => {
    it("creates period with valid input", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.period.findFirst).mockResolvedValue(null)
      vi.mocked(db.period.create).mockResolvedValue({
        id: "period-1",
      } as any)

      const result = await createPeriod(validInput)

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual({ id: "period-1" })
    })

    it("prevents duplicate period name in same year", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await createPeriod(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("already exists")
    })

    it("validates time format with Zod", async () => {
      mockAdminContext()

      const result = await createPeriod({
        ...validInput,
        startTime: "invalid",
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Validation")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await createPeriod(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await createPeriod(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Missing school")
    })
  })

  // ==========================================================================
  // updatePeriod
  // ==========================================================================

  describe("updatePeriod", () => {
    it("updates period", async () => {
      mockAdminContext()
      vi.mocked(db.period.findFirst)
        .mockResolvedValueOnce({ id: "period-1", yearId: "year-1" } as any)
        .mockResolvedValueOnce(null) // no duplicate
      vi.mocked(db.period.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updatePeriod({ id: "period-1", name: "Break" })

      expect(result.success).toBe(true)
    })

    it("returns error for non-existent period", async () => {
      mockAdminContext()
      vi.mocked(db.period.findFirst).mockResolvedValue(null)

      const result = await updatePeriod({ id: "nonexistent", name: "Break" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await updatePeriod({ id: "period-1", name: "Break" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // deletePeriod
  // ==========================================================================

  describe("deletePeriod", () => {
    it("deletes period without dependencies", async () => {
      mockAdminContext()
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "period-1",
      } as any)
      vi.mocked(db.timetable.count).mockResolvedValue(0)
      vi.mocked(db.period.deleteMany).mockResolvedValue({ count: 1 } as any)

      const result = await deletePeriod({ id: "period-1" })

      expect(result.success).toBe(true)
    })

    it("blocks deletion when timetable slots reference it", async () => {
      mockAdminContext()
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "period-1",
      } as any)
      vi.mocked(db.timetable.count).mockResolvedValue(12)

      const result = await deletePeriod({ id: "period-1" })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Cannot delete period")
        expect(result.error).toContain("12 timetable entries")
      }
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await deletePeriod({ id: "period-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // getPeriods
  // ==========================================================================

  describe("getPeriods", () => {
    it("returns periods for school year", async () => {
      mockAdminContext()
      const mockRows = [
        {
          id: "p1",
          yearId: "y1",
          name: "Period 1",
          startTime: new Date("2025-01-01T08:00:00"),
          endTime: new Date("2025-01-01T08:45:00"),
          createdAt: new Date(),
          schoolYear: { id: "y1", yearName: "2025-2026" },
        },
      ]
      vi.mocked(db.period.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.period.count).mockResolvedValue(1)

      const result = await getPeriods()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.rows).toHaveLength(1)
        expect(result.data?.rows[0].name).toBe("Period 1")
      }
    })
  })

  // ==========================================================================
  // getPeriodOptions
  // ==========================================================================

  describe("getPeriodOptions", () => {
    it("returns id/name/yearName pairs", async () => {
      mockAdminContext()
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: "p1",
          name: "Period 1",
          schoolYear: { yearName: "2025-2026" },
        },
      ] as any)

      const result = await getPeriodOptions()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([
          { id: "p1", name: "Period 1", yearName: "2025-2026" },
        ])
      }
    })
  })
})
