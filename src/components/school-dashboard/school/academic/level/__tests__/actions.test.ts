// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createYearLevel,
  deleteYearLevel,
  getYearLevelOptions,
  getYearLevels,
  updateYearLevel,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    yearLevel: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/content-display", () => ({
  getDisplayText: vi.fn(
    (text: string, _from: string, _to: string, _schoolId: string) =>
      Promise.resolve(text)
  ),
}))

// ============================================================================
// Helpers
// ============================================================================

const SCHOOL_ID = "school-1"

function mockAdminContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    role: "ADMIN",
    requestId: null,
    isPlatformAdmin: false,
  })
}

function mockStudentContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    role: "STUDENT",
    requestId: null,
    isPlatformAdmin: false,
  })
}

function mockNoSchoolContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    role: null,
    requestId: null,
    isPlatformAdmin: false,
  })
}

const validInput = {
  levelName: "Grade 10",
  levelOrder: 10,
  lang: "en" as const,
}

// ============================================================================
// Tests
// ============================================================================

describe("Year Level Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createYearLevel
  // ==========================================================================

  describe("createYearLevel", () => {
    it("creates year level with valid input", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst)
        .mockResolvedValueOnce(null) // name check
        .mockResolvedValueOnce(null) // order check
      vi.mocked(db.yearLevel.create).mockResolvedValue({
        id: "level-1",
      } as any)

      const result = await createYearLevel(validInput)

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual({ id: "level-1" })
    })

    it("rejects missing level name (Zod validation)", async () => {
      mockAdminContext()

      const result = await createYearLevel({
        ...validInput,
        levelName: "",
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Level name")
    })

    it("prevents duplicate year level name", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce({
        id: "existing",
      } as any)

      const result = await createYearLevel(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("already exists")
    })

    it("prevents duplicate level order", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst)
        .mockResolvedValueOnce(null) // name check passes
        .mockResolvedValueOnce({ id: "existing" } as any) // order check fails

      const result = await createYearLevel(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("order")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await createYearLevel(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await createYearLevel(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Missing school")
    })
  })

  // ==========================================================================
  // updateYearLevel
  // ==========================================================================

  describe("updateYearLevel", () => {
    it("updates year level", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst)
        .mockResolvedValueOnce({ id: "level-1" } as any) // exists check
        .mockResolvedValueOnce(null) // name duplicate check
      vi.mocked(db.yearLevel.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updateYearLevel({
        id: "level-1",
        levelName: "Grade 11",
      })

      expect(result.success).toBe(true)
    })

    it("returns error for non-existent level", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)

      const result = await updateYearLevel({
        id: "nonexistent",
        levelName: "Grade 11",
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await updateYearLevel({
        id: "level-1",
        levelName: "Grade 11",
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // deleteYearLevel
  // ==========================================================================

  describe("deleteYearLevel", () => {
    it("deletes year level without dependencies", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
        id: "level-1",
        _count: { batches: 0, studentYearLevels: 0 },
      } as any)
      vi.mocked(db.yearLevel.deleteMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await deleteYearLevel({ id: "level-1" })

      expect(result.success).toBe(true)
    })

    it("blocks deletion when batches exist", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
        id: "level-1",
        _count: { batches: 3, studentYearLevels: 0 },
      } as any)

      const result = await deleteYearLevel({ id: "level-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Cannot delete")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await deleteYearLevel({ id: "level-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // getYearLevels
  // ==========================================================================

  describe("getYearLevels", () => {
    it("returns levels for current school (no RBAC)", async () => {
      mockAdminContext()
      const mockRows = [
        {
          id: "l1",
          levelName: "Grade 10",
          lang: "en",
          levelOrder: 10,
          createdAt: new Date(),
          _count: { batches: 2, studentYearLevels: 50 },
        },
      ]
      vi.mocked(db.yearLevel.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.yearLevel.count).mockResolvedValue(1)

      const result = await getYearLevels()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.rows).toHaveLength(1)
        expect(result.data?.total).toBe(1)
      }
    })
  })

  // ==========================================================================
  // getYearLevelOptions
  // ==========================================================================

  describe("getYearLevelOptions", () => {
    it("returns id/levelName/lang/levelOrder", async () => {
      mockAdminContext()
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([
        { id: "l1", levelName: "Grade 10", lang: "en", levelOrder: 10 },
      ] as any)

      const result = await getYearLevelOptions()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([
          { id: "l1", levelName: "Grade 10", lang: "en", levelOrder: 10 },
        ])
      }
    })
  })
})
