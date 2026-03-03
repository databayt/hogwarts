// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createYearLevel,
  deleteYearLevel,
  getYearLevels,
  updateYearLevel,
} from "../actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    yearLevel: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/content-display", () => ({
  getDisplayText: vi.fn().mockImplementation((text) => text),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

function mockAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "test-school",
    role: "ADMIN",
    locale: "en",
  })
}

function mockTeacher() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "TEACHER" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "test-school",
    role: "TEACHER",
    locale: "en",
  })
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null as any,
    subdomain: "",
    role: null as any,
    locale: "en",
  })
}

function makeFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return formData
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Year Level Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdmin()
  })

  // =========================================================================
  // getYearLevels
  // =========================================================================

  describe("getYearLevels", () => {
    it("returns year levels scoped to schoolId", async () => {
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([
        {
          id: "yl-1",
          schoolId: SCHOOL_ID,
          levelName: "Grade 1",
          lang: "en",
          levelOrder: 1,
          _count: { studentYearLevels: 25, batches: 2 },
        },
        {
          id: "yl-2",
          schoolId: SCHOOL_ID,
          levelName: "Grade 2",
          lang: "en",
          levelOrder: 2,
          _count: { studentYearLevels: 30, batches: 3 },
        },
      ] as any)

      const result = await getYearLevels("en")

      expect(result.success).toBe(true)
      expect(result.data?.yearLevels).toHaveLength(2)
      expect(db.yearLevel.findMany).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_ID },
        include: {
          _count: { select: { studentYearLevels: true, batches: true } },
        },
        orderBy: { levelOrder: "asc" },
      })
    })

    it("returns error when not authenticated", async () => {
      mockUnauthenticated()

      const result = await getYearLevels()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not authenticated")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockTeacher()

      const result = await getYearLevels()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Insufficient permissions")
    })
  })

  // =========================================================================
  // createYearLevel
  // =========================================================================

  describe("createYearLevel", () => {
    it("creates year level with schoolId", async () => {
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)
      vi.mocked(db.yearLevel.create).mockResolvedValue({
        id: "yl-new",
        schoolId: SCHOOL_ID,
        levelName: "Grade 5",
        lang: "en",
        levelOrder: 5,
      } as any)

      const formData = makeFormData({
        levelName: "Grade 5",
        lang: "en",
        levelOrder: "5",
      })

      const result = await createYearLevel(formData)

      expect(result.success).toBe(true)
      expect(result.data?.yearLevel?.id).toBe("yl-new")
      expect(db.yearLevel.create).toHaveBeenCalledWith({
        data: {
          schoolId: SCHOOL_ID,
          levelName: "Grade 5",
          lang: "en",
          levelOrder: 5,
        },
      })
    })

    it("rejects duplicate level name within school", async () => {
      // First findFirst call (name check) returns existing
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce({
        id: "yl-existing",
        levelName: "Grade 5",
      } as any)

      const formData = makeFormData({
        levelName: "Grade 5",
        lang: "en",
        levelOrder: "5",
      })

      const result = await createYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("A year level with this name already exists")
      expect(db.yearLevel.create).not.toHaveBeenCalled()
    })

    it("rejects duplicate level order within school", async () => {
      // First findFirst (name check) returns null
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce(null)
      // Second findFirst (order check) returns existing
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce({
        id: "yl-existing",
        levelOrder: 5,
      } as any)

      const formData = makeFormData({
        levelName: "Grade 5",
        lang: "en",
        levelOrder: "5",
      })

      const result = await createYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Level order 5 is already in use")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockTeacher()

      const formData = makeFormData({
        levelName: "Grade 5",
        lang: "en",
        levelOrder: "5",
      })

      const result = await createYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Insufficient permissions")
    })
  })

  // =========================================================================
  // updateYearLevel
  // =========================================================================

  describe("updateYearLevel", () => {
    it("updates year level with schoolId scope (updateMany)", async () => {
      // First findFirst: ownership check
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce({
        id: "yl-1",
        schoolId: SCHOOL_ID,
        levelName: "Grade 1",
        levelOrder: 1,
      } as any)
      // Second findFirst: duplicate name check → no duplicate
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.yearLevel.updateMany).mockResolvedValue({ count: 1 })

      const formData = makeFormData({
        id: "yl-1",
        levelName: "Grade One",
        lang: "en",
        levelOrder: "1",
      })

      const result = await updateYearLevel(formData)

      expect(result.success).toBe(true)
      // Verify updateMany with schoolId (defense-in-depth)
      expect(db.yearLevel.updateMany).toHaveBeenCalledWith({
        where: { id: "yl-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          levelName: "Grade One",
        }),
      })
    })

    it("returns not found for year level from different school", async () => {
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)

      const formData = makeFormData({
        id: "yl-other-school",
        levelName: "Grade 1",
        levelOrder: "1",
      })

      const result = await updateYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Year level not found")
      expect(db.yearLevel.updateMany).not.toHaveBeenCalled()
    })

    it("rejects duplicate name on update", async () => {
      // Ownership check returns existing
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce({
        id: "yl-1",
        schoolId: SCHOOL_ID,
        levelName: "Grade 1",
        levelOrder: 1,
      } as any)
      // Duplicate name check returns existing
      vi.mocked(db.yearLevel.findFirst).mockResolvedValueOnce({
        id: "yl-2",
        levelName: "Grade 2",
      } as any)

      const formData = makeFormData({
        id: "yl-1",
        levelName: "Grade 2",
        levelOrder: "1",
      })

      const result = await updateYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("A year level with this name already exists")
    })
  })

  // =========================================================================
  // deleteYearLevel
  // =========================================================================

  describe("deleteYearLevel", () => {
    it("deletes year level with schoolId scope (deleteMany)", async () => {
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
        id: "yl-1",
        schoolId: SCHOOL_ID,
        _count: { studentYearLevels: 0, batches: 0 },
      } as any)
      vi.mocked(db.yearLevel.deleteMany).mockResolvedValue({ count: 1 })

      const formData = makeFormData({ id: "yl-1" })

      const result = await deleteYearLevel(formData)

      expect(result.success).toBe(true)
      // Verify deleteMany with schoolId (defense-in-depth)
      expect(db.yearLevel.deleteMany).toHaveBeenCalledWith({
        where: { id: "yl-1", schoolId: SCHOOL_ID },
      })
    })

    it("prevents deletion with enrolled students", async () => {
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
        id: "yl-1",
        schoolId: SCHOOL_ID,
        _count: { studentYearLevels: 5, batches: 0 },
      } as any)

      const formData = makeFormData({ id: "yl-1" })

      const result = await deleteYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain("5 enrolled student(s)")
      expect(db.yearLevel.deleteMany).not.toHaveBeenCalled()
    })

    it("prevents deletion with assigned batches", async () => {
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
        id: "yl-1",
        schoolId: SCHOOL_ID,
        _count: { studentYearLevels: 0, batches: 3 },
      } as any)

      const formData = makeFormData({ id: "yl-1" })

      const result = await deleteYearLevel(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain("3 batch(es)")
      expect(db.yearLevel.deleteMany).not.toHaveBeenCalled()
    })
  })
})
