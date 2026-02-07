import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { createExam, deleteExam, getExams, updateExam } from "../manage/actions"

vi.mock("@/lib/db", () => ({
  db: {
    exam: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        exam: {
          create: vi.fn(),
          update: vi.fn(),
          deleteMany: vi.fn(),
        },
      })
    ),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

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
    })
  })

  describe("createExam", () => {
    it("creates exam with schoolId for multi-tenant isolation", async () => {
      const mockExam = {
        id: "exam-1",
        title: "Midterm Exam",
        classId: "class-1",
        subjectId: "subject-1",
        schoolId: mockSchoolId,
      }

      // Mock class and subject existence checks
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.subject.findFirst).mockResolvedValue({
        id: "subject-1",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.exam.create).mockResolvedValue(mockExam as any)

      const result = await createExam({
        title: "Midterm Exam",
        classId: "class-1",
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
        classId: "class-1",
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

    it("returns error when class does not belong to school", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue(null)

      const result = await createExam({
        title: "Exam",
        classId: "invalid-class",
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
        expect(result.code).toBe("INVALID_CLASS")
      }
    })
  })

  describe("updateExam", () => {
    it("updates exam with schoolId scope", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        status: "PLANNED",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        classId: "class-1",
      } as any)
      vi.mocked(db.exam.update).mockResolvedValue({} as any)

      const result = await updateExam({
        id: "exam-1",
        title: "Updated Exam",
      })

      expect(result.success).toBe(true)
    })

    it("returns error for completed exams", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
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
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: mockSchoolId,
        _count: { results: 0 },
      } as any)
      vi.mocked(db.exam.deleteMany).mockResolvedValue({ count: 1 } as any)

      const result = await deleteExam({ id: "exam-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deletion of exams with results", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
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
        { id: "1", title: "Exam 1", schoolId: mockSchoolId },
        { id: "2", title: "Exam 2", schoolId: mockSchoolId },
      ]

      vi.mocked(db.exam.findMany).mockResolvedValue(mockExams as any)
      vi.mocked(db.exam.count).mockResolvedValue(2)

      const result = await getExams({})

      expect(result.success).toBe(true)
    })
  })
})
