"use server"

import { db } from "@/lib/db"
import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * MRR = Sum of monthly subscription fees for all active schools (excluding trials)
 */
export async function calculateMRR() {
  await requireOperator()

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  // Plan pricing (should match your actual pricing)
  const planPricing = {
    TRIAL: 0,
    BASIC: 99,
    PREMIUM: 299,
    ENTERPRISE: 999, // This could be custom per school
  }

  // Current MRR
  const activeSchools = await db.school.findMany({
    where: {
      isActive: true,
      planType: {
        not: "TRIAL",
      },
    },
    select: {
      id: true,
      planType: true,
    },
  })

  const currentMRR = activeSchools.reduce((sum, school) => {
    return sum + (planPricing[school.planType as keyof typeof planPricing] || 0)
  }, 0)

  // Last month MRR for growth calculation
  const lastMonthSchools = await db.school.findMany({
    where: {
      isActive: true,
      planType: {
        not: "TRIAL",
      },
      createdAt: {
        lt: lastMonth,
      },
    },
    select: {
      planType: true,
    },
  })

  const lastMonthMRR = lastMonthSchools.reduce((sum, school) => {
    return sum + (planPricing[school.planType as keyof typeof planPricing] || 0)
  }, 0)

  // Calculate growth
  const growth =
    lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0

  // MRR by plan type
  const mrrByPlan = {
    BASIC: 0,
    PREMIUM: 0,
    ENTERPRISE: 0,
  }

  activeSchools.forEach((school) => {
    const planType = school.planType as keyof typeof mrrByPlan
    if (planType in mrrByPlan) {
      mrrByPlan[planType] += planPricing[planType]
    }
  })

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
  const months = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      date: date,
    })
  }

  const planPricing = {
    TRIAL: 0,
    BASIC: 99,
    PREMIUM: 299,
    ENTERPRISE: 999,
  }

  const history = await Promise.all(
    months.map(async ({ month, date }) => {
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)

      const schools = await db.school.findMany({
        where: {
          isActive: true,
          planType: {
            not: "TRIAL",
          },
          createdAt: {
            lt: nextMonth,
          },
        },
        select: {
          planType: true,
        },
      })

      const mrr = schools.reduce((sum, school) => {
        return (
          sum + (planPricing[school.planType as keyof typeof planPricing] || 0)
        )
      }, 0)

      return {
        month,
        mrr,
        schools: schools.length,
      }
    })
  )

  return history
}

/**
 * Calculate churn rate
 * Churn Rate = (Cancelled schools in period / Total schools at start of period) * 100
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
  const months = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    months.push({
      month: startDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      startDate,
      endDate,
    })
  }

  const trends = await Promise.all(
    months.map(async ({ month, startDate, endDate }) => {
      const result = await db.invoice.aggregate({
        where: {
          status: "paid",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amountPaid: true,
        },
        _count: true,
      })

      return {
        month,
        revenue: (result._sum.amountPaid || 0) / 100, // Convert cents to dollars
        invoices: result._count,
      }
    })
  )

  return trends
}
