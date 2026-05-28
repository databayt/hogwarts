// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { canAccessStudent } from "../../lib/student-access"

/**
 * GET /api/mobile/report-cards/:id — report card detail with grades by subject
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const reportCard = await db.reportCard.findFirst({
      where: { id, schoolId: auth.schoolId },
      select: {
        id: true,
        studentId: true,
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
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        term: { select: { id: true, termNumber: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            section: {
              select: { name: true, grade: { select: { name: true } } },
            },
          },
        },
        grades: {
          select: {
            id: true,
            grade: true,
            score: true,
            maxScore: true,
            percentage: true,
            credits: true,
            comments: true,
            subject: { select: { id: true, name: true } },
          },
          orderBy: { subject: { name: "asc" } },
        },
      },
    })

    if (!reportCard) {
      return NextResponse.json(
        { error: "Report card not found" },
        { status: 404 }
      )
    }

    // Relationship gate: STUDENT must own this report card; GUARDIAN must
    // be linked to the student. Without this any authed user in the school
    // could read other students' report cards by id.
    const allowed = await canAccessStudent(auth, reportCard.studentId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      id: reportCard.id,
      student: {
        id: reportCard.student.id,
        given_name: reportCard.student.firstName,
        family_name: reportCard.student.lastName,
        section: reportCard.student.section?.name || null,
        grade: reportCard.student.section?.grade?.name || null,
      },
      term_id: reportCard.termId,
      term_name: reportCard.term ? `Term ${reportCard.term.termNumber}` : null,
      overall_grade: reportCard.overallGrade,
      overall_gpa: reportCard.overallGPA ? Number(reportCard.overallGPA) : null,
      rank: reportCard.rank,
      total_students: reportCard.totalStudents,
      days_present: reportCard.daysPresent,
      days_absent: reportCard.daysAbsent,
      days_late: reportCard.daysLate,
      teacher_comments: reportCard.teacherComments,
      principal_comments: reportCard.principalComments,
      // `pdf_url` is kept for one release for older app builds. New
      // clients should use `download_url` (Phase 2b signed-URL gate).
      // Will be removed once mobile confirms uptake.
      pdf_url: reportCard.pdfUrl,
      download_url: reportCard.pdfUrl
        ? `/api/parent/report-cards/${reportCard.id}/download`
        : null,
      is_published: reportCard.isPublished,
      published_at: reportCard.publishedAt?.toISOString() || null,
      created_at: reportCard.createdAt.toISOString(),
      grades: reportCard.grades.map((g) => ({
        id: g.id,
        subject_id: g.subject?.id || null,
        subject_name: g.subject?.name || null,
        grade: g.grade,
        score: g.score ? Number(g.score) : null,
        max_score: g.maxScore ? Number(g.maxScore) : null,
        percentage: g.percentage,
        credits: g.credits ? Number(g.credits) : null,
        comments: g.comments,
      })),
    })
  } catch (error) {
    console.error("Mobile report card detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
