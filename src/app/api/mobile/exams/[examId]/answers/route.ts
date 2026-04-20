// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * POST /api/mobile/exams/:examId/answers — submit exam answers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { examId } = await params
    const body = await request.json()
    const { session_id, answers } = body

    if (!session_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "session_id and answers array required" },
        { status: 400 }
      )
    }

    // Find the student record
    const student = await db.student.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify session belongs to the student and is active
    const session = await db.examSession.findFirst({
      where: {
        id: session_id,
        examId,
        studentId: student.id,
        schoolId: auth.schoolId,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (session.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Exam already submitted" },
        { status: 400 }
      )
    }

    // Get questions for auto-grading MCQ
    const generatedExam = await db.generatedExam.findFirst({
      where: { examId, schoolId: auth.schoolId },
      select: {
        questions: {
          select: {
            question: {
              select: {
                id: true,
                questionType: true,
                options: true,
                sampleAnswer: true,
              },
            },
          },
        },
      },
    })

    const questionMap = new Map(
      (generatedExam?.questions || []).map((q) => [q.question.id, q.question])
    )

    // Create StudentAnswer records
    let autoGradedScore = 0
    let answeredCount = 0

    for (const ans of answers as Array<{
      question_id: string
      answer: string | string[]
      time_spent?: number
    }>) {
      const selectedOptions = Array.isArray(ans.answer)
        ? ans.answer
        : [ans.answer]

      await db.studentAnswer.upsert({
        where: {
          examId_questionId_studentId: {
            examId,
            questionId: ans.question_id,
            studentId: student.id,
          },
        },
        create: {
          schoolId: auth.schoolId,
          examId,
          questionId: ans.question_id,
          studentId: student.id,
          submissionType: "DIGITAL",
          selectedOptionIds: selectedOptions,
          answerText: Array.isArray(ans.answer)
            ? ans.answer.join(",")
            : ans.answer,
          submittedAt: new Date(),
        },
        update: {
          selectedOptionIds: selectedOptions,
          answerText: Array.isArray(ans.answer)
            ? ans.answer.join(",")
            : ans.answer,
          submittedAt: new Date(),
        },
      })

      answeredCount++

      // Auto-grade objective questions (MCQ, TRUE_FALSE)
      const question = questionMap.get(ans.question_id)
      if (
        question &&
        (question.questionType === "MULTIPLE_CHOICE" ||
          question.questionType === "TRUE_FALSE")
      ) {
        const correctAnswer = question.sampleAnswer
        const studentAnswer = Array.isArray(ans.answer)
          ? ans.answer[0]
          : ans.answer

        if (
          correctAnswer &&
          studentAnswer &&
          correctAnswer.trim().toLowerCase() ===
            studentAnswer.trim().toLowerCase()
        ) {
          autoGradedScore++
        }
      }
    }

    // Update session status to SUBMITTED
    await db.examSession.update({
      where: { id: session_id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json({
      submitted: true,
      auto_graded_score: autoGradedScore > 0 ? autoGradedScore : null,
      total_questions: questionMap.size,
      answered_count: answeredCount,
    })
  } catch (error) {
    console.error("Mobile exam answers error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
