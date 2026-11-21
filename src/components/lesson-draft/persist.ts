// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { db } from "@/lib/db"
import { prewarm } from "@/components/translation/prewarm"

import { LessonDraftError, type ValidDraft } from "./types"

/**
 * Writes a validated draft. ONE `db.$transaction`, and every write carries
 * `schoolId`: the questions, the quick check, the homework, the class links
 * and the provenance event all land together or not at all.
 *
 * Nothing here is visible to a student: the quick check and the homework are
 * DRAFT, and the new bank questions carry the `wizardStep: "ai-draft"`
 * sentinel that keeps them out of the shared question bank until the teacher
 * publishes the quick check (see README.md).
 */

/** Marks bank questions the teacher has not published yet. */
export const AI_DRAFT_STEP = "ai-draft"
/** The ConferenceEvent type: provenance + idempotency, no DDL. */
export const DRAFT_EVENT = "lesson_draft"

export interface PersistInput {
  actor: { userId: string; schoolId: string }
  scope: {
    gradeId: string
    sectionId: string | null
    subjectId: string
    termId: string | null
  }
  lesson: { id: string; name: string; chapterId: string }
  draft: ValidDraft
  model: string
  usage: { inputTokens: number; outputTokens: number; costUsd: number }
  /** The class — absent in the wizard's homework-only mode. */
  sessionId?: string
  /** A DRAFT homework row to fill in instead of creating one. */
  assignmentId?: string
  homeworkOnly: boolean
  /** The class's earlier drafts, deleted in the same transaction. */
  replaceOf?: { quickAssessmentId: string; assignmentId: string } | null
  requestId: string
  /** The school's IANA zone, for the homework's end-of-day due time. */
  timeZone: string
  now?: Date
}

export interface PersistResult {
  quickAssessmentId: string | null
  assignmentId: string
}

/** The offset of `zone` from UTC at `at`, in minutes. */
function zoneOffsetMinutes(at: Date, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at)
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0)
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  )
  return Math.round((asUtc - at.getTime()) / 60_000)
}

/** 23:59 on the day `days` from `now`, on the school's wall clock. */
export function schoolEndOfDay(now: Date, days: number, zone: string): Date {
  let tz = zone
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone })
  } catch {
    tz = "UTC"
  }
  const local = new Date(now.getTime() + zoneOffsetMinutes(now, tz) * 60_000)
  const wall = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + days,
    23,
    59,
    0
  )
  // First guess with the offset at `now`, then correct across a DST change
  const guess = new Date(wall - zoneOffsetMinutes(now, tz) * 60_000)
  return new Date(wall - zoneOffsetMinutes(guess, tz) * 60_000)
}

export async function persistDraft(input: PersistInput): Promise<PersistResult> {
  const { actor, scope, lesson, draft } = input
  const { schoolId, userId } = actor
  const now = input.now ?? new Date()
  const dueDate = schoolEndOfDay(now, draft.homework.dueInDays, input.timeZone)

  const written = await db.$transaction(async (tx) => {
    // ── Replace: the class's earlier drafts go, with their hidden questions
    if (input.replaceOf) {
      const old = await tx.quickAssessment.findFirst({
        where: {
          id: input.replaceOf.quickAssessmentId,
          schoolId,
          status: "DRAFT",
        },
        select: { id: true, questionIds: true },
      })
      await tx.conferenceResource.deleteMany({
        where: {
          schoolId,
          OR: [
            { quickAssessmentId: input.replaceOf.quickAssessmentId },
            { schoolAssignmentId: input.replaceOf.assignmentId },
          ],
        },
      })
      if (old) {
        await tx.quickAssessment.deleteMany({
          where: { id: old.id, schoolId, status: "DRAFT" },
        })
        await tx.questionBank.deleteMany({
          where: {
            schoolId,
            id: { in: old.questionIds },
            wizardStep: AI_DRAFT_STEP,
          },
        })
      }
      await tx.schoolAssignment.deleteMany({
        where: { id: input.replaceOf.assignmentId, schoolId, status: "DRAFT" },
      })
    }

    // ── (a) the questions, hidden from the shared bank until published
    const questionIds: string[] = []
    if (!input.homeworkOnly) {
      for (const q of draft.questions) {
        const row = await tx.questionBank.create({
          data: {
            schoolId,
            subjectId: scope.subjectId,
            questionText: q.text,
            questionType: q.type,
            difficulty: q.difficulty,
            bloomLevel: q.bloom,
            points: 1,
            options: q.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
            explanation: q.explanation,
            tags: ["ai-draft"],
            source: "AI",
            aiModel: input.model,
            generatedAt: now,
            catalogLessonId: lesson.id,
            catalogChapterId: lesson.chapterId,
            wizardStep: AI_DRAFT_STEP,
            createdBy: userId,
          },
          select: { id: true },
        })
        questionIds.push(row.id)
      }
    }

    // ── (b) the quick check
    let quickAssessmentId: string | null = null
    if (!input.homeworkOnly) {
      const quick = await tx.quickAssessment.create({
        data: {
          schoolId,
          gradeId: scope.gradeId,
          sectionId: scope.sectionId,
          termId: scope.termId,
          subjectId: scope.subjectId,
          title: lesson.name.slice(0, 200),
          type: "EXIT_TICKET",
          status: "DRAFT",
          lang: draft.lang,
          questionIds,
          duration: Math.min(10, Math.max(5, draft.questions.length)),
          isAnonymous: false,
          showResults: true,
          createdBy: userId,
        },
        select: { id: true },
      })
      quickAssessmentId = quick.id
    }

    // ── (c) the homework: fill the wizard's draft, or create one
    let assignmentId: string
    if (input.assignmentId) {
      const updated = await tx.schoolAssignment.updateMany({
        where: { id: input.assignmentId, schoolId, status: "DRAFT" },
        data: {
          title: draft.homework.title,
          instructions: draft.homework.instructions,
          totalPoints: draft.homework.points,
          dueDate,
          catalogLessonId: lesson.id,
        },
      })
      if (updated.count !== 1) throw new LessonDraftError("NOT_FOUND")
      assignmentId = input.assignmentId
    } else {
      const created = await tx.schoolAssignment.create({
        data: {
          schoolId,
          gradeId: scope.gradeId,
          sectionId: scope.sectionId,
          subjectId: scope.subjectId,
          termId: scope.termId,
          createdById: userId,
          title: draft.homework.title,
          instructions: draft.homework.instructions,
          type: "HOMEWORK",
          status: "DRAFT",
          wizardStep: null,
          totalPoints: draft.homework.points,
          // As setClassHomework sets it
          weight: 1,
          dueDate,
          catalogLessonId: lesson.id,
        },
        select: { id: true },
      })
      assignmentId = created.id
    }

    // ── (d) + (e) the class links and the provenance event
    if (input.sessionId && !input.homeworkOnly && quickAssessmentId) {
      const last = await tx.conferenceResource.findFirst({
        where: { schoolId, sessionId: input.sessionId },
        orderBy: { order: "desc" },
        select: { order: true },
      })
      const base = (last?.order ?? -1) + 1
      await tx.conferenceResource.create({
        data: {
          schoolId,
          sessionId: input.sessionId,
          quickAssessmentId,
          order: base,
        },
      })
      await tx.conferenceResource.create({
        data: {
          schoolId,
          sessionId: input.sessionId,
          schoolAssignmentId: assignmentId,
          order: base + 1,
        },
      })
      await tx.conferenceEvent.create({
        data: {
          schoolId,
          sessionId: input.sessionId,
          eventType: DRAFT_EVENT,
          actorUserId: userId,
          eventId: `ld:${input.sessionId}:${input.requestId}`,
          payload: {
            quickAssessmentId,
            assignmentId,
            questionIds,
            model: input.model,
            inputTokens: input.usage.inputTokens,
            outputTokens: input.usage.outputTokens,
            costUsd: input.usage.costUsd,
          },
        },
      })
    }

    return { quickAssessmentId, assignmentId }
  })

  // The quick check's title is content a reader may open in the other
  // language: warm that copy now, off the teacher's wait. Detached rather than
  // `after()` — this runs inside the SSE stream of /api/live/lesson-draft,
  // where a request scope is not guaranteed, and `after()` throws without one.
  // The server is long-lived, so the promise finishes; prewarm never rejects.
  if (written.quickAssessmentId) {
    void prewarm(
      "QuickAssessment",
      { title: lesson.name.slice(0, 200) },
      { schoolId }
    ).catch(() => {})
  }
  return written
}
