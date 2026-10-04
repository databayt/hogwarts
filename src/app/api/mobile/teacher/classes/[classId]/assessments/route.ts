// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"
import { hasRole } from "../../../../lib/roles"
import { resolveClassTarget } from "../target"

/**
 * GET /api/mobile/teacher/classes/:classId/assessments — the exams of a
 * section (`{classId}`): its own and its grade's whole-grade exams, a
 * teacher's narrowed to the subjects they teach. `?subject_id=` narrows more.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { classId } = await params

    // `{classId}` is a section
    const target = await resolveClassTarget(auth, classId)
    if (!target.ok) return target.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const subjectId = searchParams.get("subject_id") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const skip = (page - 1) * perPage

    const where = {
      schoolId: auth.schoolId,
      ...target.examWhere,
      ...(subjectId ? { subjectId } : {}),
      ...(status
        ? {
            status: status as
              | "PLANNED"
              | "IN_PROGRESS"
              | "COMPLETED"
              | "CANCELLED",
          }
        : {}),
    }

    const [exams, total] = await Promise.all([
      db.schoolExam.findMany({
        where,
        orderBy: { examDate: "desc" },
        skip,
        take: perPage,
        include: {
          subject: { select: { id: true, name: true } },
          _count: { select: { examResults: true } },
        },
      }),
      db.schoolExam.count({ where }),
    ])

    const data = exams.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      exam_date: e.examDate?.toISOString() || null,
      start_time: e.startTime,
      end_time: e.endTime,
      duration: e.duration,
      total_marks: e.totalMarks,
      passing_marks: e.passingMarks,
      exam_type: e.examType,
      status: e.status,
      subject_name: e.subject?.name || null,
      results_count: e._count.examResults,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile teacher assessments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
