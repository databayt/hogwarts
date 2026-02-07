"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import {
  batchGenerateCertificatesSchema,
  certificateConfigCreateSchema,
  certificateConfigUpdateSchema,
  generateCertificateSchema,
  revokeCertificateSchema,
  shareCertificateSchema,
  verifyCertificateSchema,
} from "../validation"
import type {
  ActionResponse,
  BatchGenerateCertificatesOutput,
  CertificateConfigSummary,
  GenerateCertificateOutput,
  ShareCertificateOutput,
  VerifyCertificateOutput,
} from "./types"

// Types re-exported from ./types for consumers
// Import types directly from "./actions/types" (not from "use server" module)

// ============================================================================
// HELPERS
// ============================================================================

function generateCertificateNumber(prefix?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `${prefix || "CERT-"}${timestamp}${random}`
}

function generateVerificationCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase()
}

function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex")
}

async function getSchoolId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.schoolId ?? null
}

// ============================================================================
// CERTIFICATE CONFIG CRUD
// ============================================================================

export async function createCertificateConfig(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = certificateConfigCreateSchema.parse(input)

    const config = await db.examCertificateConfig.create({
      data: {
        schoolId,
        name: parsed.name,
        type: parsed.type,
        description: parsed.description,
        templateStyle: parsed.templateStyle,
        orientation: parsed.orientation,
        titleText: parsed.titleText,
        titleTextAr: parsed.titleTextAr,
        bodyTemplate: parsed.bodyTemplate,
        bodyTemplateAr: parsed.bodyTemplateAr,
        minPercentage: parsed.minPercentage,
        minGrade: parsed.minGrade,
        topPercentile: parsed.topPercentile,
        signatures: parsed.signatures,
        useSchoolLogo: parsed.useSchoolLogo,
        customLogo: parsed.customLogo,
        borderStyle: parsed.borderStyle,
        expiryMonths: parsed.expiryMonths,
        enableVerification: parsed.enableVerification,
        verificationPrefix: parsed.verificationPrefix,
      },
    })

    revalidatePath("/exams/certificates")
    return { success: true, data: { id: config.id } }
  } catch (error) {
    console.error("Error creating certificate config:", error)
    return {
      success: false,
      error: "Failed to create config",
      code: "CREATE_FAILED",
    }
  }
}

export async function getCertificateConfigs(): Promise<
  CertificateConfigSummary[]
> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return []

    const configs = await db.examCertificateConfig.findMany({
      where: { schoolId, isActive: true },
      include: {
        _count: { select: { certificates: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return configs.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      templateStyle: c.templateStyle,
      isActive: c.isActive,
      certificateCount: c._count.certificates,
      createdAt: c.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching certificate configs:", error)
    return []
  }
}

export async function getCertificateConfig(id: string) {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return null

    return await db.examCertificateConfig.findFirst({
      where: { id, schoolId },
      include: {
        _count: { select: { certificates: true } },
      },
    })
  } catch (error) {
    console.error("Error fetching certificate config:", error)
    return null
  }
}

export async function updateCertificateConfig(
  input: unknown
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = certificateConfigUpdateSchema.parse(input)
    const { id, ...data } = parsed

    const existing = await db.examCertificateConfig.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Config not found", code: "NOT_FOUND" }
    }

    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    await db.examCertificateConfig.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/exams/certificates")
    return { success: true }
  } catch (error) {
    console.error("Error updating certificate config:", error)
    return {
      success: false,
      error: "Failed to update config",
      code: "UPDATE_FAILED",
    }
  }
}

export async function deleteCertificateConfig(
  id: string
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const existing = await db.examCertificateConfig.findFirst({
      where: { id, schoolId },
      include: { _count: { select: { certificates: true } } },
    })

    if (!existing) {
      return { success: false, error: "Config not found", code: "NOT_FOUND" }
    }

    // Soft delete if certificates have been issued
    if (existing._count.certificates > 0) {
      await db.examCertificateConfig.update({
        where: { id },
        data: { isActive: false },
      })
    } else {
      await db.examCertificateConfig.delete({ where: { id } })
    }

    revalidatePath("/exams/certificates")
    return { success: true }
  } catch (error) {
    console.error("Error deleting certificate config:", error)
    return {
      success: false,
      error: "Failed to delete config",
      code: "DELETE_FAILED",
    }
  }
}

// ============================================================================
// CERTIFICATE GENERATION
// ============================================================================

export async function generateCertificate(
  input: unknown
): Promise<ActionResponse<GenerateCertificateOutput>> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = generateCertificateSchema.parse(input)

    // Get exam result with student and exam details
    const examResult = await db.examResult.findFirst({
      where: {
        id: parsed.examResultId,
        schoolId,
      },
      include: {
        student: {
          select: { givenName: true, middleName: true, surname: true },
        },
        exam: { select: { title: true, examDate: true } },
        certificate: true,
      },
    })

    if (!examResult) {
      return {
        success: false,
        error: "Exam result not found",
        code: "RESULT_NOT_FOUND",
      }
    }

    // Check if certificate already exists
    if (examResult.certificate) {
      return {
        success: false,
        error: "Certificate already exists for this result",
        code: "DUPLICATE",
        details: { existingCertificateId: examResult.certificate.id },
      }
    }

    // Get config
    const config = await db.examCertificateConfig.findFirst({
      where: { id: parsed.configId, schoolId, isActive: true },
    })

    if (!config) {
      return {
        success: false,
        error: "Certificate config not found",
        code: "CONFIG_NOT_FOUND",
      }
    }

    // Check eligibility
    const eligibility = checkEligibility(examResult, config)
    if (!eligibility.eligible) {
      return {
        success: false,
        error:
          eligibility.reason || "Student does not meet certificate criteria",
        code: "INELIGIBLE",
      }
    }

    // Calculate rank if needed
    let rank: number | undefined
    if (config.type === "MERIT" || config.type === "EXCELLENCE") {
      const higherScores = await db.examResult.count({
        where: {
          examId: examResult.examId,
          schoolId,
          percentage: { gt: examResult.percentage },
          isAbsent: false,
        },
      })
      rank = higherScores + 1
    }

    const certificateNumber = generateCertificateNumber(
      config.verificationPrefix ?? undefined
    )
    const verificationCode = generateVerificationCode()

    // Calculate expiry date
    let expiresAt: Date | undefined
    if (config.expiryMonths) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + config.expiryMonths)
    }

    const studentName =
      `${examResult.student.givenName} ${examResult.student.middleName || ""} ${examResult.student.surname}`.trim() ||
      "Unknown Student"

    const certificate = await db.examCertificate.create({
      data: {
        schoolId,
        configId: config.id,
        examResultId: examResult.id,
        studentId: examResult.studentId,
        certificateNumber,
        verificationCode,
        recipientName: studentName,
        examTitle: examResult.exam.title,
        examDate: examResult.exam.examDate,
        score: examResult.percentage,
        grade: examResult.grade,
        rank,
        expiresAt,
        status: "active",
      },
    })

    revalidatePath("/exams/certificates")
    return {
      success: true,
      data: {
        certificateId: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
      },
    }
  } catch (error) {
    console.error("Error generating certificate:", error)
    return {
      success: false,
      error: "Failed to generate certificate",
      code: "GENERATE_FAILED",
    }
  }
}

function checkEligibility(
  result: { percentage: number; grade: string | null; isAbsent: boolean },
  config: {
    type: string
    minPercentage: number | null
    minGrade: string | null
    topPercentile: number | null
  }
): { eligible: boolean; reason?: string } {
  if (result.isAbsent) {
    return { eligible: false, reason: "Student was absent" }
  }

  if (
    config.minPercentage !== null &&
    result.percentage < config.minPercentage
  ) {
    return {
      eligible: false,
      reason: `Score ${result.percentage}% is below minimum ${config.minPercentage}%`,
    }
  }

  if (config.minGrade && result.grade) {
    const gradeOrder = [
      "A+",
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D+",
      "D",
      "D-",
      "F",
    ]
    const resultIndex = gradeOrder.indexOf(result.grade)
    const minIndex = gradeOrder.indexOf(config.minGrade)
    if (resultIndex > minIndex && resultIndex !== -1 && minIndex !== -1) {
      return {
        eligible: false,
        reason: `Grade ${result.grade} is below minimum ${config.minGrade}`,
      }
    }
  }

  return { eligible: true }
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

export async function batchGenerateCertificates(
  input: unknown
): Promise<ActionResponse<BatchGenerateCertificatesOutput>> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = batchGenerateCertificatesSchema.parse(input)

    // Get config
    const config = await db.examCertificateConfig.findFirst({
      where: { id: parsed.configId, schoolId, isActive: true },
    })

    if (!config) {
      return {
        success: false,
        error: "Certificate config not found",
        code: "CONFIG_NOT_FOUND",
      }
    }

    // Get all results for the exam
    const examResults = await db.examResult.findMany({
      where: {
        examId: parsed.examId,
        schoolId,
        isAbsent: false,
        certificate: { is: null }, // No existing certificate
      },
      include: {
        student: {
          select: { givenName: true, middleName: true, surname: true },
        },
        exam: { select: { title: true, examDate: true } },
      },
    })

    let generated = 0
    let skipped = 0
    let failed = 0
    const certificates: BatchGenerateCertificatesOutput["certificates"] = []

    // Calculate percentile threshold if needed
    let percentileThreshold = 0
    if (config.topPercentile) {
      const allResults = await db.examResult.findMany({
        where: { examId: parsed.examId, schoolId, isAbsent: false },
        orderBy: { percentage: "desc" },
        select: { percentage: true },
      })
      const cutoffIndex = Math.ceil(
        allResults.length * (config.topPercentile / 100)
      )
      if (cutoffIndex > 0 && cutoffIndex <= allResults.length) {
        percentileThreshold = allResults[cutoffIndex - 1].percentage
      }
    }

    for (const result of examResults) {
      try {
        // Check min pass score override
        if (
          parsed.minPassScore !== undefined &&
          result.percentage < parsed.minPassScore
        ) {
          skipped++
          continue
        }

        // Check eligibility
        const eligibility = checkEligibility(result, config)
        if (!eligibility.eligible) {
          skipped++
          continue
        }

        // Check percentile threshold
        if (config.topPercentile && result.percentage < percentileThreshold) {
          skipped++
          continue
        }

        // Calculate rank
        let rank: number | undefined
        if (config.type === "MERIT" || config.type === "EXCELLENCE") {
          const higherScores = await db.examResult.count({
            where: {
              examId: parsed.examId,
              schoolId,
              percentage: { gt: result.percentage },
              isAbsent: false,
            },
          })
          rank = higherScores + 1
        }

        const certificateNumber = generateCertificateNumber(
          config.verificationPrefix ?? undefined
        )
        const verificationCode = generateVerificationCode()
        const studentName =
          `${result.student.givenName} ${result.student.middleName || ""} ${result.student.surname}`.trim() ||
          "Unknown Student"

        let expiresAt: Date | undefined
        if (config.expiryMonths) {
          expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + config.expiryMonths)
        }

        await db.examCertificate.create({
          data: {
            schoolId,
            configId: config.id,
            examResultId: result.id,
            studentId: result.studentId,
            certificateNumber,
            verificationCode,
            recipientName: studentName,
            examTitle: result.exam.title,
            examDate: result.exam.examDate,
            score: result.percentage,
            grade: result.grade,
            rank,
            expiresAt,
            status: "active",
          },
        })

        generated++
        certificates.push({
          studentId: result.studentId,
          studentName,
          certificateNumber,
        })
      } catch {
        failed++
      }
    }

    revalidatePath("/exams/certificates")
    return {
      success: true,
      data: { generated, skipped, failed, certificates },
    }
  } catch (error) {
    console.error("Error batch generating certificates:", error)
    return {
      success: false,
      error: "Batch generation failed",
      code: "BATCH_FAILED",
    }
  }
}

// ============================================================================
// SHARING & VERIFICATION
// ============================================================================

export async function shareCertificate(
  input: unknown
): Promise<ActionResponse<ShareCertificateOutput>> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = shareCertificateSchema.parse(input)

    const certificate = await db.examCertificate.findFirst({
      where: { id: parsed.id, schoolId, status: "active" },
    })

    if (!certificate) {
      return {
        success: false,
        error: "Certificate not found",
        code: "NOT_FOUND",
      }
    }

    const shareToken = parsed.isPublic ? generateShareToken() : null
    const shareExpiry = parsed.isPublic
      ? new Date(Date.now() + parsed.expiryDays * 24 * 60 * 60 * 1000)
      : null

    await db.examCertificate.update({
      where: { id: parsed.id },
      data: {
        isPublic: parsed.isPublic,
        shareToken,
        shareExpiry,
      },
    })

    revalidatePath("/exams/certificates")
    return {
      success: true,
      data: {
        shareToken: shareToken || "",
        shareUrl: shareToken ? `/exams/certificates/share/${shareToken}` : "",
        shareExpiry: shareExpiry || new Date(),
      },
    }
  } catch (error) {
    console.error("Error sharing certificate:", error)
    return {
      success: false,
      error: "Failed to share certificate",
      code: "SHARE_FAILED",
    }
  }
}

export async function verifyCertificate(
  input: unknown
): Promise<ActionResponse<VerifyCertificateOutput>> {
  try {
    const parsed = verifyCertificateSchema.parse(input)

    // Verification is public - no schoolId required
    const certificate = await db.examCertificate.findFirst({
      where: { verificationCode: parsed.code },
      include: {
        school: { select: { name: true } },
      },
    })

    if (!certificate) {
      return {
        success: false,
        error: "Invalid verification code",
        code: "INVALID_CODE",
      }
    }

    // Increment view count
    await db.examCertificate.update({
      where: { id: certificate.id },
      data: { viewCount: { increment: 1 } },
    })

    return {
      success: true,
      data: {
        status: certificate.status,
        recipientName: certificate.recipientName,
        examTitle: certificate.examTitle,
        examDate: certificate.examDate,
        score: certificate.score,
        grade: certificate.grade,
        issuedAt: certificate.issuedAt,
        schoolName: certificate.school.name,
      },
    }
  } catch (error) {
    console.error("Error verifying certificate:", error)
    return {
      success: false,
      error: "Verification failed",
      code: "VERIFY_FAILED",
    }
  }
}

// ============================================================================
// REVOCATION
// ============================================================================

export async function revokeCertificate(
  input: unknown
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = revokeCertificateSchema.parse(input)

    const certificate = await db.examCertificate.findFirst({
      where: { id: parsed.id, schoolId, status: "active" },
    })

    if (!certificate) {
      return {
        success: false,
        error: "Certificate not found or already revoked",
        code: "NOT_FOUND",
      }
    }

    await db.examCertificate.update({
      where: { id: parsed.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedReason: parsed.reason,
        isPublic: false,
        shareToken: null,
      },
    })

    revalidatePath("/exams/certificates")
    return { success: true }
  } catch (error) {
    console.error("Error revoking certificate:", error)
    return {
      success: false,
      error: "Failed to revoke certificate",
      code: "REVOKE_FAILED",
    }
  }
}

// ============================================================================
// CERTIFICATE QUERIES
// ============================================================================

export async function getCertificates(filters?: {
  configId?: string
  studentId?: string
  status?: string
}) {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return []

    const where: Record<string, unknown> = { schoolId }
    if (filters?.configId) where.configId = filters.configId
    if (filters?.studentId) where.studentId = filters.studentId
    if (filters?.status) where.status = filters.status

    return await db.examCertificate.findMany({
      where,
      include: {
        config: { select: { name: true, type: true } },
        student: {
          select: { givenName: true, middleName: true, surname: true },
        },
      },
      orderBy: { issuedAt: "desc" },
    })
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return []
  }
}

export async function getCertificateByShareToken(token: string) {
  try {
    const certificate = await db.examCertificate.findFirst({
      where: {
        shareToken: token,
        isPublic: true,
        status: "active",
        OR: [{ shareExpiry: null }, { shareExpiry: { gt: new Date() } }],
      },
      include: {
        config: true,
        school: { select: { name: true } },
      },
    })

    if (certificate) {
      await db.examCertificate.update({
        where: { id: certificate.id },
        data: { viewCount: { increment: 1 } },
      })
    }

    return certificate
  } catch (error) {
    console.error("Error fetching shared certificate:", error)
    return null
  }
}
