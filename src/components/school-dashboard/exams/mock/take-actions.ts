"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"

export interface MockQuestion {
  id: string
  questionText: string
  questionType: string
  options: { text: string; id: string }[]
  points: number
  order: number
}

export interface MockQuestionWithAnswer extends MockQuestion {
  correctAnswer: string | null
  correctOptionIds: string[]
  explanation: string | null
  sampleAnswer: string | null
}

export interface MockExamData {
  id: string
  title: string
  subjectName: string
  durationMinutes: number | null
  totalMarks: number | null
  totalQuestions: number
  questions: MockQuestion[]
}

export interface MockExamResult {
  examId: string
  title: string
  questions: MockQuestionWithAnswer[]
  totalPoints: number
}

/**
 * Get a catalog exam with questions for mock taking.
 * Strips correct answers from the response for student use.
 */
export async function getCatalogExamForTaking(
  catalogExamId: string
): Promise<{ success: boolean; data?: MockExamData; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const exam = await db.catalogExam.findFirst({
      where: {
        id: catalogExamId,
        status: "PUBLISHED",
      },
      include: {
        subject: { select: { name: true } },
        examQuestions: {
          orderBy: { order: "asc" },
          include: {
            catalogQuestion: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true,
                points: true,
              },
            },
          },
        },
      },
    })

    if (!exam) {
      return { success: false, error: "Mock exam not found" }
    }

    // Increment usage count
    await db.catalogExam.update({
      where: { id: catalogExamId },
      data: { usageCount: { increment: 1 } },
    })

    // Strip correct answers from options
    const questions: MockQuestion[] = exam.examQuestions.map((eq) => {
      const q = eq.catalogQuestion
      let options: { text: string; id: string }[] = []

      if (Array.isArray(q.options)) {
        options = (q.options as any[]).map((opt: any, idx: number) => ({
          text: opt.text || opt.label || String(opt),
          id: idx.toString(),
        }))
      }

      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options,
        points: Number(q.points || eq.points),
        order: eq.order,
      }
    })

    return {
      success: true,
      data: {
        id: exam.id,
        title: exam.title,
        subjectName: exam.subject.name,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        totalQuestions: questions.length,
        questions,
      },
    }
  } catch (error) {
    console.error("Error loading mock exam:", error)
    return { success: false, error: "Failed to load mock exam" }
  }
}

/**
 * Submit mock exam answers and get results with correct answers.
 * Returns the questions with correct answers for review.
 */
export async function submitMockExam(input: {
  catalogExamId: string
  answers: Record<string, string | string[]>
}): Promise<{
  success: boolean
  data?: {
    score: number
    totalPoints: number
    percentage: number
    questions: MockQuestionWithAnswer[]
  }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const exam = await db.catalogExam.findFirst({
      where: {
        id: input.catalogExamId,
        status: "PUBLISHED",
      },
      include: {
        examQuestions: {
          orderBy: { order: "asc" },
          include: {
            catalogQuestion: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true,
                points: true,
                sampleAnswer: true,
                explanation: true,
              },
            },
          },
        },
      },
    })

    if (!exam) {
      return { success: false, error: "Mock exam not found" }
    }

    let totalScore = 0
    let totalPoints = 0

    const questionsWithAnswers: MockQuestionWithAnswer[] =
      exam.examQuestions.map((eq) => {
        const q = eq.catalogQuestion
        const points = Number(q.points || eq.points)
        totalPoints += points

        const options = Array.isArray(q.options) ? (q.options as any[]) : []

        // Determine correct answer(s)
        const correctOptionIds = options
          .map((opt: any, idx: number) =>
            opt.isCorrect ? idx.toString() : null
          )
          .filter(Boolean) as string[]

        const correctAnswer =
          q.sampleAnswer ||
          options
            .filter((opt: any) => opt.isCorrect)
            .map((opt: any) => opt.text)
            .join(", ") ||
          null

        // Auto-grade MCQ, TRUE_FALSE, FILL_IN_BLANK
        const studentAnswer = input.answers[q.id]
        let earnedPoints = 0

        if (studentAnswer) {
          if (
            q.questionType === "MULTIPLE_CHOICE" ||
            q.questionType === "TRUE_FALSE"
          ) {
            const selectedIds = Array.isArray(studentAnswer)
              ? studentAnswer
              : [studentAnswer]
            const isCorrect =
              correctOptionIds.length === selectedIds.length &&
              correctOptionIds.every((id) => selectedIds.includes(id))
            if (isCorrect) earnedPoints = points
          } else if (q.questionType === "FILL_BLANK") {
            const answer =
              typeof studentAnswer === "string" ? studentAnswer.trim() : ""
            if (
              correctAnswer &&
              answer.toLowerCase() === correctAnswer.toLowerCase()
            ) {
              earnedPoints = points
            }
          }
          // Essay and short answer: show model answer, no auto-grading
        }

        totalScore += earnedPoints

        return {
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: options.map((opt: any, idx: number) => ({
            text: opt.text || opt.label || String(opt),
            id: idx.toString(),
          })),
          points,
          order: eq.order,
          correctAnswer,
          correctOptionIds,
          explanation: q.explanation,
          sampleAnswer: q.sampleAnswer,
        }
      })

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0

    return {
      success: true,
      data: {
        score: totalScore,
        totalPoints,
        percentage: Math.round(percentage * 10) / 10,
        questions: questionsWithAnswers,
      },
    }
  } catch (error) {
    console.error("Error submitting mock exam:", error)
    return { success: false, error: "Failed to submit mock exam" }
  }
}
