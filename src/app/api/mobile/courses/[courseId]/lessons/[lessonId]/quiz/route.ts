// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { submitLessonQuizCore } from "@/components/lumos/lib/quiz-submission"

import { authenticate, isAuthError } from "../../../../../lib/authenticate"

/** See the note on `passed` below — an API default, not a school's rule. */
const PASS_PERCENTAGE = 50

/**
 * Grade and record a lesson quiz — `submitLessonQuizCore`, the same module the
 * web action and the offline outbox replay both call. It grades against the
 * set the player actually rendered, writes the first attempt to the gradebook
 * and no later one, and treats a repeated attempt id as one attempt rather
 * than two.
 *
 * POST /api/mobile/courses/:courseId/lessons/:lessonId/quiz
 * Body: { answers: { "<questionId>": <optionIndex> }, attempt_id?, submitted_at? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { userId, schoolId } = auth
    const { lessonId } = await params

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || typeof body.answers !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    // The app sends a map of questionId to the option the reader picked; the
    // core takes the list form the web player posts.
    const answers = Object.entries(
      body.answers as Record<string, unknown>
    ).map(([questionId, selected]) =>
      // A number is the chosen option; a string is a free-text answer. The
      // grader reads `selectedOptionIndex` / `answerText` — the old
      // `selectedIndex` key was never read, so every phone answer graded as
      // unanswered.
      typeof selected === "string"
        ? { questionId, answerText: selected }
        : { questionId, selectedOptionIndex: Number(selected) }
    )

    const submittedAt = body.submitted_at ? new Date(body.submitted_at) : undefined

    const outcome = await submitLessonQuizCore({
      userId,
      schoolId,
      lessonId,
      answers,
      attemptId: typeof body.attempt_id === "string" ? body.attempt_id : undefined,
      // An attempt that reaches here carrying the moment it was taken was
      // taken on a plane, not in the app just now.
      source: submittedAt ? "offline" : "online",
      submittedAt: submittedAt && !Number.isNaN(submittedAt.getTime()) ? submittedAt : undefined,
    })

    if (outcome.status === "noQuestions") {
      return NextResponse.json({ error: "no_questions" }, { status: 409 })
    }
    if (outcome.status === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { result } = outcome
    return NextResponse.json({
      score: result.score,
      total_questions: result.total,
      percentage: result.percentage,
      // The web defines NO pass mark for a lesson quiz — it records the
      // score and lets report cards decide what a grade means. The Android
      // DTO requires a boolean, so this is the API's own default, not a rule
      // any school set. Replace it the day a threshold is configured.
      passed: result.percentage >= PASS_PERCENTAGE,
      synced_to_gradebook: result.recorded,
      // The web player's post-submit reveal, question by question.
      verdicts: result.verdicts.map((v) => ({
        question_id: v.questionId,
        is_correct: v.isCorrect,
        correct_index: v.correctIndex,
        correct_answers: v.correctAnswers,
        explanation: v.explanation,
        sample_answer: v.sampleAnswer,
      })),
    })
  } catch (error) {
    console.error("[mobile/courses/lessons/quiz] POST failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
