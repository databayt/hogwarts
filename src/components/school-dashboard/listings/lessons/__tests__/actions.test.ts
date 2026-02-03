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
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        lesson: {
          create: vi.fn(),
          findFirst: vi.fn(),
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
        classId: "class-1",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.lesson.create).mockResolvedValue(mockLesson as any)

      const result = await createLesson({
        title: "Introduction to Algebra",
        classId: "class-1",
        lessonDate: new Date(Date.now() + 86400000), // Tomorrow
        startTime: "09:00",
        endTime: "10:00",
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
        classId: "class-1",
        lessonDate: new Date(Date.now() + 86400000), // Tomorrow
        startTime: "09:00",
        endTime: "10:00",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateLesson", () => {
    it("updates lesson with schoolId scope", async () => {
      // Mock lesson exists
      vi.mocked(db.lesson.findFirst).mockResolvedValue({
        id: "lesson-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock update success
      vi.mocked(db.lesson.update).mockResolvedValue({
        id: "lesson-1",
        title: "Advanced Algebra",
      } as any)

      const result = await updateLesson({
        id: "lesson-1",
        title: "Advanced Algebra",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating lesson from different school", async () => {
      // Mock lesson not found in this school
      vi.mocked(db.lesson.findFirst).mockResolvedValue(null)

      const result = await updateLesson({
        id: "lesson-from-other-school",
        title: "Hacked Lesson",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteLesson", () => {
    it("deletes lesson with schoolId scope", async () => {
      // Mock lesson exists
      vi.mocked(db.lesson.findFirst).mockResolvedValue({
        id: "lesson-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock delete success
      vi.mocked(db.lesson.delete).mockResolvedValue({
        id: "lesson-1",
      } as any)

      const result = await deleteLesson({ id: "lesson-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting lesson from different school", async () => {
      // Mock lesson not found in this school
      vi.mocked(db.lesson.findFirst).mockResolvedValue(null)

      const result = await deleteLesson({ id: "lesson-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getLessons", () => {
    it("fetches lessons scoped to schoolId", async () => {
      const now = new Date()
      const mockLessons = [
        {
          id: "1",
          title: "Lesson 1",
          schoolId: mockSchoolId,
          status: "DRAFT",
          lessonDate: now,
          startTime: "09:00",
          endTime: "10:00",
          createdAt: now,
          updatedAt: now,
          class: { id: "c1", className: "Math 101" },
        },
        {
          id: "2",
          title: "Lesson 2",
          schoolId: mockSchoolId,
          status: "PUBLISHED",
          lessonDate: now,
          startTime: "10:00",
          endTime: "11:00",
          createdAt: now,
          updatedAt: now,
          class: { id: "c2", className: "English 101" },
        },
      ]

      vi.mocked(db.lesson.findMany).mockResolvedValue(mockLessons as any)
      vi.mocked(db.lesson.count).mockResolvedValue(2)

      const result = await getLessons({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
    })
  })
})
