"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  resolveStudentClassForSubject,
  upsertGradebookResult,
} from "@/components/school-dashboard/grades/lib/gradebook"

// ---------------------------------------------------------------------------
// Local minimal ActionResponse — mirrors the shape used across the codebase
// without pulling in the "use server"-marked lib/action-response module.
// ---------------------------------------------------------------------------
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// ---------------------------------------------------------------------------
// Option shapes stored in Question.options (JSON)
// ---------------------------------------------------------------------------

/** MULTIPLE_CHOICE / TRUE_FALSE: Array<{ text: string; isCorrect: boolean }> */
interface ChoiceOption {
  text: string
  isCorrect: boolean
}

/** FILL_BLANK: { acceptedAnswers: string[]; caseSensitive?: boolean } */
interface FillBlankOptions {
  acceptedAnswers: string[]
  caseSensitive?: boolean
}

// ---------------------------------------------------------------------------
// submitLessonQuiz
// ---------------------------------------------------------------------------

export async function submitLessonQuiz(input: {
  lessonId: string
  subjectId?: string
  answers: Array<{
    questionId: string
    selectedOptionIndex?: number
    answerText?: string
  }>
}): Promise<
  ActionResponse<{ score: number; total: number; percentage: number }>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      error: ACTION_ERRORS.UNAUTHORIZED,
      code: "UNAUTHORIZED",
    }
  }

  const userId = session.user.id

  // schoolId comes from the tenant context (subdomain/impersonation resolution).
  const { schoolId } = await getTenantContext()

  // Load approved catalog questions for this lesson (global — no schoolId).
  const questions = await db.question.findMany({
    where: {
      catalogLessonId: input.lessonId,
      approvalStatus: "APPROVED",
    },
    select: {
      id: true,
      questionType: true,
      options: true,
    },
    take: 20,
  })

  if (questions.length === 0) {
    return {
      success: false,
      error: ACTION_ERRORS.NOT_FOUND,
      code: "NO_QUESTIONS",
    }
  }

  // Build an answer lookup keyed by questionId.
  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]))

  let score = 0
  let total = 0

  // NOTE: an unanswered gradeable question counts toward `total` but earns no
  // point. Skipping used to `continue` before `total++`, which scored "answered
  // 1 of 10 correctly, skipped the rest" as 100% — harmless for practice, but
  // this result feeds the gradebook and report cards.
  for (const q of questions) {
    const studentAnswer = answerMap.get(q.id)
    const type = q.questionType as string

    if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
      // options: Array<{ text: string; isCorrect: boolean }>
      const opts = q.options as ChoiceOption[] | null
      if (!opts || opts.length === 0) continue

      total++
      const idx = studentAnswer?.selectedOptionIndex
      if (idx !== undefined && idx >= 0 && idx < opts.length) {
        if (opts[idx].isCorrect === true) score++
      }
    } else if (type === "FILL_BLANK") {
      // options: { acceptedAnswers: string[]; caseSensitive?: boolean }
      const opts = q.options as FillBlankOptions | null
      if (
        !opts ||
        !Array.isArray(opts.acceptedAnswers) ||
        opts.acceptedAnswers.length === 0
      )
        continue

      total++
      const raw = studentAnswer?.answerText ?? ""
      const caseSensitive = opts.caseSensitive === true
      const studentText = caseSensitive ? raw.trim() : raw.trim().toLowerCase()
      const match = opts.acceptedAnswers.some((accepted) => {
        const normalized = caseSensitive
          ? accepted.trim()
          : accepted.trim().toLowerCase()
        return studentText === normalized
      })
      if (match) score++
    }
    // Other question types (SHORT_ANSWER, ESSAY, etc.) cannot be auto-graded
    // in-memory; skip them.
  }

  const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0

  // Attempt gradebook write only when the student is school-enrolled.
  if (schoolId && total > 0) {
    try {
      const student = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })

      if (student) {
        const classId = await resolveStudentClassForSubject(
          schoolId,
          student.id,
          input.subjectId ?? null
        )

        if (classId) {
          await upsertGradebookResult({
            schoolId,
            studentId: student.id,
            classId,
            subjectId: input.subjectId ?? null,
            score,
            maxScore: total,
            title: "LMS quiz",
            gradedBy: userId,
          })
        }
      }
    } catch (gbErr) {
      console.error("[submitLessonQuiz] gradebook write failed:", gbErr)
      // Gradebook failure must not block the score response.
    }
  }

  return {
    success: true,
    data: { score, total, percentage },
  }
}
