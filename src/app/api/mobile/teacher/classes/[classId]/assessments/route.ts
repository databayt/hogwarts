// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * GET /api/mobile/teacher/classes/:classId/assessments — list exams for a class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { classId } = await params

    // Verify teacher assignment for TEACHER role
    if (auth.role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const assigned = await db.class.findFirst({
        where: {
          id: classId,
          schoolId: auth.schoolId,
          OR: [
            { teacherId: teacher.id },
            { classTeachers: { some: { teacherId: teacher.id } } },
          ],
        },
        select: { id: true },
      })

      if (!assigned) {
        return NextResponse.json(
          { error: "Not assigned to this class" },
          { status: 403 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const skip = (page - 1) * perPage

    const where = {
      classId,
      schoolId: auth.schoolId,
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
