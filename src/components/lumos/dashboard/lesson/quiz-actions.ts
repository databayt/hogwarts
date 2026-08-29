"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { getTenantContext } from "@/lib/tenant-context"
import type {
  LessonQuizAnswer,
  LessonQuizResult,
} from "@/components/lumos/lib/lesson-quiz"
import {
  ATTEMPT_ID_PATTERN,
  submitLessonQuizCore,
} from "@/components/lumos/lib/quiz-submission"

// ---------------------------------------------------------------------------
// Local minimal ActionResponse — mirrors the shape used across the codebase
// without pulling in the "use server"-marked lib/action-response module.
// ---------------------------------------------------------------------------
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// ---------------------------------------------------------------------------
// submitLessonQuiz
// ---------------------------------------------------------------------------

/**
 * Grade a lesson quiz. Grading, the attempt row and the gradebook write live
 * in `lib/quiz-submission.ts`, shared with the offline sync route; this action
 * owns the session and input hygiene.
 */
export async function submitLessonQuiz(input: {
  lessonId: string
  answers: LessonQuizAnswer[]
  /**
   * Minted on the device per submission. Lets a retried request (dropped
   * response, double tap) resolve to the SAME attempt instead of a second
   * row — and is what the offline outbox keys on.
   */
  attemptId?: string
}): Promise<ActionResponse<LessonQuizResult>> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      error: ACTION_ERRORS.UNAUTHORIZED,
      code: "UNAUTHORIZED",
    }
  }

  if (
    input.attemptId !== undefined &&
    !ATTEMPT_ID_PATTERN.test(input.attemptId)
  ) {
    return {
      success: false,
      error: ACTION_ERRORS.VALIDATION_ERROR,
      code: "INVALID_ATTEMPT_ID",
    }
  }

  // schoolId comes from the tenant context (subdomain/impersonation resolution).
  const { schoolId } = await getTenantContext()

  const outcome = await submitLessonQuizCore({
    userId: session.user.id,
    schoolId,
    lessonId: input.lessonId,
    answers: input.answers,
    attemptId: input.attemptId,
    source: "online",
  })

  switch (outcome.status) {
    case "noQuestions":
      return {
        success: false,
        error: ACTION_ERRORS.NOT_FOUND,
        code: "NO_QUESTIONS",
      }
    case "forbidden":
      return {
        success: false,
        error: ACTION_ERRORS.FORBIDDEN,
        code: "FORBIDDEN",
      }
    default:
      return { success: true, data: outcome.result }
  }
}
