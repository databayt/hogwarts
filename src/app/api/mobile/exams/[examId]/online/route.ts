// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/exams/:examId/online — get online exam with questions
 */
export async function GET(
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

    // Find the student record for this user
    const student = await db.student.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Fetch exam and verify status
    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId: auth.schoolId },
      select: {
        id: true,
        title: true,
        duration: true,
        totalMarks: true,
        status: true,
        shuffleQuestions: true,
        maxAttempts: true,
        instructions: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    if (exam.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Exam is not currently in progress" },
        { status: 400 }
      )
    }

    // Check if student already submitted
    const existingSubmitted = await db.examSession.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId: auth.schoolId,
        status: "SUBMITTED",
      },
    })

    if (existingSubmitted) {
      return NextResponse.json(
        { error: "Exam already submitted" },
        { status: 400 }
      )
    }

    // Find or create exam session
    let session = await db.examSession.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId: auth.schoolId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
    })

    if (!session) {
      // Count existing attempts
      const attemptCount = await db.examSession.count({
        where: { examId, studentId: student.id, schoolId: auth.schoolId },
      })

      if (attemptCount >= exam.maxAttempts) {
        return NextResponse.json(
          { error: "Maximum attempts reached" },
          { status: 400 }
        )
      }

      session = await db.examSession.create({
        data: {
          schoolId: auth.schoolId,
          examId,
          studentId: student.id,
          attemptNumber: attemptCount + 1,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          lastActivityAt: new Date(),
        },
      })
    } else if (session.status === "NOT_STARTED") {
      session = await db.examSession.update({
        where: { id: session.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          lastActivityAt: new Date(),
        },
      })
    }

    // Get questions via GeneratedExam -> GeneratedExamQuestion -> QuestionBank
    const generatedExam = await db.generatedExam.findFirst({
      where: { examId, schoolId: auth.schoolId },
      select: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            points: true,
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true,
              },
            },
          },
        },
      },
    })

    const rawQuestions = generatedExam?.questions || []

    // Shuffle questions if configured
    const questions = exam.shuffleQuestions
      ? [...rawQuestions].sort(() => Math.random() - 0.5)
      : rawQuestions

    // Calculate time remaining
    const startedAt = session.startedAt || new Date()
    const elapsedMs = Date.now() - startedAt.getTime()
    const timeRemaining = Math.max(
      0,
      exam.duration * 60 - Math.floor(elapsedMs / 1000)
    )

    return NextResponse.json({
      session_id: session.id,
      exam_id: exam.id,
      title: exam.title,
      duration: exam.duration,
      total_marks: exam.totalMarks,
      instructions: exam.instructions,
      time_remaining: timeRemaining,
      questions: questions.map((q) => ({
        id: q.question.id,
        text: q.question.questionText,
        type: q.question.questionType,
        options: q.question.options,
        marks: Number(q.points),
        order: q.order,
      })),
    })
  } catch (error) {
    console.error("Mobile exam online error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
