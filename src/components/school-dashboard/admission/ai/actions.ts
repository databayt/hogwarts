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

import { assertAdmissionPermission, isPermissionDenied } from "../authorization"
import { classifyAdmissionDocument } from "./classify"
import type {
  AdmissionDocumentType,
  DocumentClassification,
  DocumentProcessingStatus,
  ProcessedDocument,
} from "./types"

// ============================================
// SSRF PROTECTION
// ============================================
//
// Mirrors validateUploadUrl in
// src/components/school-marketing/application/attachments/extract-action.ts
// (not exported there, so this is a local equivalent) — reject any fileUrl
// that isn't an HTTPS URL on a known upload-bucket host BEFORE it reaches
// classifyAdmissionDocument (which spends AI budget) or createProcessingJob.

/** Allowed upload-bucket hostnames (suffix match) */
const ALLOWED_HOST_SUFFIXES = [
  ".uploadthing.com",
  ".utfs.io",
  ".amazonaws.com",
  ".cloudfront.net",
  ".blob.vercel-storage.com",
  ".databayt.org",
]

/** Exact-match hostnames (bare domains without subdomain) */
const ALLOWED_EXACT_HOSTS = [
  "uploadthing.com",
  "utfs.io",
  "amazonaws.com",
  "cloudfront.net",
  "databayt.org",
]

/** RFC-1918 / link-local / loopback IPv4 ranges */
function isPrivateIPv4(hostname: string): boolean {
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(
    hostname
  )
  if (!ipv4Match) return false
  const [, a, b] = ipv4Match.map(Number)
  // 127.x.x.x  (loopback)
  if (a === 127) return true
  // 10.x.x.x   (Class A private)
  if (a === 10) return true
  // 172.16-31.x.x (Class B private)
  if (a === 172 && b >= 16 && b <= 31) return true
  // 192.168.x.x (Class C private)
  if (a === 192 && b === 168) return true
  // 169.254.x.x (link-local / cloud metadata)
  if (a === 169 && b === 254) return true
  // 0.x.x.x
  if (a === 0) return true
  return false
}

/** Private/reserved IPv6 */
function isPrivateIPv6(hostname: string): boolean {
  const clean = hostname.replace(/^\[|]$/g, "").toLowerCase()
  if (clean === "::1") return true // loopback
  if (clean.startsWith("fc") || clean.startsWith("fd")) return true // unique local
  if (clean.startsWith("fe80")) return true // link-local
  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  const v4Mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(clean)
  if (v4Mapped) return isPrivateIPv4(v4Mapped[1])
  return false
}

function validateUploadUrl(
  url: string
): { valid: true } | { valid: false; error: string } {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: "INVALID_URL" }
  }

  // Only HTTPS allowed
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "INVALID_URL" }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block private / internal IPs
  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    return { valid: false, error: "INVALID_URL" }
  }

  // Block "localhost" variants
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return { valid: false, error: "INVALID_URL" }
  }

  // Check against allowlist
  const allowed =
    ALLOWED_EXACT_HOSTS.includes(hostname) ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))

  if (!allowed) {
    return { valid: false, error: "INVALID_URL" }
  }

  return { valid: true }
}

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

    // RBAC: ADMIN, STAFF can classify documents (mirrors reviewApplications gate)
    assertAdmissionPermission(session.user.role, "reviewApplications")

    if (!fileUrl) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // SSRF protection: only allow known upload-bucket URLs before spending
    // any AI budget on fetching this fileUrl.
    if (!validateUploadUrl(fileUrl).valid) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    const result = await classifyAdmissionDocument(fileUrl, schoolId)

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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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

    // RBAC: ADMIN, STAFF can process documents (mirrors reviewApplications
    // gate — same shared assertion as every other action in this file)
    assertAdmissionPermission(session.user.role, "reviewApplications")

    // SSRF protection: only allow known upload-bucket URLs before spending
    // any AI budget classifying this document.
    if (!validateUploadUrl(documentUrl).valid) {
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

    // Step 1: Classify the document (budget-gated, usage tracked)
    const classifyResult = await classifyAdmissionDocument(
      documentUrl,
      schoolId
    )
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
      where: { id: applicationId, schoolId },
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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

    // RBAC: ADMIN, STAFF, ACCOUNTANT can view document processing status
    assertAdmissionPermission(session.user.role, "viewApplications")

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
        where: { id: applicationId, schoolId },
        data: { documents: docs as any },
      })
    }

    return {
      success: true,
      data: docs,
    }
  } catch (error) {
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    logger.error(
      "getDocumentProcessingStatus failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "get_document_processing_status_error" }
    )
    return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
  }
}
