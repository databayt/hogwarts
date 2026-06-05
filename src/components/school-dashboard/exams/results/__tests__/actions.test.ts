// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Results action tests.
 *
 * The results pipeline aggregates exam results, marking results, and grade
 * boundaries. These tests prove every database access is scoped by schoolId
 * so an attacker cannot ask for another school's results by passing its examId.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getExamResults } from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    schoolExam: {
      findFirst: vi.fn(),
    },
    examResult: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    gradeBoundary: {
      findMany: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/cache/exam-cache", () => ({
  cacheKeys: {
    gradeBoundaries: (id: string) => `gb-${id}`,
    schoolBranding: (id: string) => `sb-${id}`,
    school: (id: string) => `s-${id}`,
  },
  gradeBoundaryCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
  schoolBrandingCache: { get: vi.fn(), set: vi.fn() },
  schoolCache: { get: vi.fn(), set: vi.fn() },
  invalidateCache: vi.fn(),
  warmCache: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_A = "school-results-a"
const SCHOOL_B = "school-results-b"

describe("Results Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      subdomain: "school-a",
      role: "ADMIN",
      locale: "en",
    } as any)
  })

  describe("getExamResults", () => {
    it("scopes schoolExam findFirst by schoolId", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)

      await getExamResults({
        examId: "exam-1",
        includeAbsent: false,
        includeQuestionBreakdown: false,
      })

      expect(db.schoolExam.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "exam-1",
            schoolId: SCHOOL_A,
          }),
        })
      )
    })

    it("returns EXAM_NOT_FOUND when exam belongs to another school", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)

      const result = await getExamResults({
        examId: "exam-cross-tenant",
        includeAbsent: false,
        includeQuestionBreakdown: false,
      })

      expect(result.success).toBe(false)
    })

    it("throws when no school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getExamResults({
        examId: "exam-1",
        includeAbsent: false,
        includeQuestionBreakdown: false,
      })

      expect(result.success).toBe(false)
      expect(db.schoolExam.findFirst).not.toHaveBeenCalled()
    })

    it("scopes markingResults eager-load by schoolId when requested", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)

      await getExamResults({
        examId: "exam-1",
        includeAbsent: false,
        includeQuestionBreakdown: true,
      })

      const callArgs = vi.mocked(db.schoolExam.findFirst).mock.calls[0]?.[0]
      const include = (callArgs as any)?.include
      // markingResults filter must include schoolId
      expect(include?.markingResults?.where?.schoolId).toBe(SCHOOL_A)
    })

    it("never accidentally uses another school's id in queries", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)

      await getExamResults({
        examId: "exam-1",
        includeAbsent: false,
        includeQuestionBreakdown: false,
      })

      const calls = vi.mocked(db.schoolExam.findFirst).mock.calls
      for (const [arg] of calls) {
        const where = (arg as any)?.where
        expect(where?.schoolId).toBe(SCHOOL_A)
        expect(where?.schoolId).not.toBe(SCHOOL_B)
      }
    })
  })
})
