// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

/**
 * What a class left behind, for its page: the homework and quick checks
 * linked to it — each with the reader's own status when the reader is a
 * student, or how many handed in / answered when the reader is staff — and
 * the polls the host closed in the room.
 *
 * The page renders this only after `loadLiveClassDetail` has admitted the
 * viewer, so access is settled; every read here is still school-scoped.
 */

const HANDED_IN = ["SUBMITTED", "LATE_SUBMITTED", "GRADED", "RETURNED"]
const HOST_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]

export interface ClassWorkViewer {
  userId: string | null | undefined
  role: string | null | undefined
  schoolId: string | null | undefined
}

export type HomeworkItem = {
  id: string
  title: string
  dueDate: Date
  totalPoints: number
  /** Student: their own submission. */
  mine?: { status: string; score: number | null } | null
  /** Staff: submissions handed in. */
  handedIn?: number
}

export type QuickCheckItem = {
  id: string
  title: string
  status: string
  /** Student: their own response, marked by the server. */
  mine?: { correct: number; keyed: number } | null
  /** Staff: responses received. */
  responses?: number
}

export type ClassPoll = {
  id: string
  question: string
  options: string[]
  counts: number[]
  total: number
}

export async function loadClassWork(
  sessionId: string,
  viewer: ClassWorkViewer
) {
  const { schoolId, userId, role } = viewer
  if (!schoolId || !userId) return null

  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId, deletedAt: null },
    select: {
      id: true,
      status: true,
      sectionId: true,
      resources: {
        orderBy: { order: "asc" },
        select: {
          schoolAssignment: {
            select: { id: true, title: true, dueDate: true, totalPoints: true },
          },
          quickAssessment: {
            select: { id: true, title: true, status: true },
          },
        },
      },
    },
  })
  if (!session) return null

  const assignments = session.resources.flatMap((r) =>
    r.schoolAssignment ? [r.schoolAssignment] : []
  )
  const quick = session.resources.flatMap((r) =>
    r.quickAssessment ? [r.quickAssessment] : []
  )
  const assignmentIds = assignments.map((a) => a.id)
  const quickIds = quick.map((q) => q.id)

  const pollRows = await db.conferenceEvent.findMany({
    where: { schoolId, sessionId, eventType: "poll_closed" },
    orderBy: { occurredAt: "asc" },
    select: { id: true, payload: true },
    take: 50,
  })
  const polls: ClassPoll[] = pollRows.flatMap((row) => {
    const p = row.payload as {
      question?: unknown
      options?: unknown
      counts?: unknown
      total?: unknown
    } | null
    if (!p || typeof p.question !== "string" || !Array.isArray(p.options))
      return []
    const options = p.options.map(String)
    const counts = Array.isArray(p.counts)
      ? p.counts.map((n) => Number(n) || 0)
      : options.map(() => 0)
    return [
      {
        id: row.id,
        question: p.question,
        options,
        counts,
        total: Number(p.total) || counts.reduce((a, b) => a + b, 0),
      },
    ]
  })

  let homework: HomeworkItem[] = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    dueDate: a.dueDate,
    totalPoints: Number(a.totalPoints),
  }))
  let quickChecks: QuickCheckItem[] = quick.map((q) => ({ ...q }))

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (student) {
      const [subs, responses] = await Promise.all([
        assignmentIds.length
          ? db.assignmentSubmission.findMany({
              where: {
                schoolId,
                studentId: student.id,
                assignmentId: { in: assignmentIds },
              },
              select: { assignmentId: true, status: true, score: true },
            })
          : [],
        quickIds.length
          ? db.quickAssessmentResponse.findMany({
              where: {
                schoolId,
                studentId: student.id,
                assessmentId: { in: quickIds },
              },
              select: { assessmentId: true, responses: true },
            })
          : [],
      ])
      const subBy = new Map(subs.map((s) => [s.assignmentId, s]))
      const resBy = new Map(responses.map((r) => [r.assessmentId, r]))
      homework = homework.map((h) => {
        const s = subBy.get(h.id)
        return {
          ...h,
          mine: s
            ? {
                status: s.status,
                score: s.score === null ? null : Number(s.score),
              }
            : null,
        }
      })
      quickChecks = quickChecks.map((q) => {
        const r = resBy.get(q.id)
        if (!r) return { ...q, mine: null }
        const marks = Array.isArray(r.responses)
          ? (r.responses as Array<{ isCorrect?: unknown }>)
          : []
        const keyed = marks.filter((m) => typeof m?.isCorrect === "boolean")
        return {
          ...q,
          mine: {
            correct: keyed.filter((m) => m.isCorrect === true).length,
            keyed: keyed.length,
          },
        }
      })
    }
  } else if (role !== "GUARDIAN") {
    const [subCounts, resCounts] = await Promise.all([
      assignmentIds.length
        ? db.assignmentSubmission.groupBy({
            by: ["assignmentId"],
            where: {
              schoolId,
              assignmentId: { in: assignmentIds },
              status: { in: HANDED_IN as never },
            },
            _count: { _all: true },
          })
        : [],
      quickIds.length
        ? db.quickAssessmentResponse.groupBy({
            by: ["assessmentId"],
            where: { schoolId, assessmentId: { in: quickIds } },
            _count: { _all: true },
          })
        : [],
    ])
    const subBy = new Map(subCounts.map((s) => [s.assignmentId, s._count._all]))
    const resBy = new Map(resCounts.map((r) => [r.assessmentId, r._count._all]))
    homework = homework.map((h) => ({ ...h, handedIn: subBy.get(h.id) ?? 0 }))
    quickChecks = quickChecks.map((q) => ({
      ...q,
      responses: resBy.get(q.id) ?? 0,
    }))
  }

  // The same host rule the room's actions use (`actions/resources.ts`): an
  // admin, or a teacher of this school. Only a class with a section has an
  // audience to set homework for.
  let canSetHomework = false
  if (
    HOST_ROLES.includes(role ?? "") &&
    session.sectionId &&
    (session.status === "live" || session.status === "ended")
  ) {
    canSetHomework =
      role !== "TEACHER" ||
      Boolean(
        await db.teacher.findFirst({
          where: { schoolId, userId },
          select: { id: true },
        })
      )
  }

  return {
    sessionId: session.id,
    isStudent: role === "STUDENT",
    homework,
    quickChecks,
    polls,
    canSetHomework,
  }
}
