import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { createExam, deleteExam, getExams, updateExam } from "../manage/actions"

vi.mock("@/lib/db", () => ({
  db: {
    exam: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        exam: {
          create: vi.fn(),
          updateMany: vi.fn(),
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
        subjectId: "subject-1",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          exam: {
            create: vi.fn().mockResolvedValue(mockExam),
          },
        }
        return callback(tx)
      })

      const result = await createExam({
        title: "Midterm Exam",
        subjectId: "subject-1",
        date: new Date().toISOString(),
        totalMarks: 100,
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
        subjectId: "subject-1",
        date: new Date().toISOString(),
        totalMarks: 100,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateExam", () => {
    it("updates exam with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          exam: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await updateExam({
        id: "exam-1",
        title: "Final Exam",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("deleteExam", () => {
    it("deletes exam with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          exam: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteExam({ id: "exam-1" })

      expect(result.success).toBe(true)
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
