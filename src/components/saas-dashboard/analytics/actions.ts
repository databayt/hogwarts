"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { PLAN_PRICING } from "@/components/saas-dashboard/billing/config"
import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"

// School.planType is stored inconsistently (lowercase "basic" via onboarding/marketing,
// uppercase "BASIC" via the operator createTenant path). PLAN_PRICING is keyed uppercase,
// so all lookups MUST normalize case or every plan resolves to $0. Centralize it here.
const TRIAL_PLAN_VALUES = ["TRIAL", "trial"] as const

function planPrice(planType: string): number {
  return PLAN_PRICING[planType.toUpperCase() as keyof typeof PLAN_PRICING] || 0
}

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * MRR = Sum of monthly subscription fees for all active schools (excluding trials)
 */
export async function calculateMRR() {
  await requireOperator()

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Single fetch: current paying schools with createdAt so last-month MRR is
  // derived in JS instead of a second round-trip.
  const activeSchools = await db.school.findMany({
    where: {
      isActive: true,
      planType: { notIn: [...TRIAL_PLAN_VALUES] },
    },
    select: { planType: true, createdAt: true },
  })

  const currentMRR = activeSchools.reduce(
    (sum, school) => sum + planPrice(school.planType),
    0
  )

  const lastMonthMRR = activeSchools
    .filter((school) => school.createdAt < lastMonth)
    .reduce((sum, school) => sum + planPrice(school.planType), 0)

  const growth =
    lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0

  // MRR by plan type (keys are uppercase to match PLAN_PRICING)
  const mrrByPlan = {
    BASIC: 0,
    PREMIUM: 0,
    ENTERPRISE: 0,
  }

  for (const school of activeSchools) {
    const key = school.planType.toUpperCase() as keyof typeof mrrByPlan
    if (key in mrrByPlan) {
      mrrByPlan[key] += planPrice(school.planType)
    }
  }

  return {
    currentMRR,
    lastMonthMRR,
    growth: Math.round(growth * 10) / 10, // Round to 1 decimal
    mrrByPlan,
    totalSchools: activeSchools.length,
  }
}

/**
 * Get MRR history for the last 6 months
 */
export async function getMRRHistory() {
  await requireOperator()

  const now = new Date()
  const months: Array<{ month: string; nextMonth: Date }> = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      nextMonth: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    })
  }

  // Each month's query was a strict superset of the previous one. Fetch the
  // full set once and bucket by createdAt in JS (1 query instead of 6).
  // NOTE: uses CURRENT isActive state — without a deactivatedAt column we
  // cannot reconstruct historical churn, so churned schools are excluded from
  // every month. Tracked as a schema follow-up in ISSUE.md.
  const schools = await db.school.findMany({
    where: {
      isActive: true,
      planType: { notIn: [...TRIAL_PLAN_VALUES] },
    },
    select: { planType: true, createdAt: true },
  })

  return months.map(({ month, nextMonth }) => {
    const inMonth = schools.filter((school) => school.createdAt < nextMonth)
    return {
      month,
      mrr: inMonth.reduce((sum, school) => sum + planPrice(school.planType), 0),
      schools: inMonth.length,
    }
  })
}

/**
 * Calculate churn rate
 * Churn Rate = (Cancelled schools in period / Total schools at start of period) * 100
 *
 * TODO: Add School.deactivatedAt for accurate churn tracking (currently uses updatedAt)
 */
export async function calculateChurnRate(period: "7d" | "30d" | "90d" = "30d") {
  await requireOperator()

  const now = new Date()
  const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  // Schools at start of period
  const schoolsAtStart = await db.school.count({
    where: {
      createdAt: {
        lt: startDate,
      },
    },
  })

  // Schools that became inactive during period
  const churned = await db.school.count({
    where: {
      isActive: false,
      updatedAt: {
        gte: startDate,
      },
      createdAt: {
        lt: startDate,
      },
    },
  })

  const churnRate = schoolsAtStart > 0 ? (churned / schoolsAtStart) * 100 : 0

  return {
    churnRate: Math.round(churnRate * 10) / 10,
    churned,
    totalSchools: schoolsAtStart,
    period,
  }
}

/**
 * Detect at-risk schools based on payment failures
 *
 * Note: Currently limited to payment-based risk detection.
 * Additional signals (login activity, trial expiry) can be added
 * when proper tracking fields are added to the schema.
 */
export async function getAtRiskSchools() {
  await requireOperator()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Schools with payment failures in last 30 days
  const paymentFailures = await db.invoice.findMany({
    where: {
      status: "uncollectible",
      createdAt: {
        gte: thirtyDaysAgo,
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

  // Map to at-risk schools with reasons
  return paymentFailures.map((invoice) => ({
    id: invoice.school.id,
    name: invoice.school.name,
    domain: invoice.school.domain,
    planType: invoice.school.planType,
    riskReasons: ["Payment failure in last 30 days"],
    riskScore: 75, // High risk due to payment issues
  }))
}

/**
 * Get revenue trends for the last 6 months
 *
 * Note: Uses createdAt for date filtering since paidAt field doesn't exist.
 * This shows revenue by invoice creation date, not payment date.
 */
export async function getRevenueTrends() {
  await requireOperator()

  const now = new Date()
  const months: Array<{ month: string; startDate: Date; endDate: Date }> = []

  // Generate last 6 months. endDate is the EXCLUSIVE start of the next month so
  // invoices created in the final hours of a month are no longer dropped.
  for (let i = 5; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    months.push({
      month: startDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      startDate,
      endDate,
    })
  }

  // Fetch the whole 6-month window once and bucket in JS (1 query instead of 6).
  const windowStart = months[0].startDate
  const windowEnd = months[months.length - 1].endDate
  const invoices = await db.invoice.findMany({
    where: {
      status: "paid",
      createdAt: { gte: windowStart, lt: windowEnd },
    },
    select: { amountPaid: true, createdAt: true },
  })

  return months.map(({ month, startDate, endDate }) => {
    const inMonth = invoices.filter(
      (inv) => inv.createdAt >= startDate && inv.createdAt < endDate
    )
    return {
      month,
      revenue:
        inMonth.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0) / 100, // cents → dollars
      invoices: inMonth.length,
    }
  })
}
