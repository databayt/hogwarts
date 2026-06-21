// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  createChapter,
  createLesson,
  createSubject,
  deleteChapter,
  deleteLesson,
  deleteSubject,
  reorderChapters,
  reorderLessons,
  updateChapter,
  updateLesson,
  updateSubject,
} from "@/components/saas-dashboard/catalog/actions"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    subject: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    chapter: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    lesson: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireDeveloper: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockAuthSuccess() {
  vi.mocked(requireDeveloper).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockAuthFailure() {
  vi.mocked(requireDeveloper).mockRejectedValue(
    new Error("Unauthorized: DEVELOPER role required")
  )
}

function makeSubjectFormData(overrides: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    name: "Math",
    slug: "math",
    department: "Science",
    level: "ELEMENTARY",
    curriculum: "us",
    sortOrder: "0",
    ...overrides,
  }
  for (const [key, value] of Object.entries(defaults)) {
    data.set(key, String(value))
  }
  data.append("levels", "ELEMENTARY")
  data.append("grades", "1")
  data.append("schoolTypes", "PUBLIC")
  return data
}

function makeChapterFormData(overrides: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    subjectId: "subject-1",
    name: "Chapter 1",
    slug: "chapter-1",
    sequenceOrder: "0",
    ...overrides,
  }
  for (const [key, value] of Object.entries(defaults)) {
    data.set(key, String(value))
  }
  return data
}

function makeLessonFormData(overrides: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    chapterId: "chapter-1",
    name: "Lesson 1",
    slug: "lesson-1",
    sequenceOrder: "0",
    ...overrides,
  }
  for (const [key, value] of Object.entries(defaults)) {
    data.set(key, String(value))
  }
  return data
}

// ============================================================================
// Tests
// ============================================================================

describe("Catalog Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Interactive $transaction(cb) runs the callback with the db mock as `tx`
    // so per-table mocks apply inside the transaction; the array form (used by
    // the reorder actions) just resolves to its argument.
    vi.mocked(db.$transaction).mockImplementation((arg: any) =>
      typeof arg === "function" ? arg(db) : Promise.resolve(arg)
    )
  })

  // ==========================================================================
  // createSubject
  // ==========================================================================

  describe("createSubject", () => {
    it("creates subject with valid FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.create).mockResolvedValue({
        id: "subject-1",
        name: "Math",
      } as any)

      const formData = makeSubjectFormData()
      const result = await createSubject(formData)

      expect(result).toEqual({
        success: true,
        subject: { id: "subject-1", name: "Math" },
      })
      expect(db.subject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Math",
          slug: "math",
          department: "Science",
          curriculum: "us",
        }),
      })
    })

    it("parses levels, grades, and schoolTypes as arrays from FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.create).mockResolvedValue({
        id: "subject-2",
      } as any)

      const formData = makeSubjectFormData()
      formData.append("levels", "MIDDLE")
      formData.append("grades", "2")
      formData.append("schoolTypes", "PRIVATE")

      await createSubject(formData)

      expect(db.subject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          levels: expect.arrayContaining(["ELEMENTARY", "MIDDLE"]),
          grades: expect.arrayContaining([1, 2]),
          schoolTypes: expect.arrayContaining(["PUBLIC", "PRIVATE"]),
        }),
      })
    })

    it("revalidates /catalog path", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.create).mockResolvedValue({
        id: "subject-1",
      } as any)

      await createSubject(makeSubjectFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createSubject(makeSubjectFormData())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.subject.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateSubject
  // ==========================================================================

  describe("updateSubject", () => {
    it("updates subject by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.update).mockResolvedValue({
        id: "subject-1",
        name: "Updated Math",
      } as any)

      const formData = makeSubjectFormData({ name: "Updated Math" })
      const result = await updateSubject("subject-1", formData)

      expect(result).toEqual({
        success: true,
        subject: { id: "subject-1", name: "Updated Math" },
      })
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: expect.objectContaining({ name: "Updated Math" }),
      })
    })

    it("revalidates /catalog and /catalog/:id paths", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.update).mockResolvedValue({
        id: "subject-1",
      } as any)

      await updateSubject("subject-1", makeSubjectFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        updateSubject("subject-1", makeSubjectFormData())
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.subject.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteSubject
  // ==========================================================================

  describe("deleteSubject", () => {
    it("deletes subject by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.delete).mockResolvedValue({} as any)

      const result = await deleteSubject("subject-1")

      expect(result).toEqual({ success: true })
      expect(db.subject.delete).toHaveBeenCalledWith({
        where: { id: "subject-1" },
      })
    })

    it("revalidates /catalog path", async () => {
      mockAuthSuccess()
      vi.mocked(db.subject.delete).mockResolvedValue({} as any)

      await deleteSubject("subject-1")

      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteSubject("subject-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.subject.delete).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // createChapter
  // ==========================================================================

  describe("createChapter", () => {
    it("creates chapter with valid FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.create).mockResolvedValue({
        id: "chapter-1",
        name: "Chapter 1",
      } as any)
      vi.mocked(db.chapter.count).mockResolvedValue(3)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const formData = makeChapterFormData()
      const result = await createChapter(formData)

      expect(result).toEqual({
        success: true,
        chapter: { id: "chapter-1", name: "Chapter 1" },
      })
      expect(db.chapter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subjectId: "subject-1",
          name: "Chapter 1",
          slug: "chapter-1",
          sequenceOrder: 0,
        }),
      })
    })

    it("updates denormalized totalChapters count on subject", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.create).mockResolvedValue({
        id: "chapter-1",
      } as any)
      vi.mocked(db.chapter.count).mockResolvedValue(5)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await createChapter(makeChapterFormData())

      expect(db.chapter.count).toHaveBeenCalledWith({
        where: { subjectId: "subject-1" },
      })
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalChapters: 5 },
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.create).mockResolvedValue({
        id: "chapter-1",
      } as any)
      vi.mocked(db.chapter.count).mockResolvedValue(1)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await createChapter(makeChapterFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createChapter(makeChapterFormData())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.chapter.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateChapter
  // ==========================================================================

  describe("updateChapter", () => {
    it("updates chapter by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.update).mockResolvedValue({
        id: "chapter-1",
        subjectId: "subject-1",
        name: "Updated Chapter",
      } as any)

      const formData = makeChapterFormData({ name: "Updated Chapter" })
      const result = await updateChapter("chapter-1", formData)

      expect(result).toEqual({
        success: true,
        chapter: {
          id: "chapter-1",
          subjectId: "subject-1",
          name: "Updated Chapter",
        },
      })
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        data: expect.objectContaining({ name: "Updated Chapter" }),
      })
    })

    it("revalidates path using returned chapter subjectId", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.update).mockResolvedValue({
        id: "chapter-1",
        subjectId: "subject-42",
      } as any)

      await updateChapter("chapter-1", makeChapterFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-42")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        updateChapter("chapter-1", makeChapterFormData())
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.chapter.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteChapter
  // ==========================================================================

  describe("deleteChapter", () => {
    it("deletes chapter by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.chapter.delete).mockResolvedValue({} as any)
      vi.mocked(db.chapter.count).mockResolvedValue(2)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const result = await deleteChapter("chapter-1")

      expect(result).toEqual({ success: true })
      expect(db.chapter.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        select: { subjectId: true },
      })
      expect(db.chapter.delete).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
      })
    })

    it("updates denormalized totalChapters count after deletion", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.chapter.delete).mockResolvedValue({} as any)
      vi.mocked(db.chapter.count).mockResolvedValue(4)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await deleteChapter("chapter-1")

      expect(db.chapter.count).toHaveBeenCalledWith({
        where: { subjectId: "subject-1" },
      })
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalChapters: 4 },
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.chapter.delete).mockResolvedValue({} as any)
      vi.mocked(db.chapter.count).mockResolvedValue(0)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await deleteChapter("chapter-1")

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteChapter("chapter-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.chapter.findUniqueOrThrow).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // createLesson
  // ==========================================================================

  describe("createLesson", () => {
    it("creates lesson with valid FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.create).mockResolvedValue({
        id: "lesson-1",
        name: "Lesson 1",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(3) // chapter lesson count
        .mockResolvedValueOnce(10) // total subject lesson count
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const formData = makeLessonFormData()
      const result = await createLesson(formData)

      expect(result).toEqual({
        success: true,
        lesson: { id: "lesson-1", name: "Lesson 1" },
      })
      expect(db.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          chapterId: "chapter-1",
          name: "Lesson 1",
          slug: "lesson-1",
          sequenceOrder: 0,
        }),
      })
    })

    it("updates chapter totalLessons denormalized count", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(7) // chapter lesson count
        .mockResolvedValueOnce(20) // total subject lesson count
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await createLesson(makeLessonFormData())

      expect(db.chapter.update).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        data: { totalLessons: 7 },
      })
    })

    it("updates subject totalLessons denormalized count", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(3) // chapter lesson count
        .mockResolvedValueOnce(15) // total subject lesson count
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await createLesson(makeLessonFormData())

      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalLessons: 15 },
      })
    })

    it("parses durationMinutes from FormData when provided", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const formData = makeLessonFormData({ durationMinutes: "45" })
      await createLesson(formData)

      expect(db.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ durationMinutes: 45 }),
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await createLesson(makeLessonFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createLesson(makeLessonFormData())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.lesson.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateLesson
  // ==========================================================================

  describe("updateLesson", () => {
    it("updates lesson by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.update).mockResolvedValue({
        id: "lesson-1",
        chapterId: "chapter-1",
        name: "Updated Lesson",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)

      const formData = makeLessonFormData({ name: "Updated Lesson" })
      const result = await updateLesson("lesson-1", formData)

      expect(result).toEqual({
        success: true,
        lesson: {
          id: "lesson-1",
          chapterId: "chapter-1",
          name: "Updated Lesson",
        },
      })
      expect(db.lesson.update).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        data: expect.objectContaining({ name: "Updated Lesson" }),
      })
    })

    it("looks up chapter to revalidate correct subject path", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.update).mockResolvedValue({
        id: "lesson-1",
        chapterId: "chapter-99",
      } as any)
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-55",
      } as any)

      await updateLesson("lesson-1", makeLessonFormData())

      expect(db.chapter.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "chapter-99" },
        select: { subjectId: true },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-55")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        updateLesson("lesson-1", makeLessonFormData())
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.lesson.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteLesson
  // ==========================================================================

  describe("deleteLesson", () => {
    it("deletes lesson by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.lesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(2) // chapter lesson count
        .mockResolvedValueOnce(8) // total subject lesson count
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const result = await deleteLesson("lesson-1")

      expect(result).toEqual({ success: true })
      expect(db.lesson.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        select: {
          chapterId: true,
          chapter: { select: { subjectId: true } },
        },
      })
      expect(db.lesson.delete).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
      })
    })

    it("updates chapter totalLessons denormalized count after deletion", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.lesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(4) // chapter lesson count
        .mockResolvedValueOnce(12) // total subject lesson count
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await deleteLesson("lesson-1")

      expect(db.chapter.update).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        data: { totalLessons: 4 },
      })
    })

    it("updates subject totalLessons denormalized count after deletion", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.lesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(2) // chapter lesson count
        .mockResolvedValueOnce(9) // total subject lesson count
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await deleteLesson("lesson-1")

      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalLessons: 9 },
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.lesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.lesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.lesson.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await deleteLesson("lesson-1")

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteLesson("lesson-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.lesson.findUniqueOrThrow).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // reorderChapters
  // ==========================================================================

  describe("reorderChapters", () => {
    it("reorders chapters via $transaction", async () => {
      mockAuthSuccess()
      vi.mocked(db.$transaction).mockResolvedValue([])

      const chapters = [
        { id: "ch-1", position: 0 },
        { id: "ch-2", position: 1 },
        { id: "ch-3", position: 2 },
      ]

      const result = await reorderChapters("subject-1", chapters)

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
        ])
      )
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.$transaction).mockResolvedValue([])

      await reorderChapters("subject-1", [{ id: "ch-1", position: 0 }])

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        reorderChapters("subject-1", [{ id: "ch-1", position: 0 }])
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // reorderLessons
  // ==========================================================================

  describe("reorderLessons", () => {
    it("reorders lessons via $transaction", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.$transaction).mockResolvedValue([])

      const lessons = [
        { id: "ls-1", position: 0 },
        { id: "ls-2", position: 1 },
      ]

      const result = await reorderLessons("chapter-1", lessons)

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()])
      )
    })

    it("looks up chapter to determine subject for revalidation", async () => {
      mockAuthSuccess()
      vi.mocked(db.chapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-42",
      } as any)
      vi.mocked(db.$transaction).mockResolvedValue([])

      await reorderLessons("chapter-1", [{ id: "ls-1", position: 0 }])

      expect(db.chapter.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        select: { subjectId: true },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-42")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        reorderLessons("chapter-1", [{ id: "ls-1", position: 0 }])
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })
})
