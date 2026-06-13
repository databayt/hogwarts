// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document Processing Handler
 * Registered with the queue runner for "admission_document" job type
 */

import { logger } from "@/lib/logger"
import {
  admissionSystemMessage,
  getPromptForDocumentType,
} from "@/components/school-dashboard/admission/ai/prompts"
import {
  admissionDocumentSchemaMap,
  type AdmissionDocumentSchemaMap,
} from "@/components/school-dashboard/admission/ai/schemas"
import type { AdmissionDocumentType } from "@/components/school-dashboard/admission/ai/types"

import { extractWithSchema } from "../index"
import type { GenericExtractionOptions } from "../types"
import { registerHandler } from "./index"
import type { ProcessingContext, ProcessingResult } from "./index"

/**
 * Fetch a file from URL and convert to a File object
 */
async function fetchAsFile(url: string, fileName?: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch file: ${response.status} ${response.statusText}`
    )
  }

  const blob = await response.blob()
  const resolvedName = fileName || url.split("/").pop() || "document"

  return new File([blob], resolvedName, { type: blob.type })
}

/**
 * Process an admission document:
 * 1. Fetch the file from URL
 * 2. Determine schema based on metadata.documentType
 * 3. Extract structured data using extractWithSchema
 */
async function handleAdmissionDocument(
  context: ProcessingContext
): Promise<ProcessingResult> {
  const { fileUrl, fileName, metadata, schoolId } = context
  const documentType =
    (metadata.documentType as AdmissionDocumentType) || "other"

  logger.info("Processing admission document", {
    action: "admission_handler_start",
    jobId: context.jobId,
    documentType,
    schoolId,
  })

  try {
    // Fetch the file
    const file = await fetchAsFile(fileUrl, fileName)

    // Get the appropriate schema and prompt
    const schema =
      admissionDocumentSchemaMap[
        documentType as keyof AdmissionDocumentSchemaMap
      ] ?? admissionDocumentSchemaMap.other

    const prompt = getPromptForDocumentType(documentType)

    const extractionOptions: GenericExtractionOptions = {
      schema,
      prompt,
      systemPrompt: admissionSystemMessage,
      preferVision: true, // Admission docs (IDs, certificates) benefit from vision
    }

    const result = await extractWithSchema(file, extractionOptions)

    if (!result.success || !result.data) {
      logger.error(
        "Admission document extraction failed",
        new Error(result.error || "Extraction failed"),
        {
          action: "admission_handler_extraction_failed",
          jobId: context.jobId,
          errorCode: result.errorCode,
        }
      )

      return {
        success: false,
        error: result.error || "Extraction failed",
        errorCode: result.errorCode,
      }
    }

    logger.info("Admission document extraction completed", {
      action: "admission_handler_success",
      jobId: context.jobId,
      documentType,
      confidence: result.data.confidence,
      fieldsExtracted: result.data.fields.length,
    })

    return {
      success: true,
      data: result.data.extractedObject,
      confidence: result.data.confidence,
      model: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      // Cost: claude-3-5-sonnet $3/M input + $15/M output
      costUsd:
        ((result.inputTokens ?? 0) / 1_000_000) * 3.0 +
        ((result.outputTokens ?? 0) / 1_000_000) * 15.0,
    }
  } catch (error) {
    logger.error(
      "Admission document handler error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "admission_handler_error",
        jobId: context.jobId,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : "Handler failed",
      errorCode: "HANDLER_ERROR",
    }
  }
}

// Register the handler
registerHandler("admission_document", handleAdmissionDocument)
