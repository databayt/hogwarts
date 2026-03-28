// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document Classification
 * Uses Claude Vision to classify document type before extraction
 */

import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"

import { logger } from "@/lib/logger"

import { admissionSystemMessage, classificationPrompt } from "./prompts"
import { documentClassificationSchema } from "./schemas"
import type { AdmissionDocumentType, DocumentClassification } from "./types"

/**
 * Classify an admission document by its visual content
 * @param fileUrl - Public URL of the uploaded document
 * @returns Classification result with document type and confidence
 */
export async function classifyAdmissionDocument(fileUrl: string): Promise<{
  success: boolean
  data?: DocumentClassification
  error?: string
}> {
  const startTime = Date.now()

  try {
    logger.info("Starting admission document classification", {
      action: "admission_classify_start",
      fileUrl,
    })

    const result = await generateObject({
      model: anthropic("claude-3-5-sonnet-20241022"),
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

    logger.info("Admission document classified", {
      action: "admission_classify_success",
      type: classification.type,
      confidence: classification.confidence,
      processingTime,
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
        processingTime,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : "Classification failed",
    }
  }
}
