// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Turning an exam session into submitted answers — shared by the student's
// submit action and the exam-lifecycle cron. A plain server module, NOT
// "use server": it takes a schoolId, and every export of a server-actions
// file is a public endpoint.

import "server-only"

import { db } from "@/lib/db"

import { finalizeStudentExam } from "../mark/actions/finalize"

export type SubmittedAnswer = {
  questionId: string
  answerText?: string
  selectedOptionIds?: string[]
}

/**
 * Network grace on the deadline. The player auto-submits AT time-up, so the
 * request always lands a little after it; with no late allowance configured
 * the strict deadline refused it and the attempt was marked EXPIRED with
 * every answer discarded. Thirty seconds covers a slow phone on a weak link
 * without giving anyone a meaningful extra.
 */
export const SUBMIT_GRACE_MS = 30_000

type DeadlineSession = {
  startedAt: Date | null
  exam: {
    duration: number
    allowLateSubmit: boolean
    lateSubmitMinutes: number
  }
}

/** The instant after which this session's own answers are no longer taken. */
export function sessionDeadline(s: DeadlineSession): Date | null {
  if (!s.startedAt) return null
  const lateMs = s.exam.allowLateSubmit ? s.exam.lateSubmitMinutes * 60_000 : 0
  return new Date(
    s.startedAt.getTime() + s.exam.duration * 60_000 + lateMs + SUBMIT_GRACE_MS
  )
}

/**
 * The answers the student had AUTO-SAVED by the deadline — what a late or
 * abandoned attempt is graded on. Never answers saved after it: that would
 * reward working past time.
 */
export function snapshotAnswersBy(
  snapshot: unknown,
  lastSavedAt: Date | null,
  deadline: Date | null
): SubmittedAnswer[] {
  if (!snapshot || typeof snapshot !== "object") return []
  if (deadline && lastSavedAt && lastSavedAt > deadline) return []
  const answers = (snapshot as { answers?: unknown }).answers
  if (!Array.isArray(answers)) return []
  return answers.filter(
    (a): a is SubmittedAnswer =>
      !!a &&
      typeof a === "object" &&
      typeof (a as { questionId?: unknown }).questionId === "string"
  )
}

/**
 * Write the answers, mark the session SUBMITTED, and instant-grade a
 * fully-objective exam. Status-guarded on IN_PROGRESS, so the student's own
 * submit and the cron cannot both finalize one session.
 */
export async function persistAndSubmit(input: {
  schoolId: string
  examId: string
  sessionId: string
  studentId: string
  answers: SubmittedAnswer[]
  notify?: boolean
  /**
   * Instant-grade a fully-objective exam. Only on the STUDENT's own submit:
   * `finalizeStudentExam` reads the student's session, so from the cron it
   * cannot run — those attempts are graded by the teacher's "Auto-mark &
   * publish", like any subjective exam.
   */
  instantGrade?: boolean
}): Promise<{ submitted: boolean }> {
  const { schoolId, examId, sessionId, studentId, answers } = input
  const now = new Date()

  const submitted = await db.$transaction(async (tx) => {
    const { count } = await tx.examSession.updateMany({
      where: { id: sessionId, schoolId, status: "IN_PROGRESS" },
      data: { status: "SUBMITTED", submittedAt: now },
    })
    if (count === 0) return false
    for (const answer of answers) {
      await tx.studentAnswer.upsert({
        where: {
          examId_questionId_studentId: {
            examId,
            questionId: answer.questionId,
            studentId,
          },
        },
        create: {
          schoolId,
          examId,
          questionId: answer.questionId,
          studentId,
          submissionType: "DIGITAL",
          answerText: answer.answerText,
          selectedOptionIds: answer.selectedOptionIds || [],
          submittedAt: now,
        },
        update: {
          answerText: answer.answerText,
          selectedOptionIds: answer.selectedOptionIds || [],
          submittedAt: now,
        },
      })
    }
    return true
  })
  if (!submitted) return { submitted: false }
  if (input.instantGrade === false) return { submitted: true }

  // Instant-grade fully-objective exams so the student sees their score now.
  // Subjective exams stay pending for teacher review.
  try {
    const gen = await db.generatedExam.findFirst({
      where: { examId, schoolId },
      select: {
        questions: {
          select: { question: { select: { questionType: true } } },
        },
      },
    })
    const allObjective =
      !!gen &&
      gen.questions.length > 0 &&
      gen.questions.every((q) =>
        ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(
          q.question.questionType
        )
      )
    if (allObjective) {
      await finalizeStudentExam(examId, studentId, {
        notify: input.notify ?? true,
      })
    }
  } catch (err) {
    console.error("Auto-finalize on submit error:", err)
  }
  return { submitted: true }
}

/**
 * Sessions still IN_PROGRESS past their deadline — the tab was closed, the
 * phone died, the connection dropped at time-up. Graded on what was
 * auto-saved by the deadline; a session with nothing saved is EXPIRED, as
 * before. Called by the exam-lifecycle cron.
 */
export async function finalizeAbandonedSessions(limit = 200): Promise<{
  submitted: number
  expired: number
}> {
  const now = Date.now()
  const candidates = await db.examSession.findMany({
    where: {
      status: "IN_PROGRESS",
      startedAt: { not: null, lt: new Date(now - SUBMIT_GRACE_MS) },
    },
    select: {
      id: true,
      schoolId: true,
      examId: true,
      studentId: true,
      startedAt: true,
      lastSavedAt: true,
      answerSnapshot: true,
      exam: {
        select: {
          duration: true,
          allowLateSubmit: true,
          lateSubmitMinutes: true,
        },
      },
    },
    orderBy: { startedAt: "asc" },
    take: limit,
  })

  let submitted = 0
  let expired = 0
  for (const s of candidates) {
    const deadline = sessionDeadline(s)
    if (!deadline || deadline.getTime() > now) continue
    const answers = snapshotAnswersBy(s.answerSnapshot, s.lastSavedAt, deadline)
    if (answers.length === 0) {
      await db.examSession.updateMany({
        where: { id: s.id, schoolId: s.schoolId, status: "IN_PROGRESS" },
        data: { status: "EXPIRED" },
      })
      expired++
      continue
    }
    const res = await persistAndSubmit({
      schoolId: s.schoolId,
      examId: s.examId,
      sessionId: s.id,
      studentId: s.studentId,
      answers,
      instantGrade: false,
    })
    if (res.submitted) submitted++
  }
  return { submitted, expired }
}
