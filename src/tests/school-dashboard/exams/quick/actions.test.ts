// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick Assessment server-action tests.
 *
 * Verifies multi-tenant isolation: every read/write must be scoped by
 * schoolId and missing context must be rejected before touching the DB.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getStudentScopes } from "@/lib/teaching-scope"
import {
  closeQuickAssessment,
  createQuickAssessment,
  getQuickAssessment,
  getQuickAssessments,
  launchQuickAssessment,
  submitQuickResponse,
} from "@/components/school-dashboard/exams/quick/actions"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"

vi.mock("@/lib/db", () => ({
  db: {
    quickAssessment: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    quickAssessmentResponse: { findUnique: vi.fn(), create: vi.fn() },
    student: { findFirst: vi.fn(), findMany: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/components/school-dashboard/teaching-scope/resolve", () => ({
  resolveTeachingScope: vi.fn(),
}))
vi.mock("@/components/school-dashboard/grades/lib/gradebook", () => ({
  resolveStudentSubjectContext: vi.fn(),
  upsertGradebookResult: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_ID = "school-quick-1"
const USER_ID = "user-quick-1"
const OTHER_SCHOOL = "school-other"

describe("Quick Assessment Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER_ID, schoolId: SCHOOL_ID, role: "TEACHER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "TEACHER",
      isPlatformAdmin: false,
    } as never)
    vi.mocked(resolveTeachingScope).mockResolvedValue({
      ok: true,
      scope: {
        gradeId: "g7",
        sectionId: "7a",
        subjectId: "subject-1",
        termId: "term-1",
      },
    })
  })

  describe("createQuickAssessment", () => {
    it("returns NO_SCHOOL when tenant context has no schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "TEACHER",
        isPlatformAdmin: false,
      } as never)

      const result = await createQuickAssessment({
        title: "Pop Quiz",
        type: "POLL",
        gradeId: "g7",
        sectionId: null,
        subjectId: "subject-1",
        questionIds: ["q-1"],
        duration: 5,
        isAnonymous: false,
        showResults: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NO_SCHOOL")
      expect(db.quickAssessment.create).not.toHaveBeenCalled()
    })

    it("creates assessment with schoolId and its audience in the payload", async () => {
      vi.mocked(db.quickAssessment.create).mockResolvedValue({
        id: "qa-1",
      } as never)

      const result = await createQuickAssessment({
        title: "Pop Quiz",
        type: "POLL",
        gradeId: "g7",
        sectionId: "7a",
        subjectId: "subject-1",
        questionIds: ["q-1"],
        duration: 5,
        isAnonymous: false,
        showResults: true,
      })

      expect(result.success).toBe(true)
      const data = vi.mocked(db.quickAssessment.create).mock.calls[0][0].data
      expect(data).toMatchObject({
        schoolId: SCHOOL_ID,
        createdBy: USER_ID,
        gradeId: "g7",
        sectionId: "7a",
        termId: "term-1",
        subjectId: "subject-1",
      })
      expect(data).not.toHaveProperty("classId")
    })

    it("refuses an audience the school doesn't have", async () => {
      vi.mocked(resolveTeachingScope).mockResolvedValue({
        ok: false,
        code: "INVALID_SECTION",
      })

      const result = await createQuickAssessment({
        title: "Pop Quiz",
        type: "POLL",
        gradeId: "g7",
        sectionId: "other-school-section",
        subjectId: "subject-1",
        questionIds: ["q-1"],
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("INVALID_SECTION")
      expect(db.quickAssessment.create).not.toHaveBeenCalled()
    })

    it("refuses a student", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: USER_ID, schoolId: SCHOOL_ID, role: "STUDENT" },
      } as never)

      const result = await createQuickAssessment({
        title: "Pop Quiz",
        type: "POLL",
        gradeId: "g7",
        sectionId: null,
        subjectId: "subject-1",
        questionIds: ["q-1"],
      })

      expect(result.success).toBe(false)
      expect(db.quickAssessment.create).not.toHaveBeenCalled()
    })
  })

  describe("submitQuickResponse", () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: USER_ID, schoolId: SCHOOL_ID, role: "STUDENT" },
      } as never)
    })

    it("lets only a student of the audience answer", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
      vi.mocked(getStudentScopes).mockResolvedValue([
        { studentId: "stu-1", sectionId: "7a", gradeId: "g7" },
      ])
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      const result = await submitQuickResponse({
        assessmentId: "qa-1",
        responses: [{ questionId: "q-1", answer: "A" }],
      })

      expect(result.success).toBe(false)
      expect(
        vi.mocked(db.quickAssessment.findFirst).mock.calls[0][0]!.where
      ).toMatchObject({
        id: "qa-1",
        schoolId: SCHOOL_ID,
        status: "ACTIVE",
        OR: [
          { sectionId: { in: ["7a"] } },
          { sectionId: null, gradeId: { in: ["g7"] } },
        ],
      })
      expect(db.quickAssessmentResponse.create).not.toHaveBeenCalled()
    })

    it("refuses someone who is not a student", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await submitQuickResponse({
        assessmentId: "qa-1",
        responses: [{ questionId: "q-1", answer: "A" }],
      })

      expect(result.success).toBe(false)
      expect(db.quickAssessment.findFirst).not.toHaveBeenCalled()
    })
  })

  describe("launchQuickAssessment", () => {
    it("scopes findFirst by schoolId", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
        id: "qa-1",
        schoolId: SCHOOL_ID,
      } as never)
      vi.mocked(db.quickAssessment.update).mockResolvedValue({} as never)

      await launchQuickAssessment("qa-1")

      expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "qa-1", schoolId: SCHOOL_ID },
        })
      )
    })

    it("returns NOT_FOUND when assessment is in another school", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      const result = await launchQuickAssessment("qa-cross-tenant")

      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NOT_FOUND")
      expect(db.quickAssessment.update).not.toHaveBeenCalled()
    })
  })

  describe("closeQuickAssessment", () => {
    it("scopes findFirst by schoolId before update", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
        id: "qa-1",
        schoolId: SCHOOL_ID,
        status: "ACTIVE",
      } as never)
      vi.mocked(db.quickAssessment.update).mockResolvedValue({} as never)

      await closeQuickAssessment("qa-1")

      expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "qa-1", schoolId: SCHOOL_ID },
        })
      )
    })
  })

  describe("getQuickAssessments", () => {
    it("shows a student only their audience's assessments", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: USER_ID, schoolId: SCHOOL_ID, role: "STUDENT" },
      } as never)
      vi.mocked(db.student.findMany).mockResolvedValue([
        { id: "stu-1" },
      ] as never)
      vi.mocked(getStudentScopes).mockResolvedValue([
        { studentId: "stu-1", sectionId: "7a", gradeId: "g7" },
      ])
      vi.mocked(db.quickAssessment.findMany).mockResolvedValue([])

      await getQuickAssessments()

      expect(
        vi.mocked(db.quickAssessment.findMany).mock.calls[0][0]!.where
      ).toMatchObject({
        schoolId: SCHOOL_ID,
        OR: [
          { sectionId: { in: ["7a"] } },
          { sectionId: null, gradeId: { in: ["g7"] } },
        ],
      })
    })

    it("filters by schoolId", async () => {
      vi.mocked(db.quickAssessment.findMany).mockResolvedValue([])

      await getQuickAssessments()

      expect(db.quickAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_ID }),
        })
      )
    })

    it("returns empty array on missing schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "TEACHER",
        isPlatformAdmin: false,
      } as never)

      const result = await getQuickAssessments()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
      expect(db.quickAssessment.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getQuickAssessment", () => {
    it("scopes findFirst by schoolId", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      await getQuickAssessment("qa-1")

      expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "qa-1",
            schoolId: SCHOOL_ID,
          }),
        })
      )
    })

    it("does not leak data from another school", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      const result = await getQuickAssessment("qa-from-school-b")

      expect(result).toBeNull()
    })
  })

  describe("Cross-tenant isolation", () => {
    it("never queries with another school's id", async () => {
      vi.mocked(db.quickAssessment.findMany).mockResolvedValue([])

      await getQuickAssessments()

      const calls = vi.mocked(db.quickAssessment.findMany).mock.calls
      for (const [arg] of calls) {
        expect(arg?.where?.schoolId).toBe(SCHOOL_ID)
        expect(arg?.where?.schoolId).not.toBe(OTHER_SCHOOL)
      }
    })
  })
})
