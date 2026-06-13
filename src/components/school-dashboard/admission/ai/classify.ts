// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document Classification
 * Uses Claude Vision to classify document type before extraction
 */

import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"

import { canUseAI, trackAIUsage } from "@/lib/ai/budget"
import { logger } from "@/lib/logger"

import { admissionSystemMessage, classificationPrompt } from "./prompts"
import { documentClassificationSchema } from "./schemas"
import type { AdmissionDocumentType, DocumentClassification } from "./types"

// claude-3-5-sonnet input/output cost per 1M tokens (USD) — 2024 pricing
const MODEL_ID = "claude-3-5-sonnet-20241022"
const INPUT_COST_PER_M = 3.0
const OUTPUT_COST_PER_M = 15.0

/**
 * Classify an admission document by its visual content
 * @param fileUrl - Public URL of the uploaded document
 * @param schoolId - Required for budget enforcement and usage tracking
 * @returns Classification result with document type and confidence
 */
export async function classifyAdmissionDocument(
  fileUrl: string,
  schoolId: string
): Promise<{
  success: boolean
  data?: DocumentClassification
  error?: string
  errorCode?: string
}> {
  const startTime = Date.now()

  // Budget gate — mirror of the queue-runner pattern
  const budgetCheck = await canUseAI(schoolId)
  if (!budgetCheck.allowed) {
    logger.warn("AI budget exceeded — skipping classification", {
      action: "admission_classify_budget_blocked",
      schoolId,
      errorCode: budgetCheck.errorCode,
    })
    return {
      success: false,
      error: "AI budget exceeded for this school",
      errorCode: budgetCheck.errorCode ?? "AI_BUDGET_EXCEEDED",
    }
  }

  try {
    logger.info("Starting admission document classification", {
      action: "admission_classify_start",
      fileUrl,
      schoolId,
    })

    const result = await generateObject({
      model: anthropic(MODEL_ID),
      schema: documentClassificationSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: fileUrl,
            },
            {
              type: "text",
              text: `${admissionSystemMessage}\n\n${classificationPrompt}`,
            },
          ],
        },
      ],
    })

    const classification: DocumentClassification = {
      type: result.object.type as AdmissionDocumentType,
      confidence: result.object.confidence ?? 0.5,
      reasoning: result.object.reasoning,
    }

    const processingTime = Date.now() - startTime

    // Track real usage from the SDK response
    const inputTokens = result.usage?.inputTokens ?? 0
    const outputTokens = result.usage?.outputTokens ?? 0
    const costUsd =
      (inputTokens / 1_000_000) * INPUT_COST_PER_M +
      (outputTokens / 1_000_000) * OUTPUT_COST_PER_M

    await trackAIUsage({
      schoolId,
      jobType: "admission_classify",
      model: MODEL_ID,
      provider: "anthropic",
      inputTokens,
      outputTokens,
      costUsd,
    })

    logger.info("Admission document classified", {
      action: "admission_classify_success",
      type: classification.type,
      confidence: classification.confidence,
      processingTime,
      inputTokens,
      outputTokens,
      costUsd,
    })

    return {
      success: true,
      data: classification,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error(
      "Admission document classification failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "admission_classify_error",
        fileUrl,
        schoolId,
        processingTime,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : "Classification failed",
    }
  }
}
