// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Decimal } from "@prisma/client/runtime/library"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createScoreRange,
  deleteScoreRange,
  getScoreRangeOptions,
  getScoreRanges,
  updateScoreRange,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    scoreRange: {
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
  minScore: 90,
  maxScore: 100,
  grade: "A+",
}

// ============================================================================
// Tests
// ============================================================================

describe("Score Range (Grading) Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createScoreRange
  // ==========================================================================

  describe("createScoreRange", () => {
    it("creates score range with valid input", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findFirst).mockResolvedValue(null) // no duplicate grade
      vi.mocked(db.scoreRange.findMany).mockResolvedValue([]) // no overlaps
      vi.mocked(db.scoreRange.create).mockResolvedValue({
        id: "range-1",
      } as any)

      const result = await createScoreRange(validInput)

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual({ id: "range-1" })
    })

    it("validates with Zod (rejects negative scores)", async () => {
      mockAdminContext()

      const result = await createScoreRange({
        minScore: -10,
        maxScore: 100,
        grade: "A+",
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Validation")
    })

    it("prevents overlapping score ranges", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findFirst).mockResolvedValue(null) // no duplicate grade
      vi.mocked(db.scoreRange.findMany).mockResolvedValue([
        {
          id: "existing-1",
          minScore: new Decimal(85),
          maxScore: new Decimal(95),
          grade: "A",
        },
      ] as any)

      const result = await createScoreRange(validInput) // 90-100 overlaps with 85-95

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("overlaps")
    })

    it("prevents duplicate grade letters", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findFirst).mockResolvedValue({
        id: "existing-1",
      } as any)

      const result = await createScoreRange(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("already exists")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await createScoreRange(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await createScoreRange(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Missing school")
    })
  })

  // ==========================================================================
  // updateScoreRange
  // ==========================================================================

  describe("updateScoreRange", () => {
    it("updates score range", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findFirst)
        .mockResolvedValueOnce({
          id: "range-1",
          minScore: new Decimal(90),
          maxScore: new Decimal(100),
        } as any) // exists check
        .mockResolvedValueOnce(null) // no duplicate grade
      vi.mocked(db.scoreRange.findMany).mockResolvedValue([]) // no overlaps
      vi.mocked(db.scoreRange.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await updateScoreRange({ id: "range-1", grade: "A" })

      expect(result.success).toBe(true)
    })

    it("returns error for non-existent range", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findFirst).mockResolvedValue(null)

      const result = await updateScoreRange({
        id: "nonexistent",
        grade: "A",
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await updateScoreRange({ id: "range-1", grade: "A" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // deleteScoreRange
  // ==========================================================================

  describe("deleteScoreRange", () => {
    it("deletes score range", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findFirst).mockResolvedValue({
        id: "range-1",
      } as any)
      vi.mocked(db.scoreRange.deleteMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await deleteScoreRange({ id: "range-1" })

      expect(result.success).toBe(true)
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await deleteScoreRange({ id: "range-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // getScoreRanges
  // ==========================================================================

  describe("getScoreRanges", () => {
    it("returns ranges for current school", async () => {
      mockAdminContext()
      const mockRows = [
        {
          id: "r1",
          minScore: new Decimal(90),
          maxScore: new Decimal(100),
          grade: "A+",
          createdAt: new Date(),
        },
      ]
      vi.mocked(db.scoreRange.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.scoreRange.count).mockResolvedValue(1)

      const result = await getScoreRanges()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.rows).toHaveLength(1)
        expect(result.data?.rows[0].grade).toBe("A+")
      }
    })
  })

  // ==========================================================================
  // getScoreRangeOptions
  // ==========================================================================

  describe("getScoreRangeOptions", () => {
    it("returns id/minScore/maxScore/grade", async () => {
      mockAdminContext()
      vi.mocked(db.scoreRange.findMany).mockResolvedValue([
        {
          id: "r1",
          minScore: new Decimal(90),
          maxScore: new Decimal(100),
          grade: "A+",
        },
      ] as any)

      const result = await getScoreRangeOptions()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([
          { id: "r1", minScore: 90, maxScore: 100, grade: "A+" },
        ])
      }
    })
  })
})
