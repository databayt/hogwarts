"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import crypto from "crypto"
import React from "react"
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"
import type { Locale } from "@/components/internationalization/config"

import { ComposableCertificate } from "../templates/composable"
import type { CertificateCompositionConfig } from "../templates/composition/types"
import type { CertificateForPaper } from "../templates/types"

// ============================================================================
// HELPERS
// ============================================================================

function buildCertificateData(
  cert: {
    recipientName: string
    recipientNameAr?: string | null
    examTitle: string
    examDate: Date
    score: number
    grade?: string | null
    rank?: number | null
    certificateNumber: string
    verificationCode: string
    verificationUrl?: string | null
    student: { studentId?: string | null; photoUrl?: string | null }
  },
  config: {
    titleText: string
    titleTextAr?: string | null
    bodyTemplate: string
    bodyTemplateAr?: string | null
    signatures: unknown
  },
  school: {
    name: string
    logoUrl?: string | null
  },
  totalStudents?: number
): CertificateForPaper {
  // Resolve body template placeholders
  const resolveTemplate = (template: string) =>
    template
      .replace(/\{\{studentName\}\}/g, cert.recipientName)
      .replace(/\{\{examTitle\}\}/g, cert.examTitle)
      .replace(/\{\{score\}\}/g, String(cert.score))
      .replace(/\{\{grade\}\}/g, cert.grade || "")
      .replace(/\{\{rank\}\}/g, cert.rank ? String(cert.rank) : "")
      .replace(/\{\{schoolName\}\}/g, school.name)
      .replace(/\{\{date\}\}/g, cert.examDate.toLocaleDateString())

  const signatures = Array.isArray(config.signatures)
    ? (config.signatures as Array<{
        name: string
        title: string
        signatureUrl?: string
      }>)
    : []

  return {
    studentName: cert.recipientName,
    studentNameAr: cert.recipientNameAr || undefined,
    studentId: cert.student.studentId || undefined,
    photoUrl: cert.student.photoUrl || undefined,

    title: config.titleText,
    titleAr: config.titleTextAr || undefined,
    bodyText: resolveTemplate(config.bodyTemplate),
    bodyTextAr: config.bodyTemplateAr
      ? resolveTemplate(config.bodyTemplateAr)
      : undefined,

    examTitle: cert.examTitle,
    examDate: cert.examDate.toLocaleDateString(),
    score: cert.score,
    maxScore: 100,
    percentage: cert.score,
    grade: cert.grade || undefined,
    rank: cert.rank || undefined,
    totalStudents,

    schoolName: school.name,
    schoolLogo: school.logoUrl || undefined,

    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    verificationUrl: cert.verificationUrl || undefined,
    issuedDate: cert.examDate.toLocaleDateString(),

    signatures,
  }
}

async function renderAndUploadCertPdf(
  certData: CertificateForPaper,
  config: {
    templateStyle: string
    orientation: string
    pageSize: string
    compositionConfig: unknown
    regionPreset?: string | null
  },
  schoolId: string,
  certNumber: string,
  locale: Locale = "ar"
): Promise<string | undefined> {
  try {
    const document = React.createElement(ComposableCertificate, {
      data: certData,
      style: config.templateStyle,
      locale,
      orientation: config.orientation as "landscape" | "portrait",
      pageSize: config.pageSize as "A4" | "LETTER",
      blockConfig: config.compositionConfig as
        | Partial<CertificateCompositionConfig>
        | undefined,
      regionPreset: config.regionPreset,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(document as any)

    const safeName = certNumber.replace(/[^a-zA-Z0-9-_]/g, "-")
    const filename = `certificates/${schoolId}/${safeName}-${Date.now()}.pdf`

    const provider = getProvider("aws_s3")
    const pdfBlob = new Blob([buffer], { type: "application/pdf" })
    const url = await provider.upload(pdfBlob, filename, {
      contentType: "application/pdf",
      access: "public",
    })

    return url
  } catch (error) {
    console.error("Certificate PDF render/upload failed:", error)
    return undefined
  }
}

// ============================================================================
// GENERATE SINGLE CERTIFICATE PDF
// ============================================================================

export async function generateCertificatePDF(
  certificateId: string,
  locale: Locale = "ar"
): Promise<ActionResponse<{ pdfUrl: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Not authenticated" }
    }
    const schoolId = session.user.schoolId

    const cert = await db.examCertificate.findFirst({
      where: { id: certificateId, schoolId },
      include: {
        config: true,
        student: true,
        school: true,
      },
    })

    if (!cert) {
      return { success: false, error: "Certificate not found" }
    }

    const certData = buildCertificateData(
      cert,
      cert.config,
      {
        name: cert.school.name,
        logoUrl: cert.school.logoUrl,
      },
      undefined
    )

    const pdfUrl = await renderAndUploadCertPdf(
      certData,
      {
        templateStyle: cert.config.templateStyle,
        orientation: cert.config.orientation,
        pageSize: cert.config.pageSize,
        compositionConfig: cert.config.compositionConfig,
        regionPreset: cert.config.regionPreset,
      },
      schoolId,
      cert.certificateNumber,
      locale
    )

    if (!pdfUrl) {
      return { success: false, error: "Failed to generate PDF" }
    }

    await db.examCertificate.update({
      where: { id: certificateId },
      data: { pdfUrl },
    })

    return { success: true, data: { pdfUrl } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate certificate PDF",
    }
  }
}

// ============================================================================
// BATCH GENERATE CERTIFICATE PDFs
// ============================================================================

export async function batchGenerateCertificatePDFs(
  configId: string,
  examId?: string,
  locale: Locale = "ar"
): Promise<
  ActionResponse<{ generated: number; failed: number; errors: string[] }>
> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Not authenticated" }
    }
    const schoolId = session.user.schoolId

    // Fetch config
    const config = await db.examCertificateConfig.findFirst({
      where: { id: configId, schoolId },
    })
    if (!config) {
      return { success: false, error: "Certificate config not found" }
    }

    // Fetch certificates that need PDFs
    const where: Record<string, unknown> = {
      schoolId,
      configId,
      pdfUrl: null,
      status: "active",
    }
    if (examId) {
      where.examResult = { examId }
    }

    const certs = await db.examCertificate.findMany({
      where,
      include: {
        student: true,
        school: true,
        examResult: true,
      },
    })

    if (certs.length === 0) {
      return { success: true, data: { generated: 0, failed: 0, errors: [] } }
    }

    let generated = 0
    let failed = 0
    const errors: string[] = []

    for (const cert of certs) {
      try {
        const certData = buildCertificateData(
          cert,
          config,
          {
            name: cert.school.name,
            logoUrl: cert.school.logoUrl,
          },
          certs.length
        )

        const pdfUrl = await renderAndUploadCertPdf(
          certData,
          {
            templateStyle: config.templateStyle,
            orientation: config.orientation,
            pageSize: config.pageSize,
            compositionConfig: config.compositionConfig,
            regionPreset: config.regionPreset,
          },
          schoolId,
          cert.certificateNumber,
          locale
        )

        if (pdfUrl) {
          await db.examCertificate.update({
            where: { id: cert.id },
            data: { pdfUrl },
          })
          generated++
        } else {
          failed++
          errors.push(`Failed to render PDF for ${cert.recipientName}`)
        }
      } catch (e) {
        failed++
        errors.push(
          `Error for ${cert.recipientName}: ${e instanceof Error ? e.message : "Unknown"}`
        )
      }
    }

    return { success: true, data: { generated, failed, errors } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to batch generate certificates",
    }
  }
}

// ============================================================================
// PREVIEW CERTIFICATE (no save)
// ============================================================================

export async function previewCertificate(
  configId: string,
  locale: Locale = "ar",
  sampleData?: Partial<CertificateForPaper>
): Promise<ActionResponse<{ pdfBase64: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Not authenticated" }
    }
    const schoolId = session.user.schoolId

    const config = await db.examCertificateConfig.findFirst({
      where: { id: configId, schoolId },
      include: { school: true },
    })
    if (!config) {
      return { success: false, error: "Config not found" }
    }

    const certData: CertificateForPaper = {
      studentName: "John Smith",
      studentNameAr: "جون سميث",
      studentId: "2024-001",
      title: config.titleText,
      titleAr: config.titleTextAr || undefined,
      bodyText: config.bodyTemplate,
      bodyTextAr: config.bodyTemplateAr || undefined,
      subject: "Mathematics",
      subjectAr: "الرياضيات",
      examTitle: "Final Exam 2025",
      examDate: new Date().toLocaleDateString(),
      score: 92,
      maxScore: 100,
      percentage: 92,
      grade: "A",
      rank: 3,
      totalStudents: 35,
      schoolName: config.school.name,
      schoolLogo: config.school.logoUrl || undefined,
      certificateNumber: "CERT-PREVIEW",
      verificationCode: "PREVIEW123",
      issuedDate: new Date().toLocaleDateString(),
      signatures: Array.isArray(config.signatures)
        ? (config.signatures as CertificateForPaper["signatures"])
        : [],
      ...sampleData,
    }

    const document = React.createElement(ComposableCertificate, {
      data: certData,
      style: config.templateStyle,
      locale,
      orientation: config.orientation as "landscape" | "portrait",
      pageSize: config.pageSize as "A4" | "LETTER",
      blockConfig: config.compositionConfig as
        | Partial<CertificateCompositionConfig>
        | undefined,
      regionPreset: config.regionPreset,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(document as any)
    const pdfBase64 = Buffer.from(buffer).toString("base64")

    return { success: true, data: { pdfBase64 } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to preview certificate",
    }
  }
}
