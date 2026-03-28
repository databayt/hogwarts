// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bank Receipt Processing Handler
 * Registered with the queue runner for "bank_receipt" job type
 */

import { logger } from "@/lib/logger"
import {
  bankReceiptExtractionPrompt,
  bankReceiptExtractionSchema,
  bankReceiptSystemMessage,
  type BankReceiptExtractedData,
} from "@/components/school-dashboard/admission/ai/bank-receipt-schema"

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
  const resolvedName = fileName || url.split("/").pop() || "receipt"

  return new File([blob], resolvedName, { type: blob.type })
}

/**
 * Process a bank receipt:
 * 1. Fetch the file from URL
 * 2. Extract structured data using extractWithSchema with bank receipt schema
 * 3. Return ProcessingResult with extracted receipt data
 */
async function handleBankReceipt(
  context: ProcessingContext
): Promise<ProcessingResult> {
  const { fileUrl, fileName, schoolId } = context

  logger.info("Processing bank receipt", {
    action: "bank_receipt_handler_start",
    jobId: context.jobId,
    schoolId,
  })

  try {
    // Fetch the file
    const file = await fetchAsFile(fileUrl, fileName)

    const extractionOptions: GenericExtractionOptions = {
      schema: bankReceiptExtractionSchema,
      prompt: bankReceiptExtractionPrompt,
      systemPrompt: bankReceiptSystemMessage,
      preferVision: true, // Bank receipts (images, scans, screenshots) benefit from vision
    }

    const result = await extractWithSchema<BankReceiptExtractedData>(
      file,
      extractionOptions
    )

    if (!result.success || !result.data) {
      logger.error(
        "Bank receipt extraction failed",
        new Error(result.error || "Extraction failed"),
        {
          action: "bank_receipt_handler_extraction_failed",
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

    logger.info("Bank receipt extraction completed", {
      action: "bank_receipt_handler_success",
      jobId: context.jobId,
      confidence: result.data.confidence,
      fieldsExtracted: result.data.fields.length,
      amount: result.data.extractedObject?.amount,
      referenceNumber: result.data.extractedObject?.referenceNumber,
    })

    return {
      success: true,
      data: result.data.extractedObject,
      confidence: result.data.confidence,
      model: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
    }
  } catch (error) {
    logger.error(
      "Bank receipt handler error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "bank_receipt_handler_error",
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
registerHandler("bank_receipt", handleBankReceipt)
