// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick Assessment server-action tests.
 *
 * Verifies multi-tenant isolation: every read/write must be scoped by
 * schoolId and missing context must be rejected before touching the DB.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  closeQuickAssessment,
  createQuickAssessment,
  getQuickAssessment,
  getQuickAssessments,
  launchQuickAssessment,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    quickAssessment: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_ID = "school-quick-1"
const USER_ID = "user-quick-1"
const OTHER_SCHOOL = "school-other"

describe("Quick Assessment Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER_ID, schoolId: SCHOOL_ID, role: "TEACHER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "TEACHER",
      isPlatformAdmin: false,
    } as any)
  })

  describe("createQuickAssessment", () => {
    it("returns NO_SCHOOL when tenant context has no schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "TEACHER",
        isPlatformAdmin: false,
      } as any)

      const result = await createQuickAssessment({
        title: "Pop Quiz",
        type: "POLL",
        classId: "class-1",
        subjectId: "subject-1",
        questionIds: ["q-1"],
        duration: 5,
        isAnonymous: false,
        showResults: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NO_SCHOOL")
      expect(db.quickAssessment.create).not.toHaveBeenCalled()
    })

    it("creates assessment with schoolId set in payload", async () => {
      vi.mocked(db.quickAssessment.create).mockResolvedValue({
        id: "qa-1",
      } as any)

      const result = await createQuickAssessment({
        title: "Pop Quiz",
        type: "POLL",
        classId: "class-1",
        subjectId: "subject-1",
        questionIds: ["q-1"],
        duration: 5,
        isAnonymous: false,
        showResults: true,
      })

      expect(result.success).toBe(true)
      expect(db.quickAssessment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: SCHOOL_ID,
            createdBy: USER_ID,
          }),
        })
      )
    })
  })

  describe("launchQuickAssessment", () => {
    it("scopes findFirst by schoolId", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
        id: "qa-1",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.quickAssessment.update).mockResolvedValue({} as any)

      await launchQuickAssessment("qa-1")

      expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "qa-1", schoolId: SCHOOL_ID },
        })
      )
    })

    it("returns NOT_FOUND when assessment is in another school", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      const result = await launchQuickAssessment("qa-cross-tenant")

      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NOT_FOUND")
      expect(db.quickAssessment.update).not.toHaveBeenCalled()
    })
  })

  describe("closeQuickAssessment", () => {
    it("scopes findFirst by schoolId before update", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
        id: "qa-1",
        schoolId: SCHOOL_ID,
        status: "ACTIVE",
      } as any)
      vi.mocked(db.quickAssessment.update).mockResolvedValue({} as any)

      await closeQuickAssessment("qa-1")

      expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "qa-1", schoolId: SCHOOL_ID },
        })
      )
    })
  })

  describe("getQuickAssessments", () => {
    it("filters by schoolId", async () => {
      vi.mocked(db.quickAssessment.findMany).mockResolvedValue([])

      await getQuickAssessments()

      expect(db.quickAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_ID }),
        })
      )
    })

    it("returns empty array on missing schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "TEACHER",
        isPlatformAdmin: false,
      } as any)

      const result = await getQuickAssessments()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
      expect(db.quickAssessment.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getQuickAssessment", () => {
    it("scopes findFirst by schoolId", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      await getQuickAssessment("qa-1")

      expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "qa-1",
            schoolId: SCHOOL_ID,
          }),
        })
      )
    })

    it("does not leak data from another school", async () => {
      vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)

      const result = await getQuickAssessment("qa-from-school-b")

      expect(result).toBeNull()
    })
  })

  describe("Cross-tenant isolation", () => {
    it("never queries with another school's id", async () => {
      vi.mocked(db.quickAssessment.findMany).mockResolvedValue([])

      await getQuickAssessments()

      const calls = vi.mocked(db.quickAssessment.findMany).mock.calls
      for (const [arg] of calls) {
        expect(arg?.where?.schoolId).toBe(SCHOOL_ID)
        expect(arg?.where?.schoolId).not.toBe(OTHER_SCHOOL)
      }
    })
  })
})
