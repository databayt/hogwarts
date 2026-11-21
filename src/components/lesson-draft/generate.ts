// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { randomUUID } from "node:crypto"

import { db } from "@/lib/db"
import { holdsHostSeat } from "@/components/school-dashboard/live/actions/host-seat"
import {
  lessonVisibilityFilter,
  verifyLessonAnchor,
} from "@/components/school-dashboard/live/queries"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"

import {
  CLAUDE_MODEL,
  DraftCallError,
  lessonDraftEnabled,
  requestDraft,
} from "./claude"
import { getLessonText } from "./lesson-text"
import { DRAFT_EVENT, persistDraft } from "./persist"
import { systemPrompt, userPrompt } from "./prompt"
import { estimateDraftCost, jobIdFor, reserve, settle } from "./spend"
import {
  DRAFT_AUTHOR_ROLES,
  LessonDraftError,
  type DraftActor,
  type DraftInput,
  type DraftResult,
  type DraftStage,
} from "./types"

export const TOPIC_MIN = 40
export const TOPIC_MAX = 500

/** The class's latest drafts that are both still DRAFT, if any. */
async function findExistingDrafts(schoolId: string, sessionId: string) {
  const events = await db.conferenceEvent.findMany({
    where: { schoolId, sessionId, eventType: DRAFT_EVENT },
    orderBy: { occurredAt: "desc" },
    take: 5,
    select: { payload: true },
  })
  for (const e of events) {
    const p = e.payload as {
      quickAssessmentId?: unknown
      assignmentId?: unknown
    } | null
    if (
      !p ||
      typeof p.quickAssessmentId !== "string" ||
      typeof p.assignmentId !== "string"
    )
      continue
    const [quick, homework] = await Promise.all([
      db.quickAssessment.findFirst({
        where: { id: p.quickAssessmentId, schoolId, status: "DRAFT" },
        select: { id: true },
      }),
      db.schoolAssignment.findFirst({
        where: { id: p.assignmentId, schoolId, status: "DRAFT" },
        select: { id: true },
      }),
    ])
    if (quick && homework)
      return { quickAssessmentId: quick.id, assignmentId: homework.id }
  }
  return null
}

/**
 * A draft quick check and a draft homework, on a teacher's request — never
 * automatic, never published here. Order: gates → scope + lesson text →
 * idempotency → reserve spend → Claude → validate → persist → settle.
 * Throws a `LessonDraftError` whose `code` is the contract with the UI.
 */
export async function generateLessonDrafts(
  actor: DraftActor,
  input: DraftInput,
  onStage?: (s: DraftStage) => void
): Promise<DraftResult> {
  // ── Gates
  if (!lessonDraftEnabled()) throw new LessonDraftError("LESSON_DRAFT_DISABLED")
  if (!actor.userId) throw new LessonDraftError("NOT_AUTHENTICATED")
  if (!actor.schoolId) throw new LessonDraftError("MISSING_SCHOOL")
  if (!DRAFT_AUTHOR_ROLES.includes(actor.role))
    throw new LessonDraftError("UNAUTHORIZED")

  const { schoolId } = actor
  const homeworkOnly = Boolean(
    input.homeworkOnly || (input.assignmentId && !input.sessionId)
  )
  if (!input.sessionId && !input.assignmentId)
    throw new LessonDraftError("VALIDATION_ERROR")

  // ── Scope: the class, or the wizard's draft homework
  let gradeId: string | null
  let sectionId: string | null
  let subjectId: string | null
  let lessonId = input.lessonId ?? null
  let classLang: "ar" | "en" = "ar"

  if (input.sessionId) {
    const session = await db.conference.findFirst({
      where: { id: input.sessionId, schoolId, deletedAt: null },
      select: {
        id: true,
        subjectId: true,
        sectionId: true,
        catalogLessonId: true,
        lang: true,
        teacher: { select: { userId: true } },
        section: { select: { gradeId: true } },
      },
    })
    if (!session) throw new LessonDraftError("NOT_FOUND")
    const seated = await holdsHostSeat({
      schoolId,
      userId: actor.userId,
      role: actor.role,
      sessionId: session.id,
      sessionTeacherUserId: session.teacher?.userId,
    })
    if (!seated) throw new LessonDraftError("UNAUTHORIZED")
    gradeId = session.section?.gradeId ?? null
    sectionId = session.sectionId
    subjectId = session.subjectId
    lessonId ??= session.catalogLessonId
    classLang = session.lang === "en" ? "en" : "ar"
  } else {
    const row = await db.schoolAssignment.findFirst({
      where: { id: input.assignmentId, schoolId, status: "DRAFT" },
      select: {
        createdById: true,
        gradeId: true,
        sectionId: true,
        subjectId: true,
      },
    })
    if (!row) throw new LessonDraftError("NOT_FOUND")
    const isAdmin = actor.role === "ADMIN" || actor.role === "DEVELOPER"
    if (!isAdmin && row.createdById !== actor.userId)
      throw new LessonDraftError("UNAUTHORIZED")
    gradeId = row.gradeId
    sectionId = row.sectionId
    subjectId = row.subjectId
  }
  if (!gradeId || !subjectId || (input.sessionId && !sectionId))
    throw new LessonDraftError("VALIDATION_ERROR")
  if (!lessonId) throw new LessonDraftError("LESSON_DRAFT_NO_LESSON")

  // The scope validated the way createQuickAssessment does
  const resolved = await resolveTeachingScope(schoolId, {
    gradeId,
    sectionId,
    subjectId,
  })
  if (!resolved.ok) throw new LessonDraftError("VALIDATION_ERROR")
  const scope = resolved.scope

  if (!(await verifyLessonAnchor(schoolId, lessonId, subjectId)))
    throw new LessonDraftError("LESSON_DRAFT_NO_LESSON")

  // ── The lesson's text, or the teacher's topic
  onStage?.("reading")
  const lessonText = await getLessonText(schoolId, lessonId)
  if (lessonText.status === "not_found")
    throw new LessonDraftError("LESSON_DRAFT_NO_LESSON")

  const topic = input.topic?.trim() ?? ""
  if (lessonText.status !== "ok") {
    if (topic.length < TOPIC_MIN || topic.length > TOPIC_MAX)
      throw new LessonDraftError("LESSON_DRAFT_NO_TEXT")
  }

  // ── Idempotency: a second tap returns the drafts already there
  let replaceOf: { quickAssessmentId: string; assignmentId: string } | null =
    null
  if (input.sessionId && !homeworkOnly) {
    const existing = await findExistingDrafts(schoolId, input.sessionId)
    if (existing) {
      if (!input.replace) return { ...existing, existing: true }
      replaceOf = existing
    }
  }

  // ── Context for the prompt
  const [subject, grade, school, lesson] = await Promise.all([
    db.subject.findFirst({ where: { id: subjectId }, select: { name: true } }),
    db.academicGrade.findFirst({
      where: { id: gradeId, schoolId },
      select: { name: true },
    }),
    db.school.findFirst({
      where: { id: schoolId },
      select: { timezone: true },
    }),
    db.lesson.findFirst({
      where: { id: lessonId, ...lessonVisibilityFilter(schoolId) },
      select: { id: true, name: true, chapterId: true },
    }),
  ])
  if (!lesson) throw new LessonDraftError("LESSON_DRAFT_NO_LESSON")

  const lang = lessonText.status === "ok" ? lessonText.lang : classLang
  const system = systemPrompt()
  const user = userPrompt({
    lang,
    gradeLabel: grade?.name ?? "",
    subjectName: subject?.name ?? "",
    chapterName: lessonText.chapterName ?? "",
    lessonName: lesson.name,
    text: lessonText.status === "ok" ? lessonText.text : null,
    topic: lessonText.status === "ok" ? null : topic,
    homeworkOnly,
  })

  // ── Spend: hold, call, always settle
  const reservation = await reserve(
    actor.userId,
    estimateDraftCost(system.length + user.length)
  )
  if (!reservation.ok)
    throw new LessonDraftError(
      reservation.reason === "cap"
        ? "LESSON_DRAFT_CAP"
        : "LESSON_DRAFT_TEACHER_LIMIT"
    )

  const jobId = jobIdFor(schoolId, {
    sessionId: input.sessionId,
    assignmentId: input.assignmentId,
  })
  let spent: Parameters<typeof settle>[2] = null
  try {
    onStage?.("writing")
    let result: Awaited<ReturnType<typeof requestDraft>>
    try {
      result = await requestDraft({
        system,
        user,
        lang,
        homeworkOnly,
        userKey: actor.userId,
      })
    } catch (error) {
      if (error instanceof DraftCallError) {
        // A call was attempted: it counts toward the day, whatever it cost
        spent = {
          costUsd: error.usage.costUsd,
          model: CLAUDE_MODEL,
          inputTokens: error.usage.inputTokens,
          outputTokens: error.usage.outputTokens,
          jobId,
        }
      }
      throw error
    }
    spent = {
      costUsd: result.usage.costUsd,
      model: CLAUDE_MODEL,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      jobId,
    }

    onStage?.("saving")
    const saved = await persistDraft({
      actor: { userId: actor.userId, schoolId },
      scope,
      lesson: { id: lesson.id, name: lesson.name, chapterId: lesson.chapterId },
      draft: result.draft,
      model: CLAUDE_MODEL,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        costUsd: result.usage.costUsd,
      },
      sessionId: input.sessionId,
      assignmentId: input.assignmentId,
      homeworkOnly,
      replaceOf,
      requestId: randomUUID(),
      timeZone: school?.timezone ?? "Africa/Khartoum",
    })
    return saved
  } finally {
    await settle(actor.userId, reservation.estimate, spent)
  }
}
