"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { canUseAI } from "@/lib/ai/budget"
import { extractWithSchema } from "@/lib/document-extraction"
import type { GenericExtractionOptions } from "@/lib/document-extraction/types"
import { logger } from "@/lib/logger"
import { getTenantContext } from "@/lib/tenant-context"
import {
  admissionSystemMessage,
  getPromptForDocumentType,
} from "@/components/school-dashboard/admission/ai/prompts"
import {
  admissionDocumentSchemaMap,
  type AdmissionDocumentSchemaMap,
} from "@/components/school-dashboard/admission/ai/schemas"
import type { AdmissionDocumentType } from "@/components/school-dashboard/admission/ai/types"
import {
  checkStudentPermission,
  getAuthContext,
} from "@/components/school-dashboard/listings/students/authorization"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudentAutoFillResult {
  personal?: {
    firstName?: string
    middleName?: string
    lastName?: string
    dateOfBirth?: string
    gender?: string
    nationality?: string
  }
  contact?: {
    email?: string
    mobileNumber?: string
  }
  previousEducation?: {
    previousSchoolName?: string
    previousGrade?: string
  }
}

// Map upload slot → document type
const SLOT_TO_DOC_TYPE: Record<string, AdmissionDocumentType> = {
  idUrl: "national_id",
  transcriptUrl: "transcript",
  degreeUrl: "degree",
  resumeUrl: "resume",
}

// ---------------------------------------------------------------------------
// SSRF Protection
// ---------------------------------------------------------------------------

const ALLOWED_HOST_SUFFIXES = [
  ".uploadthing.com",
  ".utfs.io",
  ".amazonaws.com",
  ".cloudfront.net",
  ".blob.vercel-storage.com",
  ".databayt.org",
]

const ALLOWED_EXACT_HOSTS = [
  "uploadthing.com",
  "utfs.io",
  "amazonaws.com",
  "cloudfront.net",
  "databayt.org",
]

function isPrivateIPv4(hostname: string): boolean {
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(
    hostname
  )
  if (!ipv4Match) return false
  const [, a, b] = ipv4Match.map(Number)
  if (a === 127 || a === 10 || a === 0) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
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
  if (parsed.protocol !== "https:")
    return { valid: false, error: "INVALID_URL" }

  const hostname = parsed.hostname.toLowerCase()
  if (isPrivateIPv4(hostname)) return { valid: false, error: "INVALID_URL" }
  if (hostname === "localhost" || hostname.endsWith(".localhost"))
    return { valid: false, error: "INVALID_URL" }

  const allowed =
    ALLOWED_EXACT_HOSTS.includes(hostname) ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))

  if (!allowed) return { valid: false, error: "INVALID_URL" }
  return { valid: true }
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function extractStudentAutoFill(
  fileUrl: string,
  slotKey: string
): Promise<{ success: boolean; data?: StudentAutoFillResult; error?: string }> {
  const docType = SLOT_TO_DOC_TYPE[slotKey]
  if (!docType) return { success: true, data: {} }

  try {
    // Admin must be authenticated
    const session = await auth()
    if (!session?.user) return { success: false, error: "NOT_AUTHENTICATED" }

    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    // Role gate: this triggers a paid AI extraction, so restrict it to roles
    // that can create/edit students (ADMIN/TEACHER/DEVELOPER). Without this a
    // STUDENT/GUARDIAN session could burn the school's AI budget on arbitrary
    // allowed-host URLs.
    const authContext = getAuthContext(session)
    if (
      !authContext ||
      !checkStudentPermission(authContext, "update", { schoolId })
    ) {
      return { success: false, error: "UNAUTHORIZED" }
    }

    // SSRF protection
    const urlCheck = validateUploadUrl(fileUrl)
    if (!urlCheck.valid) return { success: false, error: urlCheck.error }

    // Check AI budget
    const budget = await canUseAI(schoolId)
    if (!budget.allowed) return { success: true, data: {} }

    // Fetch file
    const response = await fetch(fileUrl)
    if (!response.ok) return { success: false, error: "FETCH_FAILED" }
    const blob = await response.blob()
    const fileName = fileUrl.split("/").pop() || "document"
    const file = new File([blob], fileName, { type: blob.type })

    // Extract
    const schema =
      admissionDocumentSchemaMap[docType as keyof AdmissionDocumentSchemaMap] ??
      admissionDocumentSchemaMap.other
    const prompt = getPromptForDocumentType(docType)

    const options: GenericExtractionOptions = {
      schema,
      prompt,
      systemPrompt: admissionSystemMessage,
      preferVision: true,
    }

    const result = await extractWithSchema(file, options)
    if (!result.success || !result.data?.extractedObject) {
      return { success: true, data: {} }
    }

    const extracted = result.data.extractedObject as Record<string, unknown>
    return { success: true, data: mapToStudentData(docType, extracted) }
  } catch (error) {
    logger.error(
      "Student auto-fill extraction failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "student_auto_fill_error", slotKey }
    )
    return { success: true, data: {} }
  }
}

// ---------------------------------------------------------------------------
// Mapping: AI extracted data → student wizard fields
// ---------------------------------------------------------------------------

function mapToStudentData(
  docType: AdmissionDocumentType,
  extracted: Record<string, unknown>
): StudentAutoFillResult {
  switch (docType) {
    case "national_id":
      return mapNationalId(extracted)
    case "transcript":
      return mapTranscript(extracted)
    case "degree":
      return mapDegree(extracted)
    case "resume":
      return mapResume(extracted)
    default:
      return {}
  }
}

function mapNationalId(e: Record<string, unknown>): StudentAutoFillResult {
  const fullName = (e.fullName as string) || ""
  const parts = fullName.split(/\s+/).filter(Boolean)

  const personal: StudentAutoFillResult["personal"] = {}
  if (parts.length >= 2) {
    personal.firstName = parts[0]
    personal.lastName = parts[parts.length - 1]
    if (parts.length >= 3) {
      personal.middleName = parts.slice(1, -1).join(" ")
    }
  }
  if (e.dateOfBirth) personal.dateOfBirth = e.dateOfBirth as string
  if (e.gender) personal.gender = normalizeGender(e.gender as string)
  if (e.nationality) personal.nationality = e.nationality as string

  const result: StudentAutoFillResult = {}
  if (Object.keys(personal).length > 0) result.personal = personal
  return result
}

function mapTranscript(e: Record<string, unknown>): StudentAutoFillResult {
  const result: StudentAutoFillResult = {}

  if (e.institution || e.cumulativeGpa) {
    result.previousEducation = {}
    if (e.institution)
      result.previousEducation.previousSchoolName = e.institution as string
  }

  if (e.studentName) {
    const parts = (e.studentName as string).split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      result.personal = {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        ...(parts.length >= 3 && {
          middleName: parts.slice(1, -1).join(" "),
        }),
      }
    }
  }

  return result
}

function mapDegree(e: Record<string, unknown>): StudentAutoFillResult {
  if (e.institution) {
    return {
      previousEducation: {
        previousSchoolName: e.institution as string,
      },
    }
  }
  return {}
}

function mapResume(e: Record<string, unknown>): StudentAutoFillResult {
  const result: StudentAutoFillResult = {}

  if (e.email || e.phone) {
    result.contact = {}
    if (e.email) result.contact.email = e.email as string
    if (e.phone) result.contact.mobileNumber = e.phone as string
  }

  if (e.fullName) {
    const parts = (e.fullName as string).split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      result.personal = {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        ...(parts.length >= 3 && {
          middleName: parts.slice(1, -1).join(" "),
        }),
      }
    }
  }

  return result
}

function normalizeGender(raw: string): string {
  const n = raw.toLowerCase().trim()
  if (n === "male" || n === "ذكر" || n === "m") return "male"
  if (n === "female" || n === "أنثى" || n === "f") return "female"
  return "male"
}
