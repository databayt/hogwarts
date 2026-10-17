"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { prewarm } from "@/components/translation/prewarm"

import { requireContext } from "./helpers"

/**
 * What the host works with from inside the room, after scheduling: the
 * quizzes linked to the class (to launch), the subject's other quick checks
 * (to link on the spot), and one-row attaches — homework set at the end of
 * class, a quick check picked mid-lesson.
 *
 * Attaching APPENDS one ConferenceResource row; it never replaces the set the
 * wizard wrote (the wizard, in turn, carries rows it has no picker for).
 */

/**
 * The room is host-side for the session's school: an admin, or a teacher of
 * this school — the same rule `recordClassEvent` uses, because co-teaching is
 * intentional and a co-host may run the room alone.
 */
async function hostSession(sessionId: string) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return { ok: false as const, response: ctx.response }

  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId: ctx.schoolId, deletedAt: null },
    select: {
      id: true,
      title: true,
      subjectId: true,
      sectionId: true,
      teacherId: true,
      section: { select: { gradeId: true } },
    },
  })
  if (!session) {
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.NOT_FOUND),
    }
  }

  if (ctx.role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { schoolId: ctx.schoolId, userId: ctx.userId },
      select: { id: true },
    })
    if (!teacher) {
      return {
        ok: false as const,
        response: actionError(ACTION_ERRORS.UNAUTHORIZED),
      }
    }
  }
  return { ok: true as const, ctx, session }
}

export type RoomQuizItem = {
  id: string
  title: string
  kind: "quick" | "exam"
  status: string
  /** Linked to this class (vs. offered from the subject's quick checks). */
  linked: boolean
}

export async function getRoomQuizzes(sessionId: string) {
  const host = await hostSession(sessionId)
  if (!host.ok) return host.response
  const { ctx, session } = host

  const resources = await db.conferenceResource.findMany({
    where: {
      schoolId: ctx.schoolId,
      sessionId,
      OR: [
        { quickAssessmentId: { not: null } },
        { schoolExamId: { not: null } },
      ],
    },
    orderBy: { order: "asc" },
    select: {
      quickAssessment: { select: { id: true, title: true, status: true } },
      schoolExam: { select: { id: true, title: true, status: true } },
    },
  })

  const linked: RoomQuizItem[] = resources.flatMap((r) =>
    r.quickAssessment
      ? [{ ...r.quickAssessment, kind: "quick" as const, linked: true }]
      : r.schoolExam
        ? [{ ...r.schoolExam, kind: "exam" as const, linked: true }]
        : []
  )
  const linkedIds = new Set(linked.map((q) => q.id))

  // The subject's other quick checks, for this class's audience (its section
  // or the whole grade) — what a teacher may link without leaving the room.
  const gradeId = session.section?.gradeId ?? null
  const offered = session.subjectId
    ? await db.quickAssessment.findMany({
        where: {
          schoolId: ctx.schoolId,
          subjectId: session.subjectId,
          status: { not: "CLOSED" },
          ...(session.sectionId
            ? {
                OR: [
                  { sectionId: session.sectionId },
                  { sectionId: null, gradeId },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, title: true, status: true },
      })
    : []

  return {
    success: true as const,
    data: [
      ...linked,
      ...offered
        .filter((q) => !linkedIds.has(q.id))
        .map((q) => ({ ...q, kind: "quick" as const, linked: false })),
    ],
  }
}

/** Append one reference to a class — idempotent on the same target. */
export async function attachLiveClassResource(input: {
  sessionId: string
  quickAssessmentId?: string
  schoolAssignmentId?: string
}) {
  const refs = [input.quickAssessmentId, input.schoolAssignmentId].filter(
    Boolean
  )
  if (refs.length !== 1) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const host = await hostSession(input.sessionId)
  if (!host.ok) return host.response
  const { ctx } = host

  // A foreign id is a refusal, never a silent skip
  const owned = input.quickAssessmentId
    ? await db.quickAssessment.count({
        where: { id: input.quickAssessmentId, schoolId: ctx.schoolId },
      })
    : await db.schoolAssignment.count({
        where: { id: input.schoolAssignmentId, schoolId: ctx.schoolId },
      })
  if (owned !== 1) return actionError(ACTION_ERRORS.NOT_FOUND)

  const where = {
    schoolId: ctx.schoolId,
    sessionId: input.sessionId,
    ...(input.quickAssessmentId
      ? { quickAssessmentId: input.quickAssessmentId }
      : { schoolAssignmentId: input.schoolAssignmentId }),
  }
  const existing = await db.conferenceResource.findFirst({
    where,
    select: { id: true },
  })
  if (existing) return { success: true as const, data: { id: existing.id } }

  const last = await db.conferenceResource.findFirst({
    where: { schoolId: ctx.schoolId, sessionId: input.sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  })
  const row = await db.conferenceResource.create({
    data: { ...where, order: (last?.order ?? -1) + 1 },
    select: { id: true },
  })
  return { success: true as const, data: { id: row.id } }
}

/**
 * Homework set as the class ends: an assignment filed under the class's own
 * subject and audience (its section, its grade, the active term) and
 * published straight away, then linked to the class so the class page and
 * the catch-up shelf show it. The teacher types only the work.
 */
export async function setClassHomework(input: {
  sessionId: string
  title: string
  instructions?: string
  /** ISO date-time. */
  dueDate: string
  totalPoints?: number
}) {
  const title = input.title?.trim().slice(0, 200)
  const due = new Date(input.dueDate)
  const points = input.totalPoints ?? 10
  if (
    !title ||
    Number.isNaN(due.getTime()) ||
    !Number.isFinite(points) ||
    points <= 0 ||
    points > 999
  ) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }

  const host = await hostSession(input.sessionId)
  if (!host.ok) return host.response
  const { ctx, session } = host

  // Without a grade it reaches no student — an ad-hoc class with no section
  // has no audience to give homework to.
  const gradeId = session.section?.gradeId ?? null
  if (!session.sectionId || !gradeId) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, "no_audience")
  }

  const { term } = await resolveActiveTerm(ctx.schoolId)
  const assignment = await db.schoolAssignment.create({
    data: {
      schoolId: ctx.schoolId,
      gradeId,
      sectionId: session.sectionId,
      subjectId: session.subjectId,
      termId: term?.id ?? null,
      createdById: ctx.userId,
      title,
      instructions: input.instructions?.trim().slice(0, 5000) || null,
      type: "HOMEWORK",
      status: "PUBLISHED",
      totalPoints: points,
      weight: 1,
      dueDate: due,
      publishDate: new Date(),
    },
    select: { id: true },
  })
  const instructions = input.instructions?.trim().slice(0, 5000) || null
  after(() =>
    prewarm(
      "Assignment",
      { id: assignment.id, title, instructions },
      { schoolId: ctx.schoolId }
    )
  )

  const last = await db.conferenceResource.findFirst({
    where: { schoolId: ctx.schoolId, sessionId: session.id },
    orderBy: { order: "desc" },
    select: { order: true },
  })
  await db.conferenceResource.create({
    data: {
      schoolId: ctx.schoolId,
      sessionId: session.id,
      schoolAssignmentId: assignment.id,
      order: (last?.order ?? -1) + 1,
    },
  })

  refreshPage("/assignments")
  return { success: true as const, data: { id: assignment.id } }
}
