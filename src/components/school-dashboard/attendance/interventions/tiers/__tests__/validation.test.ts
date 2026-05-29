// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  bulkInterventionSchema,
  createTieredInterventionSchema,
  getRecommendedActions,
  getTierFromAbsenceRate,
  shouldEscalate,
  TIER_THRESHOLDS,
  tier1Actions,
  tier2Actions,
  tier3Actions,
  updateInterventionStatusSchema,
} from "../validation"

describe("MTSS tiered intervention validation", () => {
  describe("TIER_THRESHOLDS constants", () => {
    it("Tier 1 is 0-9.99%", () => {
      expect(TIER_THRESHOLDS.TIER_1).toEqual({ min: 0, max: 9.99 })
    })

    it("Tier 2 is 10-19.99%", () => {
      expect(TIER_THRESHOLDS.TIER_2).toEqual({ min: 10, max: 19.99 })
    })

    it("Tier 3 is 20%+", () => {
      expect(TIER_THRESHOLDS.TIER_3).toEqual({ min: 20, max: 100 })
    })
  })

  describe("getTierFromAbsenceRate", () => {
    it("0% → TIER_1 (satisfactory)", () => {
      expect(getTierFromAbsenceRate(0)).toBe("TIER_1")
    })

    it("9.99% → TIER_1 (last bucket of tier 1)", () => {
      expect(getTierFromAbsenceRate(9.99)).toBe("TIER_1")
    })

    it("10% → TIER_2 (boundary)", () => {
      expect(getTierFromAbsenceRate(10)).toBe("TIER_2")
    })

    it("15% → TIER_2", () => {
      expect(getTierFromAbsenceRate(15)).toBe("TIER_2")
    })

    it("20% → TIER_3 (chronic absence threshold)", () => {
      expect(getTierFromAbsenceRate(20)).toBe("TIER_3")
    })

    it("50% → TIER_3", () => {
      expect(getTierFromAbsenceRate(50)).toBe("TIER_3")
    })
  })

  describe("getRecommendedActions", () => {
    it("returns tier1Actions for TIER_1", () => {
      expect(getRecommendedActions("TIER_1")).toEqual(tier1Actions)
    })

    it("returns tier2Actions for TIER_2", () => {
      expect(getRecommendedActions("TIER_2")).toEqual(tier2Actions)
    })

    it("returns tier3Actions for TIER_3", () => {
      expect(getRecommendedActions("TIER_3")).toEqual(tier3Actions)
    })
  })

  describe("shouldEscalate", () => {
    it("TIER_1 → TIER_2 escalates", () => {
      expect(shouldEscalate("TIER_1", 12)).toEqual({
        shouldEscalate: true,
        newTier: "TIER_2",
      })
    })

    it("TIER_1 → TIER_3 escalates directly", () => {
      expect(shouldEscalate("TIER_1", 25)).toEqual({
        shouldEscalate: true,
        newTier: "TIER_3",
      })
    })

    it("TIER_2 → TIER_3 escalates", () => {
      expect(shouldEscalate("TIER_2", 25)).toEqual({
        shouldEscalate: true,
        newTier: "TIER_3",
      })
    })

    it("TIER_1 stays in TIER_1 — no escalation", () => {
      expect(shouldEscalate("TIER_1", 5)).toEqual({ shouldEscalate: false })
    })

    it("TIER_2 with no worsening — no escalation", () => {
      expect(shouldEscalate("TIER_2", 15)).toEqual({ shouldEscalate: false })
    })

    it("TIER_3 doesn't escalate further (no tier above)", () => {
      expect(shouldEscalate("TIER_3", 30)).toEqual({ shouldEscalate: false })
    })
  })

  describe("createTieredInterventionSchema", () => {
    it("accepts valid input", () => {
      const result = createTieredInterventionSchema.safeParse({
        studentId: "s1",
        tier: "TIER_2",
        action: "PARENT_PHONE_CALL",
        title: "Parent call",
        priority: 2,
      })

      expect(result.success).toBe(true)
    })

    it("rejects empty studentId", () => {
      const result = createTieredInterventionSchema.safeParse({
        studentId: "",
        tier: "TIER_1",
        action: "WELCOME_MESSAGE",
        title: "Welcome",
      })

      expect(result.success).toBe(false)
    })

    it("rejects invalid tier", () => {
      const result = createTieredInterventionSchema.safeParse({
        studentId: "s1",
        tier: "TIER_X",
        action: "x",
        title: "x",
      })

      expect(result.success).toBe(false)
    })

    it("rejects priority outside 1-4 range", () => {
      const result = createTieredInterventionSchema.safeParse({
        studentId: "s1",
        tier: "TIER_1",
        action: "WELCOME_MESSAGE",
        title: "x",
        priority: 99,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateInterventionStatusSchema", () => {
    it("accepts valid status transitions", () => {
      for (const status of [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "ESCALATED",
      ]) {
        const result = updateInterventionStatusSchema.safeParse({
          interventionId: "i1",
          status,
        })
        expect(result.success).toBe(true)
      }
    })

    it("rejects invalid status", () => {
      const result = updateInterventionStatusSchema.safeParse({
        interventionId: "i1",
        status: "INVALID_STATUS",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("bulkInterventionSchema", () => {
    it("requires at least one student", () => {
      const result = bulkInterventionSchema.safeParse({
        studentIds: [],
        tier: "TIER_1",
        action: "WELCOME_MESSAGE",
      })

      expect(result.success).toBe(false)
    })

    it("accepts batch of students", () => {
      const result = bulkInterventionSchema.safeParse({
        studentIds: ["s1", "s2", "s3"],
        tier: "TIER_2",
        action: "PARENT_EMAIL",
      })

      expect(result.success).toBe(true)
    })
  })
})
