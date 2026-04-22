// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/exams/:examId/results — get exam results for authenticated student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id: examId } = await params

    // Find the student record
    const student = await db.student.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Look for ExamResult first (detailed marking)
    const examResult = await db.examResult.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId: auth.schoolId,
      },
      include: {
        exam: {
          select: {
            title: true,
            totalMarks: true,
            subject: { select: { name: true } },
          },
        },
      },
    })

    if (examResult) {
      // Compute rank among all results for this exam
      const betterResults = await db.examResult.count({
        where: {
          examId,
          schoolId: auth.schoolId,
          percentage: { gt: examResult.percentage },
          isAbsent: false,
        },
      })

      return NextResponse.json({
        exam_title: examResult.exam.title,
        score: examResult.marksObtained,
        max_score: examResult.totalMarks,
        percentage: examResult.percentage,
        grade: examResult.grade,
        rank: betterResults + 1,
        feedback: examResult.remarks,
        submitted_at: examResult.createdAt.toISOString(),
        graded_at: examResult.updatedAt.toISOString(),
        subject_name: examResult.exam.subject?.name || null,
      })
    }

    // Fallback to Result model
    const result = await db.result.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId: auth.schoolId,
      },
      include: {
        exam: {
          select: {
            title: true,
            subject: { select: { name: true } },
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json(
        { error: "Results not available" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      exam_title: result.exam?.title || result.title,
      score: Number(result.score),
      max_score: Number(result.maxScore),
      percentage: result.percentage,
      grade: result.grade,
      rank: null,
      feedback: result.feedback,
      submitted_at: result.submittedAt?.toISOString() || null,
      graded_at: result.gradedAt.toISOString(),
      subject_name: result.exam?.subject?.name || null,
    })
  } catch (error) {
    console.error("Mobile exam results error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
