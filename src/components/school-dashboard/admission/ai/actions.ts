"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document AI Server Actions
 * Classify, extract, and process admission documents
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { createProcessingJob } from "@/lib/document-extraction/queue-runner"
import { logger } from "@/lib/logger"

import { classifyAdmissionDocument } from "./classify"
import type {
  AdmissionDocumentType,
  DocumentClassification,
  DocumentProcessingStatus,
  ProcessedDocument,
} from "./types"

// ============================================
// CLASSIFY DOCUMENT
// ============================================

/**
 * Classify a document's type using Claude Vision
 */
export async function classifyDocument(
  fileUrl: string
): Promise<ActionResponse<DocumentClassification>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!fileUrl) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    const result = await classifyAdmissionDocument(fileUrl)

    if (!result.success || !result.data) {
      logger.error(
        "Document classification failed",
        new Error(result.error || "Classification failed"),
        { action: "classify_document_error", fileUrl, schoolId }
      )
      return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    logger.error(
      "classifyDocument action failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "classify_document_action_error" }
    )
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// ============================================
// PROCESS APPLICATION DOCUMENT
// ============================================

/**
 * Process a single application document:
 * 1. Classify document type
 * 2. Create a DocumentProcessingJob
 * 3. Update Application.documents JSON with pending status
 */
export async function processApplicationDocument(
  applicationId: string,
  documentUrl: string,
  fileName: string
): Promise<ActionResponse<ProcessedDocument>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // RBAC: ADMIN, STAFF can process documents
    const role = session.user.role
    if (role !== "DEVELOPER" && role !== "ADMIN" && role !== "STAFF") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Verify application belongs to this school
    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: { id: true, documents: true },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
    }

    // Step 1: Classify the document
    const classifyResult = await classifyAdmissionDocument(documentUrl)
    const documentType: AdmissionDocumentType =
      classifyResult.success && classifyResult.data
        ? classifyResult.data.type
        : "other"

    // Step 2: Create a processing job
    const job = await createProcessingJob({
      schoolId,
      userId,
      jobType: "admission_document",
      fileUrl: documentUrl,
      fileName,
      metadata: {
        applicationId,
        documentType,
        classificationConfidence: classifyResult.data?.confidence,
      },
    })

    // Step 3: Build the processed document entry
    const processedDoc: ProcessedDocument = {
      type: documentType,
      url: documentUrl,
      fileName,
      status: "pending",
      jobId: job.id,
      processedAt: new Date().toISOString(),
    }

    // Step 4: Update Application.documents JSON
    const existingDocs = (Array.isArray(application.documents)
      ? application.documents
      : []) as unknown as ProcessedDocument[]

    // Replace if same URL exists, otherwise append
    const docIndex = existingDocs.findIndex((d) => d.url === documentUrl)
    if (docIndex >= 0) {
      existingDocs[docIndex] = processedDoc
    } else {
      existingDocs.push(processedDoc)
    }

    await db.application.update({
      where: { id: applicationId },
      data: { documents: existingDocs as any },
    })

    logger.info("Admission document processing queued", {
      action: "process_application_document",
      applicationId,
      documentType,
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
      "processApplicationDocument failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "process_application_document_error" }
    )
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// ============================================
// GET DOCUMENT PROCESSING STATUS
// ============================================

/**
 * Get processing status for all documents of an application
 */
export async function getDocumentProcessingStatus(
  applicationId: string
): Promise<ActionResponse<ProcessedDocument[]>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Verify application belongs to this school
    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: { documents: true },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
    }

    const docs = (Array.isArray(application.documents)
      ? application.documents
      : []) as unknown as ProcessedDocument[]

    // Sync status from processing jobs for pending/processing docs
    const jobIds = docs.filter((d) => d.jobId).map((d) => d.jobId!)

    if (jobIds.length > 0) {
      const jobs = await db.documentProcessingJob.findMany({
        where: { id: { in: jobIds }, schoolId },
        select: {
          id: true,
          status: true,
          resultData: true,
          confidence: true,
          errorMessage: true,
        },
      })

      const jobMap = new Map(jobs.map((j) => [j.id, j]))

      for (const doc of docs) {
        if (!doc.jobId) continue
        const job = jobMap.get(doc.jobId)
        if (!job) continue

        // Map job status to document status
        const statusMap: Record<string, DocumentProcessingStatus> = {
          PENDING: "pending",
          PROCESSING: "processing",
          COMPLETED: "completed",
          FAILED: "failed",
        }

        doc.status = statusMap[job.status] ?? doc.status

        if (job.status === "COMPLETED" && job.resultData) {
          doc.extractedData = job.resultData as any
          doc.confidence = job.confidence ?? undefined
        }

        if (job.status === "FAILED") {
          doc.error = job.errorMessage ?? undefined
        }
      }

      // Persist synced statuses back to the application
      await db.application.update({
        where: { id: applicationId },
        data: { documents: docs as any },
      })
    }

    return {
      success: true,
      data: docs,
    }
  } catch (error) {
    logger.error(
      "getDocumentProcessingStatus failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "get_document_processing_status_error" }
    )
    return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
  }
}
