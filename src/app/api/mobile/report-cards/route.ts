// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * GET /api/mobile/report-cards — list report cards for a student
 *
 * Query params:
 *   student_id — required (or inferred from user if student role)
 *   page, per_page — pagination
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "20")
    const skip = (page - 1) * perPage

    // Determine target student
    let studentId = searchParams.get("student_id") || undefined
    if (!studentId) {
      const student = await db.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })
      studentId = student?.id
    }

    if (!studentId) {
      return NextResponse.json({ data: [], total: 0, page, per_page: perPage })
    }

    const where = {
      schoolId: auth.schoolId,
      studentId,
      isPublished: true,
    }

    const [reportCards, total] = await Promise.all([
      db.reportCard.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          termId: true,
          overallGrade: true,
          overallGPA: true,
          rank: true,
          totalStudents: true,
          daysPresent: true,
          daysAbsent: true,
          daysLate: true,
          teacherComments: true,
          principalComments: true,
          pdfUrl: true,
          publishedAt: true,
          createdAt: true,
          term: { select: { id: true, termNumber: true } },
        },
      }),
      db.reportCard.count({ where }),
    ])

    const data = reportCards.map((rc) => ({
      id: rc.id,
      term_id: rc.termId,
      term_name: rc.term ? `Term ${rc.term.termNumber}` : null,
      overall_grade: rc.overallGrade,
      overall_gpa: rc.overallGPA ? Number(rc.overallGPA) : null,
      rank: rc.rank,
      total_students: rc.totalStudents,
      days_present: rc.daysPresent,
      days_absent: rc.daysAbsent,
      days_late: rc.daysLate,
      teacher_comments: rc.teacherComments,
      principal_comments: rc.principalComments,
      pdf_url: rc.pdfUrl,
      published_at: rc.publishedAt?.toISOString() || null,
      created_at: rc.createdAt.toISOString(),
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile report cards list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
