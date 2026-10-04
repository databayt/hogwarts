// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { audienceRosterWhere } from "@/lib/teaching-audience"

import { authenticate, isAuthError } from "../../../../lib/authenticate"
import { hasRole } from "../../../../lib/roles"
import { resolveClassTarget } from "../target"

/**
 * POST /api/mobile/teacher/classes/:classId/grades — submit grades for students
 */
export async function POST(
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
    const body = await request.json()
    const { exam_id, results: gradeResults } = body

    if (!exam_id || !gradeResults || !Array.isArray(gradeResults)) {
      return NextResponse.json(
        { error: "exam_id and results array required" },
        { status: 400 }
      )
    }

    // `{classId}` is a section (a legacy class id still resolves)
    const target = await resolveClassTarget(auth, classId)
    if (!target.ok) return target.response

    // The exam must be one the caller may work with here
    const exam = await db.schoolExam.findFirst({
      where: { id: exam_id, schoolId: auth.schoolId, ...target.examWhere },
      select: {
        id: true,
        totalMarks: true,
        classId: true,
        gradeId: true,
        sectionId: true,
      },
    })

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found for this class" },
        { status: 404 }
      )
    }

    // Every student must sit the exam — in this section when `{classId}` is
    // one. Ids are global CUIDs: anything else could write a mark for
    // another school's student.
    const studentIds = [
      ...new Set(
        (gradeResults as Array<{ student_id: string }>).map((r) => r.student_id)
      ),
    ]
    const onRoster = await db.student.findMany({
      where: {
        ...audienceRosterWhere(auth.schoolId, {
          classId: exam.classId,
          gradeId: exam.gradeId,
          sectionId: exam.sectionId,
        }),
        ...(target.sectionId ? { sectionId: target.sectionId } : {}),
        id: { in: studentIds },
      },
      select: { id: true },
    })
    const allowed = new Set(onRoster.map((s) => s.id))
    const outside = studentIds.filter((id) => !allowed.has(id))
    if (outside.length > 0) {
      return NextResponse.json(
        { error: "Student not in this class", student_ids: outside },
        { status: 400 }
      )
    }

    // Create ExamResult records
    let count = 0
    for (const result of gradeResults as Array<{
      student_id: string
      score: number
      feedback?: string
    }>) {
      const percentage =
        exam.totalMarks > 0 ? (result.score / exam.totalMarks) * 100 : 0

      // Determine letter grade from percentage
      let grade = "F"
      if (percentage >= 90) grade = "A+"
      else if (percentage >= 85) grade = "A"
      else if (percentage >= 80) grade = "B+"
      else if (percentage >= 75) grade = "B"
      else if (percentage >= 70) grade = "C+"
      else if (percentage >= 65) grade = "C"
      else if (percentage >= 60) grade = "D+"
      else if (percentage >= 50) grade = "D"

      await db.examResult.upsert({
        where: {
          examId_studentId: {
            examId: exam_id,
            studentId: result.student_id,
          },
        },
        create: {
          schoolId: auth.schoolId,
          examId: exam_id,
          studentId: result.student_id,
          marksObtained: result.score,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          remarks: result.feedback || null,
        },
        update: {
          marksObtained: result.score,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          remarks: result.feedback || null,
        },
      })

      count++
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Mobile teacher grades error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
