// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  calculateChurnRate,
  calculateMRR,
  getAtRiskSchools,
  getMRRHistory,
  getRevenueTrends,
} from "@/components/saas-dashboard/analytics/actions"
// ============================================================================
// Helpers
// ============================================================================

import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireOperator: vi.fn(),
}))

vi.mock("@/components/saas-dashboard/billing/config", () => ({
  PLAN_PRICING: { TRIAL: 0, BASIC: 99, PREMIUM: 299, ENTERPRISE: 999 },
}))

function mockOperatorAccess() {
  vi.mocked(requireOperator).mockResolvedValue({ userId: "dev-1" } as any)
}

function mockOperatorForbidden() {
  vi.mocked(requireOperator).mockRejectedValue(new Error("Forbidden"))
}

// Dates used to exercise the JS createdAt-bucketing introduced when the
// per-month queries were collapsed into a single fetch.
const OLD_DATE = new Date("2020-01-01") // before any recent month boundary
const NOW_DATE = new Date() // current month

// ============================================================================
// Tests
// ============================================================================

describe("Analytics Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // calculateMRR — single query, case-insensitive plan pricing
  // ==========================================================================

  describe("calculateMRR", () => {
    it("returns correct MRR with mix of BASIC/PREMIUM/ENTERPRISE schools", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC", createdAt: NOW_DATE },
        { planType: "PREMIUM", createdAt: NOW_DATE },
        { planType: "ENTERPRISE", createdAt: NOW_DATE },
        { planType: "BASIC", createdAt: NOW_DATE },
      ] as any)

      const result = await calculateMRR()

      // 99 + 299 + 999 + 99 = 1496
      expect(result.currentMRR).toBe(1496)
      expect(result.totalSchools).toBe(4)
    })

    it("normalizes lowercase planType (stored mixed-case in the DB)", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "basic", createdAt: NOW_DATE },
        { planType: "premium", createdAt: NOW_DATE },
      ] as any)

      const result = await calculateMRR()

      // Previously these resolved to $0 because PLAN_PRICING is uppercase-keyed.
      expect(result.currentMRR).toBe(398)
      expect(result.mrrByPlan).toEqual({
        BASIC: 99,
        PREMIUM: 299,
        ENTERPRISE: 0,
      })
    })

    it("calculates growth percentage correctly", async () => {
      mockOperatorAccess()

      // Last-month MRR is derived from createdAt in the same single fetch.
      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC", createdAt: OLD_DATE },
        { planType: "PREMIUM", createdAt: OLD_DATE },
        { planType: "BASIC", createdAt: NOW_DATE },
      ] as any)

      const result = await calculateMRR()

      // Current: 99 + 299 + 99 = 497; last month (created before last month): 398
      // Growth: ((497 - 398) / 398) * 100 = 24.87 → 24.9
      expect(result.currentMRR).toBe(497)
      expect(result.lastMonthMRR).toBe(398)
      expect(result.growth).toBe(24.9)
    })

    it("returns 0 growth when no previous month data", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC", createdAt: NOW_DATE },
      ] as any)

      const result = await calculateMRR()

      expect(result.currentMRR).toBe(99)
      expect(result.lastMonthMRR).toBe(0)
      expect(result.growth).toBe(0)
    })

    it("returns mrrByPlan breakdown", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC", createdAt: NOW_DATE },
        { planType: "BASIC", createdAt: NOW_DATE },
        { planType: "PREMIUM", createdAt: NOW_DATE },
        { planType: "ENTERPRISE", createdAt: NOW_DATE },
      ] as any)

      const result = await calculateMRR()

      expect(result.mrrByPlan).toEqual({
        BASIC: 198, // 99 * 2
        PREMIUM: 299,
        ENTERPRISE: 999,
      })
    })

    it("returns empty breakdown when no active schools", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)

      const result = await calculateMRR()

      expect(result.currentMRR).toBe(0)
      expect(result.totalSchools).toBe(0)
      expect(result.mrrByPlan).toEqual({
        BASIC: 0,
        PREMIUM: 0,
        ENTERPRISE: 0,
      })
    })

    it("rejects non-DEVELOPER users", async () => {
      mockOperatorForbidden()

      await expect(calculateMRR()).rejects.toThrow("Forbidden")
      expect(db.school.findMany).not.toHaveBeenCalled()
    })

    it("propagates database errors", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockRejectedValue(
        new Error("Connection refused")
      )

      await expect(calculateMRR()).rejects.toThrow("Connection refused")
    })

    it("handles unknown plan types gracefully (defaults to 0)", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC", createdAt: NOW_DATE },
        { planType: "UNKNOWN_PLAN", createdAt: NOW_DATE },
      ] as any)

      const result = await calculateMRR()

      // BASIC = 99, UNKNOWN_PLAN = 0
      expect(result.currentMRR).toBe(99)
    })

    it("fetches active non-trial schools in a single query", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)

      await calculateMRR()

      expect(db.school.findMany).toHaveBeenCalledTimes(1)
      expect(db.school.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          planType: { notIn: ["TRIAL", "trial"] },
        },
        select: {
          planType: true,
          createdAt: true,
        },
      })
    })
  })

  // ==========================================================================
  // getMRRHistory — single query + JS bucketing
  // ==========================================================================

  describe("getMRRHistory", () => {
    it("returns 6 months of history from a single query", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)

      const result = await getMRRHistory()

      expect(result).toHaveLength(6)
      expect(db.school.findMany).toHaveBeenCalledTimes(1)
    })

    it("buckets schools cumulatively by createdAt", async () => {
      mockOperatorAccess()

      // Both created long ago → present in every month bucket.
      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC", createdAt: OLD_DATE },
        { planType: "PREMIUM", createdAt: OLD_DATE },
      ] as any)

      const result = await getMRRHistory()

      expect(result[0].mrr).toBe(398) // 99 + 299
      expect(result[5].mrr).toBe(398)
      expect(result[5].schools).toBe(2)
    })

    it("each entry has a month label string", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)

      const result = await getMRRHistory()

      for (const entry of result) {
        expect(entry).toHaveProperty("month")
        expect(typeof entry.month).toBe("string")
        expect(entry.month.length).toBeGreaterThan(0)
      }
    })

    it("excludes TRIAL schools (case-insensitive) in the query", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)

      await getMRRHistory()

      expect(db.school.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            planType: { notIn: ["TRIAL", "trial"] },
          }),
        })
      )
    })

    it("rejects non-DEVELOPER users", async () => {
      mockOperatorForbidden()

      await expect(getMRRHistory()).rejects.toThrow("Forbidden")
      expect(db.school.findMany).not.toHaveBeenCalled()
    })

    it("propagates database errors", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany).mockRejectedValue(
        new Error("Query timeout")
      )

      await expect(getMRRHistory()).rejects.toThrow("Query timeout")
    })
  })

  // ==========================================================================
  // calculateChurnRate (unchanged behaviour)
  // ==========================================================================

  describe("calculateChurnRate", () => {
    it("uses 30d as default period", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(100 as any) // schoolsAtStart
        .mockResolvedValueOnce(5 as any) // churned

      const result = await calculateChurnRate()

      expect(result.period).toBe("30d")
    })

    it("calculates correct churn rate for 30d", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(100 as any)
        .mockResolvedValueOnce(5 as any)

      const result = await calculateChurnRate("30d")

      expect(result.churnRate).toBe(5)
      expect(result.churned).toBe(5)
      expect(result.totalSchools).toBe(100)
      expect(result.period).toBe("30d")
    })

    it("calculates churn for 7d period", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(200 as any)
        .mockResolvedValueOnce(3 as any)

      const result = await calculateChurnRate("7d")

      // (3 / 200) * 100 = 1.5
      expect(result.churnRate).toBe(1.5)
      expect(result.period).toBe("7d")
    })

    it("calculates churn for 90d period", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(50 as any)
        .mockResolvedValueOnce(7 as any)

      const result = await calculateChurnRate("90d")

      // (7 / 50) * 100 = 14
      expect(result.churnRate).toBe(14)
      expect(result.period).toBe("90d")
    })

    it("returns zero churn when no inactive schools", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(100 as any)
        .mockResolvedValueOnce(0 as any)

      const result = await calculateChurnRate("30d")

      expect(result.churnRate).toBe(0)
      expect(result.churned).toBe(0)
    })

    it("returns zero churn when no schools at start of period", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(0 as any)
        .mockResolvedValueOnce(0 as any)

      const result = await calculateChurnRate("30d")

      expect(result.churnRate).toBe(0)
      expect(result.totalSchools).toBe(0)
    })

    it("rounds churn rate to 1 decimal place", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(300 as any)
        .mockResolvedValueOnce(7 as any)

      const result = await calculateChurnRate("30d")

      // (7 / 300) * 100 = 2.3333... → 2.3
      expect(result.churnRate).toBe(2.3)
    })

    it("queries schools created before period start for schoolsAtStart", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(0 as any)
        .mockResolvedValueOnce(0 as any)

      await calculateChurnRate("30d")

      const firstCall = vi.mocked(db.school.count).mock.calls[0][0]
      expect(firstCall).toEqual({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      })

      const secondCall = vi.mocked(db.school.count).mock.calls[1][0]
      expect(secondCall).toEqual({
        where: {
          isActive: false,
          updatedAt: {
            gte: expect.any(Date),
          },
          createdAt: {
            lt: expect.any(Date),
          },
        },
      })
    })

    it("rejects non-DEVELOPER users", async () => {
      mockOperatorForbidden()

      await expect(calculateChurnRate("30d")).rejects.toThrow("Forbidden")
      expect(db.school.count).not.toHaveBeenCalled()
    })

    it("propagates database errors", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count).mockRejectedValue(
        new Error("Database unavailable")
      )

      await expect(calculateChurnRate()).rejects.toThrow("Database unavailable")
    })
  })

  // ==========================================================================
  // getAtRiskSchools (unchanged behaviour)
  // ==========================================================================

  describe("getAtRiskSchools", () => {
    it("returns schools with payment failures", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValue([
        {
          schoolId: "school-1",
          school: {
            id: "school-1",
            name: "Failing School",
            domain: "failing",
            planType: "PREMIUM",
          },
        },
        {
          schoolId: "school-2",
          school: {
            id: "school-2",
            name: "Another Failing",
            domain: "another",
            planType: "BASIC",
          },
        },
      ] as any)

      const result = await getAtRiskSchools()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: "school-1",
        name: "Failing School",
        domain: "failing",
        planType: "PREMIUM",
        riskReasons: ["Payment failure in last 30 days"],
        riskScore: 75,
      })
    })

    it("maps riskReasons correctly for each school", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValue([
        {
          schoolId: "school-1",
          school: {
            id: "school-1",
            name: "Test School",
            domain: "test",
            planType: "ENTERPRISE",
          },
        },
      ] as any)

      const result = await getAtRiskSchools()

      expect(result[0].riskReasons).toEqual(["Payment failure in last 30 days"])
      expect(result[0].riskScore).toBe(75)
    })

    it("returns empty array when no at-risk schools", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValue([] as any)

      const result = await getAtRiskSchools()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it("queries invoices with uncollectible status in last 30 days", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValue([] as any)

      await getAtRiskSchools()

      expect(db.invoice.findMany).toHaveBeenCalledWith({
        where: {
          status: "uncollectible",
          createdAt: {
            gte: expect.any(Date),
          },
        },
        select: {
          schoolId: true,
          school: {
            select: {
              id: true,
              name: true,
              domain: true,
              planType: true,
            },
          },
        },
        distinct: ["schoolId"],
      })
    })

    it("includes all expected fields in each at-risk school", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValue([
        {
          schoolId: "school-1",
          school: {
            id: "school-1",
            name: "Risky School",
            domain: "risky",
            planType: "BASIC",
          },
        },
      ] as any)

      const result = await getAtRiskSchools()

      expect(result[0]).toHaveProperty("id")
      expect(result[0]).toHaveProperty("name")
      expect(result[0]).toHaveProperty("domain")
      expect(result[0]).toHaveProperty("planType")
      expect(result[0]).toHaveProperty("riskReasons")
      expect(result[0]).toHaveProperty("riskScore")
    })

    it("rejects non-DEVELOPER users", async () => {
      mockOperatorForbidden()

      await expect(getAtRiskSchools()).rejects.toThrow("Forbidden")
      expect(db.invoice.findMany).not.toHaveBeenCalled()
    })

    it("propagates database errors", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockRejectedValue(
        new Error("Relation not found")
      )

      await expect(getAtRiskSchools()).rejects.toThrow("Relation not found")
    })
  })

  // ==========================================================================
  // getRevenueTrends — single query + JS bucketing
  // ==========================================================================

  describe("getRevenueTrends", () => {
    it("returns 6 months of revenue data from a single query", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([] as any)

      const result = await getRevenueTrends()

      expect(result).toHaveLength(6)
      expect(db.invoice.findMany).toHaveBeenCalledTimes(1)
    })

    it("converts cents to dollars and buckets by month", async () => {
      mockOperatorAccess()

      const mid = new Date(NOW_DATE.getFullYear(), NOW_DATE.getMonth(), 15)
      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([
        { amountPaid: 15050, createdAt: mid },
        { amountPaid: 0, createdAt: mid },
        { amountPaid: 0, createdAt: mid },
      ] as any)

      const result = await getRevenueTrends()

      // Index 5 is the current month.
      expect(result[5].revenue).toBe(150.5)
      expect(result[5].invoices).toBe(3)
    })

    it("handles empty result as zero", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([] as any)

      const result = await getRevenueTrends()

      for (const entry of result) {
        expect(entry.revenue).toBe(0)
        expect(entry.invoices).toBe(0)
      }
    })

    it("each entry has month, revenue, and invoices fields", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([] as any)

      const result = await getRevenueTrends()

      for (const entry of result) {
        expect(entry).toHaveProperty("month")
        expect(entry).toHaveProperty("revenue")
        expect(entry).toHaveProperty("invoices")
        expect(typeof entry.month).toBe("string")
        expect(typeof entry.revenue).toBe("number")
        expect(typeof entry.invoices).toBe("number")
      }
    })

    it("queries only paid invoices with a single windowed fetch", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([] as any)

      await getRevenueTrends()

      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "paid" }),
          select: { amountPaid: true, createdAt: true },
        })
      )
    })

    it("rejects non-DEVELOPER users", async () => {
      mockOperatorForbidden()

      await expect(getRevenueTrends()).rejects.toThrow("Forbidden")
      expect(db.invoice.findMany).not.toHaveBeenCalled()
    })

    it("propagates database errors", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.findMany).mockRejectedValue(
        new Error("Query failed")
      )

      await expect(getRevenueTrends()).rejects.toThrow("Query failed")
    })
  })
})
