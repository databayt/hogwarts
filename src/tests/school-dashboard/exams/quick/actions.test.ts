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
  resolveStudentSubjectContext,
  upsertGradebookResult,
} from "@/components/school-dashboard/grades/lib/gradebook"
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
    questionBank: { findMany: vi.fn() },
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

    it("marks answers against the bank, ignoring a forged isCorrect", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
      vi.mocked(getStudentScopes).mockResolvedValue([
        { studentId: "stu-1", sectionId: "7a", gradeId: "g7" },
      ])
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
        id: "qa-1",
        subjectId: "subject-1",
        termId: "t1",
        title: "Pop quiz",
        isAnonymous: false,
        questionIds: ["q-1", "q-2", "q-3"],
      } as never)
      vi.mocked(db.quickAssessmentResponse.findUnique).mockResolvedValue(null)
      vi.mocked(db.questionBank.findMany).mockResolvedValue([
        {
          id: "q-1",
          questionText: "2+2",
          questionType: "MULTIPLE_CHOICE",
          options: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true },
          ],
        },
        {
          id: "q-2",
          questionText: "Sky is green",
          questionType: "TRUE_FALSE",
          options: [
            { text: "True", isCorrect: false },
            { text: "False", isCorrect: true },
          ],
        },
        {
          id: "q-3",
          questionText: "Explain",
          questionType: "SHORT_ANSWER",
          options: null,
        },
      ] as never)
      vi.mocked(resolveStudentSubjectContext).mockResolvedValue({
        sectionId: "7a",
        academicGradeId: "g7",
        termId: "t1",
      } as never)

      const result = await submitQuickResponse({
        assessmentId: "qa-1",
        responses: [
          { questionId: "q-1", answer: "1" },
          // wrong, but the browser claims otherwise
          { questionId: "q-2", answer: "0", isCorrect: true },
          { questionId: "q-3", answer: "because" },
          // not a question of this assessment
          { questionId: "q-x", answer: "0" },
        ],
      })

      expect(result.success).toBe(true)
      const saved = vi.mocked(db.quickAssessmentResponse.create).mock
        .calls[0][0]!.data.responses
      expect(saved).toEqual([
        { questionId: "q-1", answer: "1", isCorrect: true },
        { questionId: "q-2", answer: "0", isCorrect: false },
        { questionId: "q-3", answer: "because" },
      ])
      expect(upsertGradebookResult).toHaveBeenCalledWith(
        expect.objectContaining({ score: 1, maxScore: 2, studentId: "stu-1" })
      )
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

    it("hands the take screen option texts only, never the key", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
        id: "qa-1",
        questionIds: ["q-2", "q-1"],
      } as never)
      vi.mocked(db.questionBank.findMany).mockResolvedValue([
        {
          id: "q-1",
          questionText: "2+2",
          questionType: "MULTIPLE_CHOICE",
          options: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true, explanation: "sum" },
          ],
        },
        {
          id: "q-2",
          questionText: "Explain",
          questionType: "SHORT_ANSWER",
          options: null,
        },
      ] as never)

      const result = await getQuickAssessment("qa-1")

      expect(result?.questions).toEqual([
        {
          id: "q-2",
          questionText: "Explain",
          questionType: "SHORT_ANSWER",
          options: null,
        },
        {
          id: "q-1",
          questionText: "2+2",
          questionType: "MULTIPLE_CHOICE",
          options: [{ text: "3" }, { text: "4" }],
        },
      ])
      expect(JSON.stringify(result)).not.toContain("isCorrect")
      expect(
        vi.mocked(db.questionBank.findMany).mock.calls[0][0]!.where
      ).toMatchObject({ schoolId: SCHOOL_ID })
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
