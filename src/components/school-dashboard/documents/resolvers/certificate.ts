// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

import { formatDate, type ResolverCtx } from "./util"

/**
 * CERTIFICATE resolver — an `ExamCertificate` id → flat merge data.
 * The certificate row already carries denormalised recipient/exam fields
 * (captured at issue time), so this is a simple flat lookup.
 */
export async function resolveCertificateData(
  certificateId: string,
  ctx: ResolverCtx
): Promise<Record<string, unknown>> {
  const cert = await db.examCertificate.findFirst({
    where: { id: certificateId, schoolId: ctx.schoolId },
    select: {
      recipientName: true,
      recipientNameAr: true,
      examTitle: true,
      examDate: true,
      score: true,
      grade: true,
      rank: true,
      certificateNumber: true,
      verificationCode: true,
      verificationUrl: true,
      issuedAt: true,
    },
  })
  if (!cert) throw new Error("Certificate not found")

  const school = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: { name: true, nameEn: true, logoUrl: true },
  })

  return {
    studentName: cert.recipientName,
    studentNameAr: cert.recipientNameAr ?? cert.recipientName,
    examTitle: cert.examTitle,
    score: cert.score ?? "",
    grade: cert.grade ?? "",
    rank: cert.rank ?? "",
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    verificationUrl: cert.verificationUrl ?? "",
    date: formatDate(cert.issuedAt, ctx.lang),
    schoolName: school?.name ?? "",
    schoolNameEn: school?.nameEn ?? school?.name ?? "",
    schoolLogo: school?.logoUrl ?? "",
  }
}
