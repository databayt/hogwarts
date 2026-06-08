// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Grading-config action tests.
 *
 * Each tenant must have exactly one grading config (upsert keyed by schoolId).
 * Tests confirm callers without a school context are blocked, and that reads
 * never spill into another school's settings.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getGradingConfig,
  saveGradingConfig,
} from "@/components/school-dashboard/exams/grading/actions"

vi.mock("@/lib/db", () => ({
  db: {
    schoolGradingConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_ID = "school-grade-1"
const VALID_CONFIG = {
  primarySystem: "PERCENTAGE" as const,
  gpaScale: 4,
  showPercentage: true,
  showGPA: true,
  showLetter: true,
  passingThreshold: 50,
  retakePolicy: "best" as const,
  maxRetakes: 2,
  retakePenaltyPercent: 0,
}

describe("Grading Config Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    } as any)
  })

  describe("getGradingConfig", () => {
    it("queries by schoolId only", async () => {
      vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)

      await getGradingConfig()

      expect(db.schoolGradingConfig.findUnique).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_ID },
      })
    })

    it("throws Unauthorized when no schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      await expect(getGradingConfig()).rejects.toThrow("Unauthorized")
      expect(db.schoolGradingConfig.findUnique).not.toHaveBeenCalled()
    })

    it("respects impersonated schoolId for DEVELOPER", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: "impersonated-school",
        requestId: "req-1",
        role: "DEVELOPER",
        isPlatformAdmin: true,
      } as any)
      vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)

      await getGradingConfig()

      expect(db.schoolGradingConfig.findUnique).toHaveBeenCalledWith({
        where: { schoolId: "impersonated-school" },
      })
    })
  })

  describe("saveGradingConfig", () => {
    it("upserts using schoolId as the unique key", async () => {
      vi.mocked(db.schoolGradingConfig.upsert).mockResolvedValue({
        schoolId: SCHOOL_ID,
        primarySystem: "PERCENTAGE",
      } as any)

      const result = await saveGradingConfig(VALID_CONFIG)

      expect(result.success).toBe(true)
      expect(db.schoolGradingConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL_ID },
          create: expect.objectContaining({ schoolId: SCHOOL_ID }),
        })
      )
    })

    it("rejects when no schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      await expect(saveGradingConfig(VALID_CONFIG)).rejects.toThrow(
        "Unauthorized"
      )
      expect(db.schoolGradingConfig.upsert).not.toHaveBeenCalled()
    })

    it("validates input — rejects bad passingThreshold", async () => {
      await expect(
        saveGradingConfig({ ...VALID_CONFIG, passingThreshold: 999 })
      ).rejects.toThrow()
      expect(db.schoolGradingConfig.upsert).not.toHaveBeenCalled()
    })
  })
})
