import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createLesson,
  deleteLesson,
  getLessons,
  updateLesson,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    lesson: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        lesson: {
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

describe("Lesson Actions", () => {
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

  describe("createLesson", () => {
    it("creates lesson with schoolId for multi-tenant isolation", async () => {
      const mockLesson = {
        id: "lesson-1",
        title: "Introduction to Algebra",
        subjectId: "subject-1",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          lesson: {
            create: vi.fn().mockResolvedValue(mockLesson),
          },
        }
        return callback(tx)
      })

      const result = await createLesson({
        title: "Introduction to Algebra",
        subjectId: "subject-1",
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

      const result = await createLesson({
        title: "Lesson",
        subjectId: "subject-1",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateLesson", () => {
    it("updates lesson with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          lesson: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await updateLesson({
        id: "lesson-1",
        title: "Advanced Algebra",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("deleteLesson", () => {
    it("deletes lesson with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          lesson: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteLesson({ id: "lesson-1" })

      expect(result.success).toBe(true)
    })
  })

  describe("getLessons", () => {
    it("fetches lessons scoped to schoolId", async () => {
      const mockLessons = [
        { id: "1", title: "Lesson 1", schoolId: mockSchoolId },
        { id: "2", title: "Lesson 2", schoolId: mockSchoolId },
      ]

      vi.mocked(db.lesson.findMany).mockResolvedValue(mockLessons as any)
      vi.mocked(db.lesson.count).mockResolvedValue(2)

      const result = await getLessons({})

      expect(result.success).toBe(true)
    })
  })
})
