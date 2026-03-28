// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * AI Budget Enforcement Service
 * Per-school monthly AI spending limits and usage tracking
 */

import { db } from "@/lib/db"
import type { ProcessingJobType } from "@/lib/document-extraction/types"
import { logger } from "@/lib/logger"

export interface BudgetCheckResult {
  allowed: boolean
  remaining: number | null // null = unlimited
  spent: number
  limit: number | null // null = unlimited
  errorCode?: string
}

export interface AIUsageEntry {
  schoolId: string
  userId?: string
  jobType: ProcessingJobType | string
  model: string
  provider: string
  inputTokens?: number
  outputTokens?: number
  costUsd: number
  jobId?: string
}

/**
 * Check if a school can use AI (budget not exceeded)
 */
export async function canUseAI(
  schoolId: string,
  estimatedCost?: number
): Promise<BudgetCheckResult> {
  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { aiMonthlyBudget: true, aiEnabledDomains: true },
    })

    if (!school) {
      return {
        allowed: false,
        remaining: null,
        spent: 0,
        limit: null,
        errorCode: "SCHOOL_NOT_FOUND",
      }
    }

    // No budget set = unlimited
    if (!school.aiMonthlyBudget) {
      return { allowed: true, remaining: null, spent: 0, limit: null }
    }

    const limit = Number(school.aiMonthlyBudget)
    const spent = await getMonthlySpend(schoolId)
    const remaining = Math.max(0, limit - spent)

    if (estimatedCost && remaining < estimatedCost) {
      return {
        allowed: false,
        remaining,
        spent,
        limit,
        errorCode: "AI_BUDGET_EXCEEDED",
      }
    }

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        spent,
        limit,
        errorCode: "AI_BUDGET_EXCEEDED",
      }
    }

    return { allowed: true, remaining, spent, limit }
  } catch (error) {
    logger.error(
      "Budget check failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "ai_budget_check_error", schoolId }
    )
    // Fail open: allow AI if budget check fails
    return { allowed: true, remaining: null, spent: 0, limit: null }
  }
}

/**
 * Check if a specific AI domain is enabled for a school
 */
export async function isDomainEnabled(
  schoolId: string,
  domain: string
): Promise<boolean> {
  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { aiEnabledDomains: true },
    })

    // No config = all domains enabled by default
    if (!school?.aiEnabledDomains) return true

    const domains = school.aiEnabledDomains as string[]
    return Array.isArray(domains) && domains.includes(domain)
  } catch {
    return true // Fail open
  }
}

/**
 * Track AI usage after a successful API call
 */
export async function trackAIUsage(entry: AIUsageEntry): Promise<void> {
  try {
    await db.aIUsageLog.create({
      data: {
        schoolId: entry.schoolId,
        userId: entry.userId,
        jobType: entry.jobType,
        model: entry.model,
        provider: entry.provider,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        costUsd: entry.costUsd,
        jobId: entry.jobId,
      },
    })
  } catch (error) {
    // Don't fail the caller — usage tracking is best-effort
    logger.error(
      "Failed to track AI usage",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "track_ai_usage_error", schoolId: entry.schoolId }
    )
  }
}

/**
 * Get total AI spend for the current month
 */
export async function getMonthlySpend(schoolId: string): Promise<number> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await db.aIUsageLog.aggregate({
    where: {
      schoolId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { costUsd: true },
  })

  return result._sum.costUsd ?? 0
}

/**
 * Get monthly usage breakdown by job type
 */
export async function getMonthlyUsageBreakdown(schoolId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const breakdown = await db.aIUsageLog.groupBy({
    by: ["jobType"],
    where: {
      schoolId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { costUsd: true },
    _count: true,
  })

  return breakdown.map((entry) => ({
    jobType: entry.jobType,
    totalCost: entry._sum.costUsd ?? 0,
    requestCount: entry._count,
  }))
}

/**
 * Get usage summary for the AI settings dashboard
 */
export async function getAIUsageSummary(schoolId: string) {
  const [monthlySpend, breakdown, school] = await Promise.all([
    getMonthlySpend(schoolId),
    getMonthlyUsageBreakdown(schoolId),
    db.school.findUnique({
      where: { id: schoolId },
      select: { aiMonthlyBudget: true, aiEnabledDomains: true },
    }),
  ])

  const limit = school?.aiMonthlyBudget ? Number(school.aiMonthlyBudget) : null

  return {
    monthlySpend,
    monthlyLimit: limit,
    remaining: limit ? Math.max(0, limit - monthlySpend) : null,
    usagePercent: limit ? Math.round((monthlySpend / limit) * 100) : null,
    breakdown,
    enabledDomains: (school?.aiEnabledDomains as string[]) ?? null,
  }
}
