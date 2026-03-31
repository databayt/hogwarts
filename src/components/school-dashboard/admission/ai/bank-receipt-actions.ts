"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bank Receipt Verification Server Actions
 * Process bank transfer receipts via AI and match against application payments
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { createProcessingJob } from "@/lib/document-extraction/queue-runner"
import { logger } from "@/lib/logger"

import type { BankReceiptExtractedData } from "./bank-receipt-schema"
import type { ProcessedDocument } from "./types"

// ============================================
// PROCESS APPLICATION BANK RECEIPT
// ============================================

/**
 * Queue a bank receipt for AI processing.
 * Creates a DocumentProcessingJob with jobType "bank_receipt"
 * and updates Application.documents JSON with the pending receipt entry.
 */
export async function processApplicationBankReceipt(
  applicationId: string,
  receiptUrl: string,
  fileName?: string
): Promise<ActionResponse<ProcessedDocument>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // RBAC: DEVELOPER, ADMIN, STAFF can process receipts
    const role = session.user.role
    if (role !== "DEVELOPER" && role !== "ADMIN" && role !== "STAFF") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!applicationId || !receiptUrl) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Verify application belongs to this school
    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: { id: true, documents: true },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
    }

    // Create a processing job for the bank receipt
    const job = await createProcessingJob({
      schoolId,
      userId,
      jobType: "bank_receipt",
      fileUrl: receiptUrl,
      fileName: fileName || "bank-receipt",
      metadata: {
        applicationId,
        documentType: "bank_receipt",
      },
    })

    // Build the processed document entry
    const processedDoc: ProcessedDocument = {
      type: "other", // bank_receipt is not an AdmissionDocumentType, use "other"
      url: receiptUrl,
      fileName: fileName || "bank-receipt",
      status: "pending",
      jobId: job.id,
      processedAt: new Date().toISOString(),
    }

    // Update Application.documents JSON
    const existingDocs = (Array.isArray(application.documents)
      ? application.documents
      : []) as unknown as ProcessedDocument[]

    // Replace if same URL exists, otherwise append
    const docIndex = existingDocs.findIndex((d) => d.url === receiptUrl)
    if (docIndex >= 0) {
      existingDocs[docIndex] = processedDoc
    } else {
      existingDocs.push(processedDoc)
    }

    await db.application.update({
      where: { id: applicationId, schoolId },
      data: { documents: existingDocs as unknown as any },
    })

    logger.info("Bank receipt processing queued", {
      action: "process_bank_receipt",
      applicationId,
      jobId: job.id,
      schoolId,
    })

    revalidatePath("/admission")

    return {
      success: true,
      data: processedDoc,
    }
  } catch (error) {
    logger.error(
      "processApplicationBankReceipt failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "process_bank_receipt_error" }
    )
    return actionError(ACTION_ERRORS.RECEIPT_CREATE_FAILED)
  }
}

// ============================================
// MATCH RECEIPT TO PAYMENT
// ============================================

/**
 * After extraction completes, auto-match extracted amount/date/reference
 * against the Application's payment fields.
 * If a match is found, mark applicationFeePaid = true, set paymentDate and paymentId.
 */
export async function matchReceiptToPayment(
  applicationId: string,
  receiptJobId: string
): Promise<ActionResponse<{ matched: boolean; reason?: string }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // RBAC: DEVELOPER, ADMIN, STAFF can match receipts
    const role = session.user.role
    if (role !== "DEVELOPER" && role !== "ADMIN" && role !== "STAFF") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!applicationId || !receiptJobId) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Verify application belongs to this school
    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: {
        id: true,
        applicationFeePaid: true,
        paymentId: true,
        paymentDate: true,
        paymentReference: true,
        documents: true,
        campaign: {
          select: {
            applicationFee: true,
          },
        },
      },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
    }

    // Already paid -- no need to match
    if (application.applicationFeePaid) {
      return {
        success: true,
        data: { matched: true, reason: "already_paid" },
      }
    }

    // Fetch the completed processing job
    const job = await db.documentProcessingJob.findFirst({
      where: {
        id: receiptJobId,
        schoolId,
        jobType: "bank_receipt",
        status: "COMPLETED",
      },
      select: {
        id: true,
        resultData: true,
        confidence: true,
      },
    })

    if (!job || !job.resultData) {
      return actionError(ACTION_ERRORS.RECEIPT_NOT_FOUND)
    }

    const extractedData = job.resultData as unknown as BankReceiptExtractedData

    // Match logic: verify amount matches campaign fee (if defined)
    const expectedFee = application.campaign?.applicationFee
      ? Number(application.campaign.applicationFee)
      : null

    let matched = false
    const reasons: string[] = []

    if (expectedFee !== null && extractedData.amount) {
      // Allow a small tolerance for rounding (0.01)
      const amountDiff = Math.abs(extractedData.amount - expectedFee)
      if (amountDiff <= 0.01) {
        matched = true
        reasons.push("amount_matches")
      } else {
        reasons.push(
          `amount_mismatch: expected ${expectedFee}, got ${extractedData.amount}`
        )
      }
    } else if (!expectedFee) {
      // No expected fee defined on campaign -- accept any receipt with an amount
      if (extractedData.amount && extractedData.amount > 0) {
        matched = true
        reasons.push("no_fee_defined_receipt_accepted")
      }
    }

    // If amount matched, also check reference number uniqueness if present
    if (matched && extractedData.referenceNumber) {
      const existingRef = await db.application.findFirst({
        where: {
          schoolId,
          paymentReference: extractedData.referenceNumber,
          id: { not: applicationId },
        },
        select: { id: true },
      })

      if (existingRef) {
        matched = false
        reasons.push("duplicate_reference_number")
      }
    }

    if (matched) {
      // Update application payment fields
      await db.application.update({
        where: { id: applicationId, schoolId },
        data: {
          applicationFeePaid: true,
          paymentDate: extractedData.transferDate
            ? new Date(extractedData.transferDate)
            : new Date(),
          paymentMethod: "bank_transfer",
          paymentReference: extractedData.referenceNumber || receiptJobId,
          paymentId: extractedData.referenceNumber || receiptJobId,
        },
      })

      // Update the document entry status in the JSON array
      const existingDocs = (Array.isArray(application.documents)
        ? application.documents
        : []) as unknown as ProcessedDocument[]

      const docIndex = existingDocs.findIndex((d) => d.jobId === receiptJobId)
      if (docIndex >= 0) {
        existingDocs[docIndex].status = "completed"
        existingDocs[docIndex].extractedData =
          extractedData as unknown as Record<string, unknown>
        existingDocs[docIndex].confidence = job.confidence ?? undefined

        await db.application.update({
          where: { id: applicationId, schoolId },
          data: { documents: existingDocs as unknown as any },
        })
      }

      logger.info("Bank receipt matched to payment", {
        action: "match_receipt_success",
        applicationId,
        receiptJobId,
        amount: extractedData.amount,
        referenceNumber: extractedData.referenceNumber,
        schoolId,
      })
    } else {
      logger.info("Bank receipt did not match payment", {
        action: "match_receipt_no_match",
        applicationId,
        receiptJobId,
        reasons,
        schoolId,
      })
    }

    revalidatePath("/admission")

    return {
      success: true,
      data: {
        matched,
        reason: reasons.join(", "),
      },
    }
  } catch (error) {
    logger.error(
      "matchReceiptToPayment failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "match_receipt_error" }
    )
    return actionError(ACTION_ERRORS.PAYMENT_NOT_FOUND)
  }
}
