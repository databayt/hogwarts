// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
// ============================================================================
// Helpers
// ============================================================================

import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"

import {
  calculateChurnRate,
  calculateMRR,
  getAtRiskSchools,
  getMRRHistory,
  getRevenueTrends,
} from "../actions"

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

// ============================================================================
// Tests
// ============================================================================

describe("Analytics Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // calculateMRR
  // ==========================================================================

  describe("calculateMRR", () => {
    it("returns correct MRR with mix of BASIC/PREMIUM/ENTERPRISE schools", async () => {
      mockOperatorAccess()

      // Current active schools (first call)
      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([
          { id: "s1", planType: "BASIC" },
          { id: "s2", planType: "PREMIUM" },
          { id: "s3", planType: "ENTERPRISE" },
          { id: "s4", planType: "BASIC" },
        ] as any)
        // Last month schools (second call)
        .mockResolvedValueOnce([
          { planType: "BASIC" },
          { planType: "PREMIUM" },
        ] as any)

      const result = await calculateMRR()

      // 99 + 299 + 999 + 99 = 1496
      expect(result.currentMRR).toBe(1496)
      expect(result.totalSchools).toBe(4)
    })

    it("calculates growth percentage correctly", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([
          { id: "s1", planType: "BASIC" },
          { id: "s2", planType: "PREMIUM" },
          { id: "s3", planType: "BASIC" },
        ] as any)
        .mockResolvedValueOnce([
          { planType: "BASIC" },
          { planType: "PREMIUM" },
        ] as any)

      const result = await calculateMRR()

      // Current: 99 + 299 + 99 = 497
      // Last month: 99 + 299 = 398
      // Growth: ((497 - 398) / 398) * 100 = 24.8743...
      // Rounded to 1 decimal: 24.9
      expect(result.currentMRR).toBe(497)
      expect(result.lastMonthMRR).toBe(398)
      expect(result.growth).toBe(24.9)
    })

    it("returns 0 growth when no previous month data", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([{ id: "s1", planType: "BASIC" }] as any)
        .mockResolvedValueOnce([] as any)

      const result = await calculateMRR()

      expect(result.currentMRR).toBe(99)
      expect(result.lastMonthMRR).toBe(0)
      expect(result.growth).toBe(0)
    })

    it("returns mrrByPlan breakdown", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([
          { id: "s1", planType: "BASIC" },
          { id: "s2", planType: "BASIC" },
          { id: "s3", planType: "PREMIUM" },
          { id: "s4", planType: "ENTERPRISE" },
        ] as any)
        .mockResolvedValueOnce([] as any)

      const result = await calculateMRR()

      expect(result.mrrByPlan).toEqual({
        BASIC: 198, // 99 * 2
        PREMIUM: 299,
        ENTERPRISE: 999,
      })
    })

    it("returns empty breakdown when no active schools", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([] as any)

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

      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([
          { id: "s1", planType: "BASIC" },
          { id: "s2", planType: "UNKNOWN_PLAN" },
        ] as any)
        .mockResolvedValueOnce([] as any)

      const result = await calculateMRR()

      // BASIC = 99, UNKNOWN_PLAN = 0
      expect(result.currentMRR).toBe(99)
    })

    it("calls db.school.findMany with correct filters for active non-trial schools", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.findMany)
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([] as any)

      await calculateMRR()

      expect(db.school.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          planType: { not: "TRIAL" },
        },
        select: {
          id: true,
          planType: true,
        },
      })
    })
  })

  // ==========================================================================
  // getMRRHistory
  // ==========================================================================

  describe("getMRRHistory", () => {
    it("returns 6 months of history", async () => {
      mockOperatorAccess()

      // Mock 6 calls to db.school.findMany (one per month)
      for (let i = 0; i < 6; i++) {
        vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)
      }

      const result = await getMRRHistory()

      expect(result).toHaveLength(6)
      expect(db.school.findMany).toHaveBeenCalledTimes(6)
    })

    it("each month has mrr and schools count", async () => {
      mockOperatorAccess()

      // Month 1-5: empty
      for (let i = 0; i < 5; i++) {
        vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)
      }
      // Month 6 (current): two schools
      vi.mocked(db.school.findMany).mockResolvedValueOnce([
        { planType: "BASIC" },
        { planType: "PREMIUM" },
      ] as any)

      const result = await getMRRHistory()

      // First 5 months empty
      for (let i = 0; i < 5; i++) {
        expect(result[i].mrr).toBe(0)
        expect(result[i].schools).toBe(0)
      }

      // Last month has data
      expect(result[5].mrr).toBe(398) // 99 + 299
      expect(result[5].schools).toBe(2)
    })

    it("each entry has a month label string", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)
      }

      const result = await getMRRHistory()

      for (const entry of result) {
        expect(entry).toHaveProperty("month")
        expect(typeof entry.month).toBe("string")
        expect(entry.month.length).toBeGreaterThan(0)
      }
    })

    it("filters out TRIAL schools in each month query", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.school.findMany).mockResolvedValueOnce([] as any)
      }

      await getMRRHistory()

      // Every call should exclude TRIAL
      for (const call of vi.mocked(db.school.findMany).mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({
            where: expect.objectContaining({
              planType: { not: "TRIAL" },
            }),
          })
        )
      }
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
  // calculateChurnRate
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

      // (7 / 300) * 100 = 2.3333...
      // Rounded to 1 decimal: 2.3
      expect(result.churnRate).toBe(2.3)
    })

    it("queries schools created before period start for schoolsAtStart", async () => {
      mockOperatorAccess()

      vi.mocked(db.school.count)
        .mockResolvedValueOnce(0 as any)
        .mockResolvedValueOnce(0 as any)

      await calculateChurnRate("30d")

      // First call: schoolsAtStart
      const firstCall = vi.mocked(db.school.count).mock.calls[0][0]
      expect(firstCall).toEqual({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      })

      // Second call: churned schools
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
  // getAtRiskSchools
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
  // getRevenueTrends
  // ==========================================================================

  describe("getRevenueTrends", () => {
    it("returns 6 months of revenue data", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
          _sum: { amountPaid: 10000 },
          _count: 5,
        } as any)
      }

      const result = await getRevenueTrends()

      expect(result).toHaveLength(6)
      expect(db.invoice.aggregate).toHaveBeenCalledTimes(6)
    })

    it("converts cents to dollars", async () => {
      mockOperatorAccess()

      // First 5 months: empty
      for (let i = 0; i < 5; i++) {
        vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
          _sum: { amountPaid: 0 },
          _count: 0,
        } as any)
      }
      // Last month: $150.50 (15050 cents)
      vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
        _sum: { amountPaid: 15050 },
        _count: 3,
      } as any)

      const result = await getRevenueTrends()

      expect(result[5].revenue).toBe(150.5)
      expect(result[5].invoices).toBe(3)
    })

    it("handles null amountPaid sum as zero", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
          _sum: { amountPaid: null },
          _count: 0,
        } as any)
      }

      const result = await getRevenueTrends()

      for (const entry of result) {
        expect(entry.revenue).toBe(0)
        expect(entry.invoices).toBe(0)
      }
    })

    it("each entry has month, revenue, and invoices fields", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
          _sum: { amountPaid: 50000 },
          _count: 10,
        } as any)
      }

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

    it("queries only paid invoices", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
          _sum: { amountPaid: 0 },
          _count: 0,
        } as any)
      }

      await getRevenueTrends()

      // Every aggregate call should filter by status: "paid"
      for (const call of vi.mocked(db.invoice.aggregate).mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({
            where: expect.objectContaining({
              status: "paid",
            }),
          })
        )
      }
    })

    it("uses _sum.amountPaid and _count in aggregate query", async () => {
      mockOperatorAccess()

      for (let i = 0; i < 6; i++) {
        vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
          _sum: { amountPaid: 0 },
          _count: 0,
        } as any)
      }

      await getRevenueTrends()

      // Each call should request _sum and _count
      for (const call of vi.mocked(db.invoice.aggregate).mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({
            _sum: { amountPaid: true },
            _count: true,
          })
        )
      }
    })

    it("rejects non-DEVELOPER users", async () => {
      mockOperatorForbidden()

      await expect(getRevenueTrends()).rejects.toThrow("Forbidden")
      expect(db.invoice.aggregate).not.toHaveBeenCalled()
    })

    it("propagates database errors", async () => {
      mockOperatorAccess()

      vi.mocked(db.invoice.aggregate).mockRejectedValue(
        new Error("Aggregate failed")
      )

      await expect(getRevenueTrends()).rejects.toThrow("Aggregate failed")
    })
  })
})
