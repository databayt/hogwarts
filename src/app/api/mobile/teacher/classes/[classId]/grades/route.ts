// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

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

    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "SUPER_ADMIN"
    ) {
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

    // Verify exam exists and belongs to this class
    const exam = await db.schoolExam.findFirst({
      where: {
        id: exam_id,
        classId,
        schoolId: auth.schoolId,
      },
      select: { id: true, totalMarks: true },
    })

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found for this class" },
        { status: 404 }
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
