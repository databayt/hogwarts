// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import {
  createCatalogChapter,
  createCatalogLesson,
  createCatalogSubject,
  deleteCatalogChapter,
  deleteCatalogLesson,
  deleteCatalogSubject,
  reorderCatalogChapters,
  reorderCatalogLessons,
  updateCatalogChapter,
  updateCatalogLesson,
  updateCatalogSubject,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogSubject: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    catalogChapter: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    catalogLesson: {
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
  })

  // ==========================================================================
  // createCatalogSubject
  // ==========================================================================

  describe("createCatalogSubject", () => {
    it("creates subject with valid FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogSubject.create).mockResolvedValue({
        id: "subject-1",
        name: "Math",
      } as any)

      const formData = makeSubjectFormData()
      const result = await createCatalogSubject(formData)

      expect(result).toEqual({
        success: true,
        subject: { id: "subject-1", name: "Math" },
      })
      expect(db.catalogSubject.create).toHaveBeenCalledWith({
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
      vi.mocked(db.catalogSubject.create).mockResolvedValue({
        id: "subject-2",
      } as any)

      const formData = makeSubjectFormData()
      formData.append("levels", "MIDDLE")
      formData.append("grades", "2")
      formData.append("schoolTypes", "PRIVATE")

      await createCatalogSubject(formData)

      expect(db.catalogSubject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          levels: expect.arrayContaining(["ELEMENTARY", "MIDDLE"]),
          grades: expect.arrayContaining([1, 2]),
          schoolTypes: expect.arrayContaining(["PUBLIC", "PRIVATE"]),
        }),
      })
    })

    it("revalidates /catalog path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogSubject.create).mockResolvedValue({
        id: "subject-1",
      } as any)

      await createCatalogSubject(makeSubjectFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createCatalogSubject(makeSubjectFormData())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.catalogSubject.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateCatalogSubject
  // ==========================================================================

  describe("updateCatalogSubject", () => {
    it("updates subject by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogSubject.update).mockResolvedValue({
        id: "subject-1",
        name: "Updated Math",
      } as any)

      const formData = makeSubjectFormData({ name: "Updated Math" })
      const result = await updateCatalogSubject("subject-1", formData)

      expect(result).toEqual({
        success: true,
        subject: { id: "subject-1", name: "Updated Math" },
      })
      expect(db.catalogSubject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: expect.objectContaining({ name: "Updated Math" }),
      })
    })

    it("revalidates /catalog and /catalog/:id paths", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogSubject.update).mockResolvedValue({
        id: "subject-1",
      } as any)

      await updateCatalogSubject("subject-1", makeSubjectFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        updateCatalogSubject("subject-1", makeSubjectFormData())
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.catalogSubject.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteCatalogSubject
  // ==========================================================================

  describe("deleteCatalogSubject", () => {
    it("deletes subject by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogSubject.delete).mockResolvedValue({} as any)

      const result = await deleteCatalogSubject("subject-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogSubject.delete).toHaveBeenCalledWith({
        where: { id: "subject-1" },
      })
    })

    it("revalidates /catalog path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogSubject.delete).mockResolvedValue({} as any)

      await deleteCatalogSubject("subject-1")

      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteCatalogSubject("subject-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.catalogSubject.delete).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // createCatalogChapter
  // ==========================================================================

  describe("createCatalogChapter", () => {
    it("creates chapter with valid FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.create).mockResolvedValue({
        id: "chapter-1",
        name: "Chapter 1",
      } as any)
      vi.mocked(db.catalogChapter.count).mockResolvedValue(3)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      const formData = makeChapterFormData()
      const result = await createCatalogChapter(formData)

      expect(result).toEqual({
        success: true,
        chapter: { id: "chapter-1", name: "Chapter 1" },
      })
      expect(db.catalogChapter.create).toHaveBeenCalledWith({
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
      vi.mocked(db.catalogChapter.create).mockResolvedValue({
        id: "chapter-1",
      } as any)
      vi.mocked(db.catalogChapter.count).mockResolvedValue(5)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await createCatalogChapter(makeChapterFormData())

      expect(db.catalogChapter.count).toHaveBeenCalledWith({
        where: { subjectId: "subject-1" },
      })
      expect(db.catalogSubject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalChapters: 5 },
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.create).mockResolvedValue({
        id: "chapter-1",
      } as any)
      vi.mocked(db.catalogChapter.count).mockResolvedValue(1)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await createCatalogChapter(makeChapterFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createCatalogChapter(makeChapterFormData())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.catalogChapter.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateCatalogChapter
  // ==========================================================================

  describe("updateCatalogChapter", () => {
    it("updates chapter by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.update).mockResolvedValue({
        id: "chapter-1",
        subjectId: "subject-1",
        name: "Updated Chapter",
      } as any)

      const formData = makeChapterFormData({ name: "Updated Chapter" })
      const result = await updateCatalogChapter("chapter-1", formData)

      expect(result).toEqual({
        success: true,
        chapter: {
          id: "chapter-1",
          subjectId: "subject-1",
          name: "Updated Chapter",
        },
      })
      expect(db.catalogChapter.update).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        data: expect.objectContaining({ name: "Updated Chapter" }),
      })
    })

    it("revalidates path using returned chapter subjectId", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.update).mockResolvedValue({
        id: "chapter-1",
        subjectId: "subject-42",
      } as any)

      await updateCatalogChapter("chapter-1", makeChapterFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-42")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        updateCatalogChapter("chapter-1", makeChapterFormData())
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.catalogChapter.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteCatalogChapter
  // ==========================================================================

  describe("deleteCatalogChapter", () => {
    it("deletes chapter by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogChapter.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogChapter.count).mockResolvedValue(2)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      const result = await deleteCatalogChapter("chapter-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogChapter.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        select: { subjectId: true },
      })
      expect(db.catalogChapter.delete).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
      })
    })

    it("updates denormalized totalChapters count after deletion", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogChapter.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogChapter.count).mockResolvedValue(4)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await deleteCatalogChapter("chapter-1")

      expect(db.catalogChapter.count).toHaveBeenCalledWith({
        where: { subjectId: "subject-1" },
      })
      expect(db.catalogSubject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalChapters: 4 },
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogChapter.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogChapter.count).mockResolvedValue(0)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await deleteCatalogChapter("chapter-1")

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteCatalogChapter("chapter-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.catalogChapter.findUniqueOrThrow).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // createCatalogLesson
  // ==========================================================================

  describe("createCatalogLesson", () => {
    it("creates lesson with valid FormData", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.create).mockResolvedValue({
        id: "lesson-1",
        name: "Lesson 1",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(3) // chapter lesson count
        .mockResolvedValueOnce(10) // total subject lesson count
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      const formData = makeLessonFormData()
      const result = await createCatalogLesson(formData)

      expect(result).toEqual({
        success: true,
        lesson: { id: "lesson-1", name: "Lesson 1" },
      })
      expect(db.catalogLesson.create).toHaveBeenCalledWith({
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
      vi.mocked(db.catalogLesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(7) // chapter lesson count
        .mockResolvedValueOnce(20) // total subject lesson count
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await createCatalogLesson(makeLessonFormData())

      expect(db.catalogChapter.update).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        data: { totalLessons: 7 },
      })
    })

    it("updates subject totalLessons denormalized count", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(3) // chapter lesson count
        .mockResolvedValueOnce(15) // total subject lesson count
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await createCatalogLesson(makeLessonFormData())

      expect(db.catalogSubject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalLessons: 15 },
      })
    })

    it("parses durationMinutes from FormData when provided", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      const formData = makeLessonFormData({ durationMinutes: "45" })
      await createCatalogLesson(formData)

      expect(db.catalogLesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ durationMinutes: 45 }),
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.create).mockResolvedValue({
        id: "lesson-1",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await createCatalogLesson(makeLessonFormData())

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createCatalogLesson(makeLessonFormData())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.catalogLesson.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateCatalogLesson
  // ==========================================================================

  describe("updateCatalogLesson", () => {
    it("updates lesson by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.update).mockResolvedValue({
        id: "lesson-1",
        chapterId: "chapter-1",
        name: "Updated Lesson",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)

      const formData = makeLessonFormData({ name: "Updated Lesson" })
      const result = await updateCatalogLesson("lesson-1", formData)

      expect(result).toEqual({
        success: true,
        lesson: {
          id: "lesson-1",
          chapterId: "chapter-1",
          name: "Updated Lesson",
        },
      })
      expect(db.catalogLesson.update).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        data: expect.objectContaining({ name: "Updated Lesson" }),
      })
    })

    it("looks up chapter to revalidate correct subject path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.update).mockResolvedValue({
        id: "lesson-1",
        chapterId: "chapter-99",
      } as any)
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-55",
      } as any)

      await updateCatalogLesson("lesson-1", makeLessonFormData())

      expect(db.catalogChapter.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "chapter-99" },
        select: { subjectId: true },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-55")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        updateCatalogLesson("lesson-1", makeLessonFormData())
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.catalogLesson.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteCatalogLesson
  // ==========================================================================

  describe("deleteCatalogLesson", () => {
    it("deletes lesson by id", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.catalogLesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(2) // chapter lesson count
        .mockResolvedValueOnce(8) // total subject lesson count
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      const result = await deleteCatalogLesson("lesson-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogLesson.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        select: {
          chapterId: true,
          chapter: { select: { subjectId: true } },
        },
      })
      expect(db.catalogLesson.delete).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
      })
    })

    it("updates chapter totalLessons denormalized count after deletion", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.catalogLesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(4) // chapter lesson count
        .mockResolvedValueOnce(12) // total subject lesson count
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await deleteCatalogLesson("lesson-1")

      expect(db.catalogChapter.update).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        data: { totalLessons: 4 },
      })
    })

    it("updates subject totalLessons denormalized count after deletion", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.catalogLesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(2) // chapter lesson count
        .mockResolvedValueOnce(9) // total subject lesson count
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await deleteCatalogLesson("lesson-1")

      expect(db.catalogSubject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { totalLessons: 9 },
      })
    })

    it("revalidates /catalog/:subjectId path", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogLesson.findUniqueOrThrow).mockResolvedValue({
        chapterId: "chapter-1",
        chapter: { subjectId: "subject-1" },
      } as any)
      vi.mocked(db.catalogLesson.delete).mockResolvedValue({} as any)
      vi.mocked(db.catalogLesson.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
      vi.mocked(db.catalogChapter.update).mockResolvedValue({} as any)
      vi.mocked(db.catalogSubject.update).mockResolvedValue({} as any)

      await deleteCatalogLesson("lesson-1")

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteCatalogLesson("lesson-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )

      expect(db.catalogLesson.findUniqueOrThrow).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // reorderCatalogChapters
  // ==========================================================================

  describe("reorderCatalogChapters", () => {
    it("reorders chapters via $transaction", async () => {
      mockAuthSuccess()
      vi.mocked(db.$transaction).mockResolvedValue([])

      const chapters = [
        { id: "ch-1", position: 0 },
        { id: "ch-2", position: 1 },
        { id: "ch-3", position: 2 },
      ]

      const result = await reorderCatalogChapters("subject-1", chapters)

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

      await reorderCatalogChapters("subject-1", [{ id: "ch-1", position: 0 }])

      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-1")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        reorderCatalogChapters("subject-1", [{ id: "ch-1", position: 0 }])
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // reorderCatalogLessons
  // ==========================================================================

  describe("reorderCatalogLessons", () => {
    it("reorders lessons via $transaction", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-1",
      } as any)
      vi.mocked(db.$transaction).mockResolvedValue([])

      const lessons = [
        { id: "ls-1", position: 0 },
        { id: "ls-2", position: 1 },
      ]

      const result = await reorderCatalogLessons("chapter-1", lessons)

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()])
      )
    })

    it("looks up chapter to determine subject for revalidation", async () => {
      mockAuthSuccess()
      vi.mocked(db.catalogChapter.findUniqueOrThrow).mockResolvedValue({
        subjectId: "subject-42",
      } as any)
      vi.mocked(db.$transaction).mockResolvedValue([])

      await reorderCatalogLessons("chapter-1", [{ id: "ls-1", position: 0 }])

      expect(db.catalogChapter.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "chapter-1" },
        select: { subjectId: true },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/subject-42")
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(
        reorderCatalogLessons("chapter-1", [{ id: "ls-1", position: 0 }])
      ).rejects.toThrow("Unauthorized: DEVELOPER role required")

      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })
})
