// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createExam,
  deleteExam,
  getExams,
  updateExam,
} from "@/components/school-dashboard/exams/manage/actions"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"
import { prewarm } from "@/components/translation/prewarm"

vi.mock("@/lib/db", () => ({
  db: {
    schoolExam: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
    },
    subjectSelection: {
      findFirst: vi.fn(),
    },
    school: {
      findFirst: vi.fn().mockResolvedValue({ preferredLanguage: "en" }),
    },
    $transaction: vi.fn((callback) =>
      callback({
        schoolExam: {
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
        },
      })
    ),
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotificationsToAudience: vi.fn().mockResolvedValue({ count: 0 }),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-123", role: "TEACHER" },
  }),
}))

vi.mock("@/components/school-dashboard/exams/lib/roster", () => ({
  examAudienceUserIds: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/components/school-dashboard/teaching-scope/resolve", () => ({
  resolveTeachingScope: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Run `after()` callbacks synchronously so we can assert the prewarm side
// effect; preserve the rest of next/server.
vi.mock("next/server", async (orig) => ({
  ...((await orig()) as object),
  after: (fn: () => void) => fn(),
}))

vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(),
}))

vi.mock(
  "@/components/school-dashboard/exams/manage/actions/conflict-detection",
  () => ({
    checkExamConflicts: vi.fn().mockResolvedValue({
      success: true,
      data: { hasConflicts: false, conflicts: [], suggestions: [] },
    }),
  })
)

describe("Exam Actions", () => {
  const mockSchoolId = "school-123"
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    } as any)
    vi.mocked(resolveTeachingScope).mockImplementation(async (_s, input) => ({
      ok: true,
      scope: {
        gradeId: input.gradeId,
        sectionId: input.sectionId ?? null,
        subjectId: input.subjectId,
        termId: "term-1",
      },
    }))
  })

  describe("createExam", () => {
    it("creates exam with schoolId for multi-tenant isolation", async () => {
      const mockExam = {
        id: "exam-1",
        title: "Midterm Exam",
        gradeId: "grade-7",
        subjectId: "subject-1",
        schoolId: mockSchoolId,
      }

      // Mock subject existence check
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
        id: "selection-1",
        catalogSubjectId: "subject-1",
        schoolId: mockSchoolId,
        isActive: true,
      } as any)
      vi.mocked(db.schoolExam.create).mockResolvedValue(mockExam as any)

      const result = await createExam({
        title: "Midterm Exam",
        gradeId: "grade-7",
        sectionId: "section-7a",
        subjectId: "subject-1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
      })

      expect(result.success).toBe(true)
      const data = vi.mocked(db.schoolExam.create).mock.calls[0][0].data
      expect(data).toMatchObject({
        schoolId: mockSchoolId,
        gradeId: "grade-7",
        sectionId: "section-7a",
        subjectId: "subject-1",
        termId: "term-1",
        createdById: "user-1",
      })
      expect(data).not.toHaveProperty("classId")
    })

    it("refuses roles that don't set exams", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        role: "STUDENT",
      } as any)

      const result = await createExam({
        title: "Exam",
        gradeId: "grade-7",
        subjectId: "subject-1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
      })

      expect(result.success).toBe(false)
      expect(db.schoolExam.create).not.toHaveBeenCalled()
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      const result = await createExam({
        title: "Exam",
        gradeId: "grade-7",
        sectionId: "section-7a",
        subjectId: "subject-1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
      })

      expect(result.success).toBe(false)
    })

    it("refuses a grade, section or subject outside the school", async () => {
      vi.mocked(resolveTeachingScope).mockResolvedValueOnce({
        ok: false,
        code: "INVALID_SECTION",
      })

      const result = await createExam({
        title: "Exam",
        gradeId: "grade-7",
        sectionId: "other-school-section",
        subjectId: "subject-1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("INVALID_SECTION")
      }
      expect(db.schoolExam.create).not.toHaveBeenCalled()
    })
  })

  describe("updateExam", () => {
    it("updates exam with schoolId scope", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        status: "PLANNED",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        gradeId: "grade-7",
        sectionId: null,
      } as any)
      vi.mocked(db.schoolExam.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updateExam({
        id: "exam-1",
        title: "Updated Exam",
      })

      expect(result.success).toBe(true)
    })

    it("returns error for completed exams", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        status: "COMPLETED",
      } as any)

      const result = await updateExam({
        id: "exam-1",
        title: "Updated Exam",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("EXAM_COMPLETED")
      }
    })
  })

  describe("deleteExam", () => {
    it("deletes exam with schoolId scope", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        _count: { results: 0 },
      } as any)
      vi.mocked(db.schoolExam.deleteMany).mockResolvedValue({ count: 1 } as any)

      const result = await deleteExam({ id: "exam-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deletion of exams with results", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        _count: { results: 5 },
      } as any)

      const result = await deleteExam({ id: "exam-1" })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("HAS_RESULTS")
      }
    })
  })

  describe("getExams", () => {
    it("fetches exams scoped to schoolId", async () => {
      const mockExams = [
        {
          id: "1",
          title: "Exam 1",
          schoolId: mockSchoolId,
          examDate: new Date(),
          createdAt: new Date(),
          grade: { name: "Grade 7" },
          subject: { name: "Math" },
        },
        {
          id: "2",
          title: "Exam 2",
          schoolId: mockSchoolId,
          examDate: new Date(),
          createdAt: new Date(),
          grade: { name: "Grade 8" },
          subject: { name: "Science" },
        },
      ]

      vi.mocked(db.schoolExam.findMany).mockResolvedValue(mockExams as any)
      vi.mocked(db.schoolExam.count).mockResolvedValue(2)

      const result = await getExams({})

      expect(result.rows).toHaveLength(2)
      expect(result.total).toBe(2)
    })
  })

  describe("translation cache prewarm", () => {
    it("prewarms Exam on successful create", async () => {
      const mockExam = {
        id: "exam-1",
        title: "Midterm Exam",
        description: "Covers chapters 1-5",
        schoolId: mockSchoolId,
      }
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
        id: "selection-1",
        catalogSubjectId: "subject-1",
        schoolId: mockSchoolId,
        isActive: true,
      } as any)
      vi.mocked(db.schoolExam.create).mockResolvedValue(mockExam as any)

      const result = await createExam({
        title: "Midterm Exam",
        description: "Covers chapters 1-5",
        gradeId: "grade-7",
        sectionId: "section-7a",
        subjectId: "subject-1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
      })

      expect(result.success).toBe(true)
      expect(prewarm).toHaveBeenCalledWith(
        "Exam",
        expect.objectContaining({ title: "Midterm Exam" }),
        { schoolId: mockSchoolId }
      )
    })

    it("prewarms Exam on successful update", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        status: "PLANNED",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        gradeId: "grade-7",
        sectionId: null,
      } as any)
      vi.mocked(db.schoolExam.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updateExam({
        id: "exam-1",
        title: "Updated Exam",
      })

      expect(result.success).toBe(true)
      expect(prewarm).toHaveBeenCalledWith(
        "Exam",
        expect.objectContaining({ id: "exam-1", title: "Updated Exam" }),
        { schoolId: mockSchoolId }
      )
    })

    it("does NOT prewarm when missing school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      const result = await createExam({
        title: "Midterm Exam",
        gradeId: "grade-7",
        sectionId: "section-7a",
        subjectId: "subject-1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
      })

      expect(result.success).toBe(false)
      expect(prewarm).not.toHaveBeenCalled()
    })
  })
})
