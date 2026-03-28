// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Document Processing Queue Runner
 * Picks up PENDING jobs, executes handlers, manages retries
 */

import { canUseAI, trackAIUsage } from "@/lib/ai/budget"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import { getHandler, type ProcessingContext } from "./handlers"
// Import handlers to trigger self-registration
import "./handlers/admission"
import "./handlers/bank-receipt"

const RETRYABLE_ERRORS = new Set([
  "RATE_LIMIT",
  "TIMEOUT",
  "SERVICE_UNAVAILABLE",
])

interface RunnerOptions {
  maxJobs?: number
  schoolId?: string // Process jobs for specific school only
}

interface RunnerResult {
  processed: number
  succeeded: number
  failed: number
  skipped: number
}

/**
 * Process next batch of pending jobs
 */
export async function processNextJobs(
  options?: RunnerOptions
): Promise<RunnerResult> {
  const maxJobs = options?.maxJobs ?? 10
  const result: RunnerResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  }

  // Fetch pending jobs, ordered by priority DESC then createdAt ASC
  const where: Record<string, unknown> = {
    status: "PENDING",
    OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
  }
  if (options?.schoolId) {
    where.schoolId = options.schoolId
  }

  const jobs = await db.documentProcessingJob.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: maxJobs,
  })

  for (const job of jobs) {
    try {
      await processJob(job.id)
      result.processed++
      result.succeeded++
    } catch (error) {
      result.processed++
      result.failed++
      logger.error(
        "Job processing failed unexpectedly",
        error instanceof Error ? error : new Error("Unknown error"),
        { action: "queue_runner_job_error", jobId: job.id }
      )
    }
  }

  return result
}

/**
 * Process a single job by ID
 */
export async function processJob(jobId: string): Promise<void> {
  const job = await db.documentProcessingJob.findUnique({
    where: { id: jobId },
  })

  if (!job || job.status !== "PENDING") return

  const handler = getHandler(job.jobType)
  if (!handler) {
    await db.documentProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: `No handler registered for job type: ${job.jobType}`,
        errorCode: "NO_HANDLER",
      },
    })
    return
  }

  // Check AI budget
  const budgetCheck = await canUseAI(job.schoolId)
  if (!budgetCheck.allowed) {
    await db.documentProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: "AI budget exceeded for this school",
        errorCode: "AI_BUDGET_EXCEEDED",
      },
    })
    return
  }

  // Mark as processing
  const startTime = Date.now()
  await db.documentProcessingJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date() },
  })

  const context: ProcessingContext = {
    jobId,
    schoolId: job.schoolId,
    userId: job.userId ?? undefined,
    fileUrl: job.fileUrl,
    fileName: job.fileName ?? undefined,
    mimeType: job.mimeType ?? undefined,
    metadata: (job.metadata as Record<string, unknown>) ?? {},
  }

  try {
    const result = await handler(context)
    const processingTimeMs = Date.now() - startTime

    if (result.success) {
      await db.documentProcessingJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          resultData: result.data as any,
          confidence: result.confidence,
          processingTimeMs,
          costUsd: result.costUsd,
          modelUsed: result.model,
          completedAt: new Date(),
        },
      })

      // Track AI usage
      if (result.costUsd && result.model && result.provider) {
        await trackAIUsage({
          schoolId: job.schoolId,
          userId: job.userId ?? undefined,
          jobType: job.jobType,
          model: result.model,
          provider: result.provider,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costUsd: result.costUsd,
          jobId,
        })
      }
    } else {
      await handleJobFailure(jobId, job.retryCount, job.maxRetries, {
        errorMessage: result.error || "Processing failed",
        errorCode: result.errorCode,
        processingTimeMs,
      })
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    const errorCode =
      error instanceof Error && "code" in error
        ? String((error as any).code)
        : "UNKNOWN"

    await handleJobFailure(jobId, job.retryCount, job.maxRetries, {
      errorMessage,
      errorCode,
      processingTimeMs,
    })
  }
}

async function handleJobFailure(
  jobId: string,
  currentRetryCount: number,
  maxRetries: number,
  details: {
    errorMessage: string
    errorCode?: string
    processingTimeMs: number
  }
) {
  const isRetryable = RETRYABLE_ERRORS.has(details.errorCode ?? "")
  const canRetry = isRetryable && currentRetryCount < maxRetries

  if (canRetry) {
    // Exponential backoff: 30s, 60s, 120s
    const delayMs = 30000 * Math.pow(2, currentRetryCount)
    const nextRetryAt = new Date(Date.now() + delayMs)

    await db.documentProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        retryCount: currentRetryCount + 1,
        nextRetryAt,
        errorMessage: details.errorMessage,
        errorCode: details.errorCode,
        processingTimeMs: details.processingTimeMs,
      },
    })

    logger.info("Job scheduled for retry", {
      action: "job_retry_scheduled",
      jobId,
      retryCount: currentRetryCount + 1,
      nextRetryAt,
    })
  } else {
    await db.documentProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: details.errorMessage,
        errorCode: details.errorCode,
        processingTimeMs: details.processingTimeMs,
        completedAt: new Date(),
      },
    })
  }
}

/**
 * Create a new processing job
 */
export async function createProcessingJob(params: {
  schoolId: string
  userId?: string
  jobType: string
  fileUrl: string
  fileName?: string
  mimeType?: string
  fileSize?: number
  metadata?: Record<string, unknown>
  priority?: number
}) {
  return db.documentProcessingJob.create({
    data: {
      schoolId: params.schoolId,
      userId: params.userId,
      jobType: params.jobType,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      metadata: params.metadata as any,
      priority: params.priority ?? 0,
    },
  })
}
