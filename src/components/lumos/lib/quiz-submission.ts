// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import {
  resolveStudentClassForSubject,
  upsertGradebookResult,
} from "@/components/school-dashboard/grades/lib/gradebook"

import {
  fetchLessonQuizQuestions,
  gradeQuestion,
  type LessonQuizAnswer,
  type LessonQuizResult,
} from "./lesson-quiz"

/**
 * Grade and RECORD a lesson-quiz submission.
 *
 * Shared by the `submitLessonQuiz` action (online) and `POST /api/offline/sync`
 * (an outbox replay). The attempt id is minted where the answers were given —
 * on the device — so a replay that reaches the server twice (retry after a
 * dropped response, two tabs draining the same outbox) is one attempt, not
 * two: the second arrival finds the row and hands back what the first one
 * stored, without regrading and without touching the gradebook again.
 *
 * Plain module, NOT `"use server"` — takes a `userId` from the caller.
 */

/** Accepts both cuid-style ids and UUIDs; rejects anything that could be a path. */
export const ATTEMPT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/

export type QuizSubmissionOutcome =
  | { status: "graded"; result: LessonQuizResult; duplicate: boolean }
  /** No gradeable, visible questions for this lesson (hidden, or none exist). */
  | { status: "noQuestions" }
  /** The attempt id belongs to a different user. */
  | { status: "forbidden" }

export async function submitLessonQuizCore(input: {
  userId: string
  schoolId: string | null
  lessonId: string
  answers: LessonQuizAnswer[]
  /** Device-minted id. Omitted = a fresh online attempt; one is minted here. */
  attemptId?: string
  source?: "online" | "offline"
  /** When the student pressed submit — for a replay, hours before it lands. */
  submittedAt?: Date
}): Promise<QuizSubmissionOutcome> {
  const { userId, schoolId, lessonId } = input
  const attemptId = input.attemptId ?? randomUUID()

  if (input.attemptId) {
    const replay = await findStoredAttempt(attemptId)
    if (replay) {
      if (replay.userId !== userId) return { status: "forbidden" }
      return replayResult(replay, schoolId)
    }
  }

  // The SAME set the lesson player rendered — gates, order and cap all live in
  // lib/lesson-quiz.ts. Grading against an independently-built set scored
  // students out of questions they were never shown.
  const questions = await fetchLessonQuizQuestions(lessonId, schoolId)
  if (questions.length === 0) return { status: "noQuestions" }

  // The subject is DERIVED from the lesson, never taken from the caller: the
  // action is a POST endpoint, and a client-supplied subjectId let a student
  // file their quiz result under any subject in the gradebook.
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { name: true, chapter: { select: { subjectId: true } } },
  })
  const subjectId = lesson?.chapter.subjectId ?? null

  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]))
  const verdicts = questions.map((q) => gradeQuestion(q, answerMap.get(q.id)))
  const total = verdicts.length
  const score = verdicts.filter((v) => v.isCorrect).length
  const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0

  try {
    await db.lessonQuizAttempt.create({
      data: {
        id: attemptId,
        userId,
        schoolId,
        catalogLessonId: lessonId,
        answers: input.answers as unknown as Prisma.InputJsonValue,
        score,
        total,
        percentage,
        source: input.source ?? "online",
        submittedAt: input.submittedAt ?? new Date(),
      },
      select: { id: true },
    })
  } catch (err) {
    // Two drains of the same outbox racing past the lookup above: the loser
    // hits the primary key. Whoever won stored the truth — return it.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const stored = await findStoredAttempt(attemptId)
      if (stored) {
        if (stored.userId !== userId) return { status: "forbidden" }
        return replayResult(stored, schoolId)
      }
    }
    throw err
  }

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
      console.error("[submitLessonQuizCore] gradebook write failed:", gbErr)
      // Gradebook failure must not block the score response.
    }
  }

  return {
    status: "graded",
    duplicate: false,
    result: { score, total, percentage, verdicts, recorded },
  }
}

type StoredAttempt = {
  userId: string
  catalogLessonId: string
  answers: unknown
  score: number
  total: number
  percentage: number
}

async function findStoredAttempt(id: string): Promise<StoredAttempt | null> {
  return db.lessonQuizAttempt.findUnique({
    where: { id },
    select: {
      userId: true,
      catalogLessonId: true,
      answers: true,
      score: true,
      total: true,
      percentage: true,
    },
  })
}

/**
 * The stored score is the truth; the per-question reveal is rebuilt from the
 * stored answers against today's question set so a retry still gets the
 * explanations. `recorded: false` — the gradebook write happened (or was
 * declined) on the first arrival.
 */
async function replayResult(
  stored: StoredAttempt,
  schoolId: string | null
): Promise<QuizSubmissionOutcome> {
  const answers = Array.isArray(stored.answers)
    ? (stored.answers as LessonQuizAnswer[])
    : []
  const questions = await fetchLessonQuizQuestions(
    stored.catalogLessonId,
    schoolId
  )
  const answerMap = new Map(answers.map((a) => [a.questionId, a]))
  const verdicts = questions.map((q) => gradeQuestion(q, answerMap.get(q.id)))
  return {
    status: "graded",
    duplicate: true,
    result: {
      score: stored.score,
      total: stored.total,
      percentage: stored.percentage,
      verdicts,
      recorded: false,
    },
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
export function quizResultTitle(lessonName: string | null | undefined): string {
  return lessonName?.trim() || "Lumos lesson quiz"
}
