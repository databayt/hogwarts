// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper-config action tests.
 *
 * Paper configs cross-reference generated exams, classes, and student
 * enrollment to compute recommended copies. These tests prove every join
 * is filtered by schoolId so a config request can never bridge tenants.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createPaperConfig,
  deletePaperConfig,
  getPaperConfig,
  updatePaperConfig,
} from "@/components/school-dashboard/exams/paper/actions/paper-config"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    examPaperConfig: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    generatedExam: {
      findFirst: vi.fn(),
    },
    school: {
      findUnique: vi.fn().mockResolvedValue({
        country: "SA",
        timetableStructure: "STANDARD",
        schoolType: "K12",
      }),
    },
    studentClass: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

vi.mock("@/components/school-dashboard/exams/templates/presets", () => ({
  detectRegionPreset: vi.fn().mockReturnValue(undefined),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_ID = "school-paper-1"

describe("Paper Config Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    } as any)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      country: "SA",
      timetableStructure: "STANDARD",
      schoolType: "K12",
    } as any)
    vi.mocked(db.studentClass.count).mockResolvedValue(0)
  })

  describe("createPaperConfig", () => {
    it("rejects when no schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      const result = await createPaperConfig({
        generatedExamId: "ge-1",
      } as any)

      expect(result.success).toBe(false)
      expect(db.examPaperConfig.create).not.toHaveBeenCalled()
    })

    it("checks for existing config with schoolId scope", async () => {
      vi.mocked(db.examPaperConfig.findFirst).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await createPaperConfig({
        generatedExamId: "ge-1",
      } as any)

      expect(db.examPaperConfig.findFirst).toHaveBeenCalledWith({
        where: { generatedExamId: "ge-1", schoolId: SCHOOL_ID },
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("ALREADY_EXISTS")
    })

    it("validates generatedExam belongs to school", async () => {
      vi.mocked(db.examPaperConfig.findFirst).mockResolvedValue(null)
      vi.mocked(db.generatedExam.findFirst).mockResolvedValue(null)

      const result = await createPaperConfig({
        generatedExamId: "ge-foreign",
      } as any)

      expect(db.generatedExam.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "ge-foreign",
            schoolId: SCHOOL_ID,
          }),
        })
      )
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NOT_FOUND")
      expect(db.examPaperConfig.create).not.toHaveBeenCalled()
    })

    it("counts enrollment scoped to school for recommendedCopies", async () => {
      vi.mocked(db.examPaperConfig.findFirst).mockResolvedValue(null)
      vi.mocked(db.generatedExam.findFirst).mockResolvedValue({
        id: "ge-1",
        schoolId: SCHOOL_ID,
        exam: { classId: "class-1", class: {}, subject: {} },
        questions: [],
      } as any)
      vi.mocked(db.studentClass.count).mockResolvedValue(28)
      vi.mocked(db.examPaperConfig.create).mockResolvedValue({
        id: "cfg-1",
      } as any)

      await createPaperConfig({
        generatedExamId: "ge-1",
        spareCopies: 2,
      } as any)

      expect(db.studentClass.count).toHaveBeenCalledWith({
        where: { classId: "class-1", schoolId: SCHOOL_ID },
      })
    })
  })

  describe("getPaperConfig", () => {
    it("scopes findFirst by schoolId", async () => {
      vi.mocked(db.examPaperConfig.findFirst).mockResolvedValue(null)

      await getPaperConfig("cfg-1")

      const call = vi.mocked(db.examPaperConfig.findFirst).mock.calls[0]?.[0]
      expect((call as any)?.where?.schoolId).toBe(SCHOOL_ID)
    })
  })

  describe("updatePaperConfig", () => {
    it("rejects update on cross-tenant config", async () => {
      vi.mocked(db.examPaperConfig.findFirst).mockResolvedValue(null)

      const result = await updatePaperConfig({
        id: "cfg-foreign",
      } as any)

      expect(result.success).toBe(false)
      expect(db.examPaperConfig.update).not.toHaveBeenCalled()
    })
  })

  describe("deletePaperConfig", () => {
    it("rejects delete on cross-tenant config", async () => {
      vi.mocked(db.examPaperConfig.findFirst).mockResolvedValue(null)

      const result = await deletePaperConfig("cfg-foreign")

      expect(result.success).toBe(false)
      expect(db.examPaperConfig.delete).not.toHaveBeenCalled()
    })
  })
})
