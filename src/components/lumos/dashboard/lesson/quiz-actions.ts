"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  fetchLessonQuizQuestions,
  gradeQuestion,
  type LessonQuizAnswer,
  type LessonQuizResult,
} from "@/components/lumos/lib/lesson-quiz"
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
// submitLessonQuiz
// ---------------------------------------------------------------------------

export async function submitLessonQuiz(input: {
  lessonId: string
  answers: LessonQuizAnswer[]
}): Promise<ActionResponse<LessonQuizResult>> {
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

  // The SAME set the lesson player rendered — gates, order and cap all live in
  // lib/lesson-quiz.ts. Grading against an independently-built set scored
  // students out of questions they were never shown.
  const questions = await fetchLessonQuizQuestions(input.lessonId, schoolId)

  if (questions.length === 0) {
    return {
      success: false,
      error: ACTION_ERRORS.NOT_FOUND,
      code: "NO_QUESTIONS",
    }
  }

  // The subject is DERIVED from the lesson, never taken from the caller: this
  // action is a POST endpoint, and a client-supplied subjectId let a student
  // file their quiz result under any subject in the gradebook.
  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    select: { name: true, chapter: { select: { subjectId: true } } },
  })
  const subjectId = lesson?.chapter.subjectId ?? null

  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]))

  const verdicts = questions.map((q) => gradeQuestion(q, answerMap.get(q.id)))
  const total = verdicts.length
  const score = verdicts.filter((v) => v.isCorrect).length
  const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0

  let recorded = false

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
          subjectId
        )

        if (classId) {
          // TWO rules govern this write, both learned from the old version:
          //
          //  1. The title is PER LESSON. `upsertGradebookResult` matches on
          //     (subject, title) when there is no exam/assignment FK, so the
          //     constant "LMS quiz" collapsed every lesson quiz in a subject
          //     into ONE row that each new lesson overwrote.
          //  2. Only the FIRST attempt is recorded. Nothing stops a student
          //     retaking a practice quiz, and this row feeds report cards — a
          //     last-write-wins row converges on 100% for everyone. Later
          //     attempts still score and reveal answers, they just don't
          //     rewrite the gradebook.
          const written = await upsertGradebookResult({
            schoolId,
            studentId: student.id,
            classId,
            subjectId,
            score,
            maxScore: total,
            title: quizResultTitle(lesson?.name),
            description: "Lumos lesson quiz",
            gradedBy: userId,
            onlyIfAbsent: true,
          })
          recorded = written !== null
        }
      }
    } catch (gbErr) {
      console.error("[submitLessonQuiz] gradebook write failed:", gbErr)
      // Gradebook failure must not block the score response.
    }
  }

  return {
    success: true,
    data: { score, total, percentage, verdicts, recorded },
  }
}

/**
 * The gradebook row's title — and, because `upsertGradebookResult` matches on
 * `(subject, title)` when there is no exam/assignment FK, its identity key.
 *
 * It is the LESSON NAME, bare. Two properties matter and they pull against
 * each other:
 *
 *  1. **Stable.** Anything that varies per attempt splits one lesson's row in
 *     two; anything that varies per reader (a translated prefix, the school's
 *     current `preferredLanguage`) orphans every row the day it changes.
 *  2. **Readable in the right language.** An English `"Quiz — "` prefix would
 *     render as-is on an Arabic report card.
 *
 *  The lesson name satisfies both for free: it already carries the catalog's
 *  storage language, and it never changes per attempt or per reader. What KIND
 *  of row this is lives in `description`, which is not part of the match.
 *
 *  Known edge: two lessons with identical names under one subject still
 *  collapse to a single row. Recorded in ISSUE.md; a fix needs a lesson FK on
 *  `Result`, i.e. a schema change.
 */
function quizResultTitle(lessonName: string | null | undefined): string {
  return lessonName?.trim() || "Lumos lesson quiz"
}
