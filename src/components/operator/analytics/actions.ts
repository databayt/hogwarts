"use server";

import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * MRR = Sum of monthly subscription fees for all active schools (excluding trials)
 */
export async function calculateMRR() {
  await requireOperator();

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // Plan pricing (should match your actual pricing)
  const planPricing = {
    TRIAL: 0,
    BASIC: 99,
    PREMIUM: 299,
    ENTERPRISE: 999, // This could be custom per school
  };

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
  });

  const currentMRR = activeSchools.reduce((sum, school) => {
    return sum + (planPricing[school.planType as keyof typeof planPricing] || 0);
  }, 0);

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
  });

  const lastMonthMRR = lastMonthSchools.reduce((sum, school) => {
    return sum + (planPricing[school.planType as keyof typeof planPricing] || 0);
  }, 0);

  // Calculate growth
  const growth = lastMonthMRR > 0
    ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100
    : 0;

  // MRR by plan type
  const mrrByPlan = {
    BASIC: 0,
    PREMIUM: 0,
    ENTERPRISE: 0,
  };

  activeSchools.forEach((school) => {
    const planType = school.planType as keyof typeof mrrByPlan;
    if (planType in mrrByPlan) {
      mrrByPlan[planType] += planPricing[planType];
    }
  });

  return {
    currentMRR,
    lastMonthMRR,
    growth: Math.round(growth * 10) / 10, // Round to 1 decimal
    mrrByPlan,
    totalSchools: activeSchools.length,
  };
}

/**
 * Get MRR history for the last 6 months
 */
export async function getMRRHistory() {
  await requireOperator();

  const now = new Date();
  const months = [];

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      date: date,
    });
  }

  const planPricing = {
    TRIAL: 0,
    BASIC: 99,
    PREMIUM: 299,
    ENTERPRISE: 999,
  };

  const history = await Promise.all(
    months.map(async ({ month, date }) => {
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

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
      });

      const mrr = schools.reduce((sum, school) => {
        return sum + (planPricing[school.planType as keyof typeof planPricing] || 0);
      }, 0);

      return {
        month,
        mrr,
        schools: schools.length,
      };
    })
  );

  return history;
}

/**
 * Calculate churn rate
 * Churn Rate = (Cancelled schools in period / Total schools at start of period) * 100
 */
export async function calculateChurnRate(period: '7d' | '30d' | '90d' = '30d') {
  await requireOperator();

  const now = new Date();
  const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  // Schools at start of period
  const schoolsAtStart = await db.school.count({
    where: {
      createdAt: {
        lt: startDate,
      },
    },
  });

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
  });

  const churnRate = schoolsAtStart > 0 ? (churned / schoolsAtStart) * 100 : 0;

  return {
    churnRate: Math.round(churnRate * 10) / 10,
    churned,
    totalSchools: schoolsAtStart,
    period,
  };
}

/**
 * Detect at-risk schools
 */
export async function getAtRiskSchools() {
  await requireOperator();

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Get schools with various risk factors
  const [
    paymentFailures,
    noRecentLogins,
    trialExpiringSoon,
  ] = await Promise.all([
    // Payment failures in last 30 days
    db.invoice.findMany({
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
          },
        },
      },
      distinct: ['schoolId'],
    }),

    // No logins in 14 days (using last user activity as proxy)
    db.school.findMany({
      where: {
        isActive: true,
        users: {
          none: {
            lastLoginAt: {
              gte: fourteenDaysAgo,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        domain: true,
      },
      take: 50,
    }),

    // Trial ending in less than 3 days
    db.school.findMany({
      where: {
        planType: "TRIAL",
        isActive: true,
        trialEndsAt: {
          lte: threeDaysFromNow,
          gte: now,
        },
      },
      select: {
        id: true,
        name: true,
        domain: true,
        trialEndsAt: true,
      },
    }),
  ]);

  // Combine and deduplicate at-risk schools
  const atRiskMap = new Map<string, {
    school: { id: string; name: string; domain: string };
    reasons: string[];
  }>();

  paymentFailures.forEach((invoice) => {
    const school = invoice.school;
    if (!atRiskMap.has(school.id)) {
      atRiskMap.set(school.id, { school, reasons: [] });
    }
    atRiskMap.get(school.id)!.reasons.push('Payment failure');
  });

  noRecentLogins.forEach((school) => {
    if (!atRiskMap.has(school.id)) {
      atRiskMap.set(school.id, { school, reasons: [] });
    }
    atRiskMap.get(school.id)!.reasons.push('No logins in 14 days');
  });

  trialExpiringSoon.forEach((school) => {
    if (!atRiskMap.has(school.id)) {
      atRiskMap.set(school.id, { school, reasons: [] });
    }
    const daysLeft = Math.ceil((school.trialEndsAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    atRiskMap.get(school.id)!.reasons.push(`Trial ending in ${daysLeft} day(s)`);
  });

  return Array.from(atRiskMap.values()).map(({ school, reasons }) => ({
    ...school,
    riskReasons: reasons,
    riskScore: reasons.length * 33, // Simple scoring
  }));
}

/**
 * Get revenue trends for the last 6 months
 */
export async function getRevenueTrends() {
  await requireOperator();

  const now = new Date();
  const months = [];

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    months.push({
      month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      startDate,
      endDate,
    });
  }

  const trends = await Promise.all(
    months.map(async ({ month, startDate, endDate }) => {
      const result = await db.invoice.aggregate({
        where: {
          status: "paid",
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amountPaid: true,
        },
        _count: true,
      });

      return {
        month,
        revenue: (result._sum.amountPaid || 0) / 100, // Convert cents to dollars
        invoices: result._count,
      };
    })
  );

  return trends;
}
