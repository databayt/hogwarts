// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/exams/:id — exam detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const exam = await db.schoolExam.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        subject: { select: { id: true, name: true } },
      },
    })

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      exam_date: exam.examDate?.toISOString() || null,
      start_time: exam.startTime,
      end_time: exam.endTime,
      duration: exam.duration,
      total_marks: exam.totalMarks,
      passing_marks: exam.passingMarks,
      exam_type: exam.examType,
      status: exam.status,
      instructions: exam.instructions,
      proctor_mode: exam.proctorMode,
      shuffle_questions: exam.shuffleQuestions,
      max_attempts: exam.maxAttempts,
      subject_name: exam.subject?.name || null,
    })
  } catch (error) {
    console.error("Mobile exam detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
