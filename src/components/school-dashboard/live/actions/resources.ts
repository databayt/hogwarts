"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { notifyAssignmentPublished } from "@/components/school-dashboard/listings/assignments/notify"
import { prewarm } from "@/components/translation/prewarm"

import {
  suggestNextLessonFor,
  visibleLessons,
} from "@/components/lesson-draft/suggest"

import {
  loadDraftSuggest,
  mayShowDraftSuggest,
} from "../class-work-load"
import { verifyLessonAnchor } from "../queries"
import { requireContext } from "./helpers"
import { holdsHostSeat } from "./host-seat"

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
 * The caller acts host-side on THIS class: an admin, the class's own teacher,
 * or a co-host seated in it (`holdsHostSeat`). Not "any teacher of the
 * school" — that let a teacher publish homework to a class of a section they
 * do not teach.
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
      catalogLessonId: true,
      teacher: { select: { userId: true } },
      section: { select: { gradeId: true } },
    },
  })
  if (!session) {
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.NOT_FOUND),
    }
  }

  const seated = await holdsHostSeat({
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
    sessionId: session.id,
    sessionTeacherUserId: session.teacher?.userId,
  })
  if (!seated) {
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.UNAUTHORIZED),
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

/** What the Quiz tab's lesson-draft button needs (`SuggestDraftsButton`). */
export type RoomDraftSuggest = {
  lessons: { id: string; name: string }[]
  /** The lesson already saved on the class. */
  currentId: string | null
  /** The lesson the section should be taught next. */
  suggestedId: string | null
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

  const linked: RoomQuizItem[] = resources.flatMap((r): RoomQuizItem[] =>
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

  // The lesson-draft button. The gate is HERE, on the server, and the same one
  // the class page uses: flag on, a host role, a section and a subject. With
  // the flag off `mayShowDraftSuggest` answers before any query, and `suggest`
  // is `null`. (`hostSession` already refused anyone without a host seat.)
  let suggest: RoomDraftSuggest | null = null
  if (
    mayShowDraftSuggest(ctx.role, session) &&
    session.subjectId &&
    session.sectionId
  ) {
    const found = await loadDraftSuggest(ctx.schoolId, {
      subjectId: session.subjectId,
      sectionId: session.sectionId,
    })
    if (found) suggest = { ...found, currentId: session.catalogLessonId }
  }

  return {
    success: true as const,
    data: [
      ...linked,
      ...offered
        .filter((q) => !linkedIds.has(q.id))
        .map((q) => ({ ...q, kind: "quick" as const, linked: false })),
    ],
    suggest,
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

  // Tell the section — the class just ended, and homework nobody hears about
  // waits for the reminder the day before it is due.
  after(() => notifyAssignmentPublished(ctx.schoolId, assignment.id))

  refreshPage("/assignments")
  return { success: true as const, data: { id: assignment.id } }
}

/**
 * The class's lesson («درس اليوم»): one lesson of the class's own subject, or
 * null to clear it. Writes Conference.catalogLessonId — the lesson-draft
 * button and the class page's lesson links read it.
 */
export async function setClassLesson(
  sessionId: string,
  lessonId: string | null
) {
  if (lessonId !== null && (typeof lessonId !== "string" || !lessonId)) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const host = await hostSession(sessionId)
  if (!host.ok) return host.response
  const { ctx, session } = host

  if (lessonId !== null) {
    // The lesson must be visible to this school and belong to the class's subject
    if (
      !session.subjectId ||
      !(await verifyLessonAnchor(ctx.schoolId, lessonId, session.subjectId))
    ) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "lesson")
    }
  }

  await db.conference.updateMany({
    where: { id: session.id, schoolId: ctx.schoolId },
    data: { catalogLessonId: lessonId },
  })
  refreshPage("/live")
  return { success: true as const, data: { lessonId } }
}

/**
 * The lesson this class most likely teaches next: after the last class of
 * the same section and subject that had one, else the subject's first.
 * Never saved — the teacher confirms it in the picker.
 */
export async function suggestNextLesson(sessionId: string) {
  const host = await hostSession(sessionId)
  if (!host.ok) return host.response
  const { ctx, session } = host
  if (!session.sectionId || !session.subjectId) {
    return { success: true as const, data: { lessonId: null as string | null } }
  }
  const lessonId = await suggestNextLessonFor(ctx.schoolId, {
    sectionId: session.sectionId,
    subjectId: session.subjectId,
  })
  return { success: true as const, data: { lessonId } }
}

/** The picker's data: the subject's lessons, the saved one, the suggestion. */
export async function getClassLessons(sessionId: string) {
  const host = await hostSession(sessionId)
  if (!host.ok) return host.response
  const { ctx, session } = host
  if (!session.subjectId) {
    return {
      success: true as const,
      data: {
        lessons: [] as { id: string; name: string }[],
        currentId: null as string | null,
        suggestedId: null as string | null,
      },
    }
  }
  const [lessons, saved, suggestedId] = await Promise.all([
    visibleLessons(ctx.schoolId, session.subjectId),
    db.conference.findFirst({
      where: { id: session.id, schoolId: ctx.schoolId },
      select: { catalogLessonId: true },
    }),
    session.sectionId
      ? suggestNextLessonFor(ctx.schoolId, {
          sectionId: session.sectionId,
          subjectId: session.subjectId,
        })
      : null,
  ])
  return {
    success: true as const,
    data: { lessons, currentId: saved?.catalogLessonId ?? null, suggestedId },
  }
}
