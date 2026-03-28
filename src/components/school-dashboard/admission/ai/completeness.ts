"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document Completeness Check
 * Cross-references uploaded documents against campaign requirements
 */
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import type {
  AdmissionDocumentType,
  CompletenessResult,
  ProcessedDocument,
} from "./types"

/**
 * Check if an application has all required documents
 * Cross-references uploaded + classified documents against campaign.requiredDocuments
 *
 * @param applicationId - The application to check
 * @param campaignId - The campaign whose requirements to check against
 */
export async function checkDocumentCompleteness(
  applicationId: string,
  campaignId: string
): Promise<ActionResponse<CompletenessResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Fetch application and campaign in parallel
    const [application, campaign] = await Promise.all([
      db.application.findFirst({
        where: { id: applicationId, schoolId },
        select: { id: true, documents: true },
      }),
      db.admissionCampaign.findFirst({
        where: { id: campaignId, schoolId },
        select: { id: true, requiredDocuments: true },
      }),
    ])

    if (!application) {
      return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
    }

    if (!campaign) {
      return actionError(ACTION_ERRORS.CAMPAIGN_NOT_FOUND)
    }

    // Parse required documents from campaign config
    // Expected format: string[] of document type identifiers
    const requiredDocs = parseRequiredDocuments(campaign.requiredDocuments)

    // Parse uploaded documents from application
    const uploadedDocs = (Array.isArray(application.documents)
      ? application.documents
      : []) as unknown as ProcessedDocument[]

    // Build classification map: which types are present and their status
    const present: AdmissionDocumentType[] = []
    const needsVerification: AdmissionDocumentType[] = []

    for (const doc of uploadedDocs) {
      if (
        doc.status === "completed" &&
        doc.confidence &&
        doc.confidence >= 0.7
      ) {
        if (!present.includes(doc.type)) {
          present.push(doc.type)
        }
      } else if (
        doc.status === "completed" &&
        doc.confidence &&
        doc.confidence < 0.7
      ) {
        if (!needsVerification.includes(doc.type)) {
          needsVerification.push(doc.type)
        }
      } else if (doc.status === "pending" || doc.status === "processing") {
        // Still processing -- mark as needing verification
        if (!needsVerification.includes(doc.type)) {
          needsVerification.push(doc.type)
        }
      }
    }

    // Determine missing documents
    const missing = requiredDocs.filter(
      (type) => !present.includes(type) && !needsVerification.includes(type)
    )

    const complete = missing.length === 0 && needsVerification.length === 0

    const result: CompletenessResult = {
      complete,
      present,
      missing,
      needsVerification,
    }

    logger.info("Document completeness check performed", {
      action: "check_document_completeness",
      applicationId,
      campaignId,
      schoolId,
      complete,
      presentCount: present.length,
      missingCount: missing.length,
      verificationCount: needsVerification.length,
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    logger.error(
      "checkDocumentCompleteness failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "check_document_completeness_error" }
    )
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

/**
 * Parse the requiredDocuments JSON field from a campaign
 * Supports both string[] and object[] formats
 */
function parseRequiredDocuments(
  requiredDocuments: unknown
): AdmissionDocumentType[] {
  if (!requiredDocuments) return []

  if (Array.isArray(requiredDocuments)) {
    return requiredDocuments
      .map((doc) => {
        if (typeof doc === "string") return doc as AdmissionDocumentType
        if (typeof doc === "object" && doc !== null && "type" in doc) {
          return (doc as { type: string }).type as AdmissionDocumentType
        }
        return null
      })
      .filter((type): type is AdmissionDocumentType => type !== null)
  }

  return []
}
