"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

import type {
  AcademicStepData,
  ContactStepData,
  LocationStepData,
  PersonalStepData,
} from "../types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoFillResult {
  personal?: Partial<PersonalStepData>
  contact?: Partial<ContactStepData>
  location?: Partial<LocationStepData>
  academic?: Partial<AcademicStepData>
}

// Map upload slot → document type
const SLOT_TO_DOC_TYPE: Record<string, AdmissionDocumentType> = {
  idUrl: "national_id",
  transcriptUrl: "transcript",
  degreeUrl: "degree",
  resumeUrl: "resume",
}

// ---------------------------------------------------------------------------
// SSRF Protection: validate that fileUrl points to a known upload host
// ---------------------------------------------------------------------------

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
  // Match dotted-decimal IPv4
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
  // Strip square brackets if present (URL parser may include them)
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

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function extractForAutoFill(
  fileUrl: string,
  slotKey: string
): Promise<{ success: boolean; data?: AutoFillResult; error?: string }> {
  const docType = SLOT_TO_DOC_TYPE[slotKey]
  if (!docType) return { success: true, data: {} }

  try {
    // Resolve schoolId server-side — never trust client-supplied schoolId
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "MISSING_SCHOOL_CONTEXT" }
    }

    // SSRF protection: only allow known upload-bucket URLs
    const urlCheck = validateUploadUrl(fileUrl)
    if (!urlCheck.valid) {
      return { success: false, error: urlCheck.error }
    }

    // Check AI budget
    const budget = await canUseAI(schoolId)
    if (!budget.allowed) return { success: true, data: {} }

    // Fetch file from validated URL
    const response = await fetch(fileUrl)
    if (!response.ok) {
      return { success: false, error: "FETCH_FAILED" }
    }
    const blob = await response.blob()
    const fileName = fileUrl.split("/").pop() || "document"
    const file = new File([blob], fileName, { type: blob.type })

    // Extract with the appropriate schema
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
    return { success: true, data: mapToStepData(docType, extracted) }
  } catch (error) {
    logger.error(
      "Auto-fill extraction failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "auto_fill_extract_error", slotKey }
    )
    // Silent failure — applicant just fills manually
    return { success: true, data: {} }
  }
}

// ---------------------------------------------------------------------------
// Mapping: AI extracted data → wizard step fields
// ---------------------------------------------------------------------------

function mapToStepData(
  docType: AdmissionDocumentType,
  extracted: Record<string, unknown>
): AutoFillResult {
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

function mapNationalId(e: Record<string, unknown>): AutoFillResult {
  const fullName = (e.fullName as string) || ""
  const parts = fullName.split(/\s+/).filter(Boolean)

  const personal: Partial<PersonalStepData> = {}
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

  const result: AutoFillResult = {}
  if (Object.keys(personal).length > 0) result.personal = personal
  if (e.placeOfBirth) result.location = { country: e.placeOfBirth as string }

  return result
}

function mapTranscript(e: Record<string, unknown>): AutoFillResult {
  const academic: Partial<AcademicStepData> = {}

  if (e.institution) academic.previousSchool = e.institution as string
  if (e.cumulativeGpa != null) {
    academic.previousPercentage = gpaToPerformance(
      e.cumulativeGpa as number,
      e.gpaScale as number | undefined
    )
  }

  // Also extract student name for personal step if available
  const result: AutoFillResult = {}
  if (Object.keys(academic).length > 0) result.academic = academic

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

function mapDegree(e: Record<string, unknown>): AutoFillResult {
  const academic: Partial<AcademicStepData> = {}

  if (e.institution) academic.previousSchool = e.institution as string
  if (e.honors) academic.achievements = e.honors as string

  if (Object.keys(academic).length > 0) return { academic }
  return {}
}

function mapResume(e: Record<string, unknown>): AutoFillResult {
  const result: AutoFillResult = {}

  const contact: Partial<ContactStepData> = {}
  if (e.email) contact.email = e.email as string
  if (e.phone) contact.phone = e.phone as string
  if (Object.keys(contact).length > 0) result.contact = contact

  // Also extract name
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeGender(raw: string): "MALE" | "FEMALE" | undefined {
  const n = raw.toLowerCase().trim()
  if (n === "male" || n === "ذكر" || n === "m") return "MALE"
  if (n === "female" || n === "أنثى" || n === "f") return "FEMALE"
  return undefined
}

/** Convert GPA to performance select value (excellent, very-good, good, average, below-average) */
function gpaToPerformance(gpa: number, scale?: number): string {
  const pct = scale && scale !== 100 ? (gpa / scale) * 100 : gpa
  if (pct >= 90) return "excellent"
  if (pct >= 80) return "very-good"
  if (pct >= 70) return "good"
  if (pct >= 60) return "average"
  return "below-average"
}
