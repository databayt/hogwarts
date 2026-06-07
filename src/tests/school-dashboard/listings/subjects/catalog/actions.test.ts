// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  bulkSelectSubjects,
  getSchoolCatalogSelections,
  toggleContentOverride,
  toggleSubjectSelection,
  updateSubjectSelection,
} from "@/components/school-dashboard/listings/subjects/catalog/actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolSubjectSelection: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    catalogSubject: {
      update: vi.fn(),
    },
    schoolContentOverride: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// ============================================================================
// Helpers
// ============================================================================

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "ADMIN", schoolId: "school-1" },
}

const DEV_SESSION = {
  user: { id: "dev-1", role: "DEVELOPER", schoolId: null },
}

const TEACHER_SESSION = {
  user: { id: "teacher-1", role: "TEACHER", schoolId: "school-1" },
}

const NO_USER_SESSION = {
  user: { id: undefined, role: "ADMIN", schoolId: "school-1" },
}

const SCHOOL_CONTEXT = { schoolId: "school-1" }

function setupAuth(session: any = ADMIN_SESSION) {
  vi.mocked(auth).mockResolvedValue(session)
  vi.mocked(getTenantContext).mockResolvedValue(SCHOOL_CONTEXT as any)
}

// ============================================================================
// Tests
// ============================================================================

describe("Catalog Subject Selection Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // toggleSubjectSelection
  // ==========================================================================

  describe("toggleSubjectSelection", () => {
    it("adds subject selection when not exists", async () => {
      setupAuth()
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.subjectSelection.create).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.subjectSelection.count).mockResolvedValue(1)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const result = await toggleSubjectSelection("cat-1", "grade-1")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ selected: true })
      expect(db.subjectSelection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: "school-1",
          catalogSubjectId: "cat-1",
          gradeId: "grade-1",
          streamId: null,
          isRequired: true,
          isActive: true,
        }),
      })
    })

    it("removes subject selection when already exists", async () => {
      setupAuth()
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.subjectSelection.delete).mockResolvedValue({} as any)
      vi.mocked(db.subjectSelection.count).mockResolvedValue(0)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const result = await toggleSubjectSelection("cat-1", "grade-1")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ selected: false })
      expect(db.subjectSelection.delete).toHaveBeenCalledWith({
        where: { id: "sel-1" },
      })
    })

    it("updates usageCount after toggle", async () => {
      setupAuth()
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.subjectSelection.create).mockResolvedValue({} as any)
      vi.mocked(db.subjectSelection.count).mockResolvedValue(3)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await toggleSubjectSelection("cat-1", "grade-1")

      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: { usageCount: 3 },
      })
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      setupAuth(TEACHER_SESSION)

      const result = await toggleSubjectSelection("cat-1", "grade-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER")
      expect(db.subjectSelection.findFirst).not.toHaveBeenCalled()
    })

    it("requires school context", async () => {
      vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
      } as any)

      const result = await toggleSubjectSelection("cat-1", "grade-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("school context")
    })
  })

  // ==========================================================================
  // bulkSelectSubjects
  // ==========================================================================

  describe("bulkSelectSubjects", () => {
    it("bulk adds selections, skips existing", async () => {
      setupAuth()
      // First subject doesn't exist, second already exists
      vi.mocked(db.subjectSelection.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing" } as any)
      vi.mocked(db.subjectSelection.create).mockResolvedValue({} as any)
      vi.mocked(db.subjectSelection.count).mockResolvedValue(1)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const result = await bulkSelectSubjects(["cat-1", "cat-2"], "grade-1")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ added: 1 })
      // Only one create call (cat-1), cat-2 skipped
      expect(db.subjectSelection.create).toHaveBeenCalledTimes(1)
    })

    it("updates usageCount for all affected subjects", async () => {
      setupAuth()
      vi.mocked(db.subjectSelection.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      vi.mocked(db.subjectSelection.create).mockResolvedValue({} as any)
      vi.mocked(db.subjectSelection.count).mockResolvedValue(1)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      await bulkSelectSubjects(["cat-1", "cat-2"], "grade-1")

      // usageCount updated for both subjects
      expect(db.subject.update).toHaveBeenCalledTimes(2)
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: { usageCount: 1 },
      })
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "cat-2" },
        data: { usageCount: 1 },
      })
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      setupAuth(TEACHER_SESSION)

      const result = await bulkSelectSubjects(["cat-1"], "grade-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER")
    })
  })

  // ==========================================================================
  // updateSubjectSelection
  // ==========================================================================

  describe("updateSubjectSelection", () => {
    it("updates selection with valid data", async () => {
      setupAuth()
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
        id: "sel-1",
        schoolId: "school-1",
      } as any)
      vi.mocked(db.subjectSelection.update).mockResolvedValue({} as any)

      const result = await updateSubjectSelection("sel-1", {
        isRequired: false,
        weeklyPeriods: 5,
      })

      expect(result.success).toBe(true)
      expect(db.subjectSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { isRequired: false, weeklyPeriods: 5 },
      })
    })

    it("validates input with Zod (rejects invalid weeklyPeriods)", async () => {
      setupAuth()

      const result = await updateSubjectSelection("sel-1", {
        weeklyPeriods: -1,
      } as any)

      expect(result.success).toBe(false)
      // Should fail validation before DB query
      expect(db.subjectSelection.findFirst).not.toHaveBeenCalled()
    })

    it("returns error for non-existent selection", async () => {
      setupAuth()
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue(null)

      const result = await updateSubjectSelection("sel-999", {
        isRequired: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Selection not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      setupAuth(TEACHER_SESSION)

      const result = await updateSubjectSelection("sel-1", {
        isRequired: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER")
    })
  })

  // ==========================================================================
  // toggleContentOverride
  // ==========================================================================

  describe("toggleContentOverride", () => {
    it("creates override when hiding content", async () => {
      setupAuth()
      vi.mocked(db.contentOverride.findFirst).mockResolvedValue(null)
      vi.mocked(db.contentOverride.create).mockResolvedValue({} as any)

      const result = await toggleContentOverride({
        catalogChapterId: "ch-1",
        isHidden: true,
        reason: "Not in curriculum",
      })

      expect(result.success).toBe(true)
      expect(db.contentOverride.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: "school-1",
          catalogChapterId: "ch-1",
          catalogLessonId: null,
          isHidden: true,
          reason: "Not in curriculum",
          overriddenBy: "admin-1",
        }),
      })
    })

    it("removes override when unhiding", async () => {
      setupAuth()
      vi.mocked(db.contentOverride.findFirst).mockResolvedValue({
        id: "override-1",
      } as any)
      vi.mocked(db.contentOverride.delete).mockResolvedValue({} as any)

      const result = await toggleContentOverride({
        catalogChapterId: "ch-1",
        isHidden: false,
      })

      expect(result.success).toBe(true)
      expect(db.contentOverride.delete).toHaveBeenCalledWith({
        where: { id: "override-1" },
      })
    })

    it("updates existing override", async () => {
      setupAuth()
      vi.mocked(db.contentOverride.findFirst).mockResolvedValue({
        id: "override-1",
      } as any)
      vi.mocked(db.contentOverride.update).mockResolvedValue({} as any)

      const result = await toggleContentOverride({
        catalogLessonId: "les-1",
        isHidden: true,
        reason: "Updated reason",
      })

      expect(result.success).toBe(true)
      expect(db.contentOverride.update).toHaveBeenCalledWith({
        where: { id: "override-1" },
        data: {
          isHidden: true,
          reason: "Updated reason",
          overriddenBy: "admin-1",
        },
      })
    })

    it("requires userId (rejects missing user id)", async () => {
      setupAuth(NO_USER_SESSION)

      const result = await toggleContentOverride({
        catalogChapterId: "ch-1",
        isHidden: true,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Missing user identity")
    })

    it("requires either chapter or lesson", async () => {
      setupAuth()

      const result = await toggleContentOverride({
        isHidden: true,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("chapter or lesson")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      setupAuth(TEACHER_SESSION)

      const result = await toggleContentOverride({
        catalogChapterId: "ch-1",
        isHidden: true,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER")
    })
  })

  // ==========================================================================
  // getSchoolCatalogSelections
  // ==========================================================================

  describe("getSchoolCatalogSelections", () => {
    it("returns selections for current school", async () => {
      setupAuth()
      const mockSelections = [
        {
          id: "sel-1",
          catalogSubjectId: "cat-1",
          gradeId: "grade-1",
          subject: { id: "cat-1", name: "Math" },
          grade: { id: "grade-1", name: "Grade 1", gradeNumber: 1 },
        },
      ]
      vi.mocked(db.subjectSelection.findMany).mockResolvedValue(
        mockSelections as any
      )

      const result = await getSchoolCatalogSelections()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSelections)
      expect(db.subjectSelection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: "school-1" },
        })
      )
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      setupAuth(TEACHER_SESSION)

      const result = await getSchoolCatalogSelections()

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER")
    })
  })
})
