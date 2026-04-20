// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/exams/:examId/certificate — get exam completion certificate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { examId } = await params

    // Find the student record
    const student = await db.student.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Find exam result for this student
    const examResult = await db.examResult.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId: auth.schoolId,
      },
      select: { id: true },
    })

    if (!examResult) {
      return NextResponse.json(
        { error: "Exam result not found" },
        { status: 404 }
      )
    }

    // Find certificate linked to this exam result
    const certificate = await db.examCertificate.findFirst({
      where: {
        examResultId: examResult.id,
        studentId: student.id,
        schoolId: auth.schoolId,
      },
      include: {
        config: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not available" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      certificate_id: certificate.id,
      certificate_number: certificate.certificateNumber,
      exam_title: certificate.examTitle,
      student_name: certificate.recipientName,
      student_name_ar: certificate.recipientNameAr,
      score: certificate.score,
      grade: certificate.grade,
      rank: certificate.rank,
      issued_at: certificate.issuedAt.toISOString(),
      expires_at: certificate.expiresAt?.toISOString() || null,
      certificate_url: certificate.pdfUrl,
      thumbnail_url: certificate.thumbnailUrl,
      verification_code: certificate.verificationCode,
      verification_url: certificate.verificationUrl,
      certificate_type: certificate.config.type,
      status: certificate.status,
    })
  } catch (error) {
    console.error("Mobile exam certificate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
