// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cover («تغطية الحصة») — the server core. A class nobody came to teach can be
// taken over by a school admin or a supervisor of its stage: they open the
// room as its host, for that class only.
//
// NOT a "use server" module (it takes the identity it acts for). The thin
// wrapper in ./actions/cover.ts builds the actor from the session; the cover
// page calls `loadCover` directly.
import "server-only"

import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { DEFAULT_SCHOOL_TZ } from "./day-window"
import type { LiveStage } from "./stage"
import {
  GRADE_STAGE_SELECT,
  stageOfGradeRow,
  supervisedStages,
} from "./supervisors-core"
import { coverState, mayCoverSession } from "./supervisors"

export type CoverActor = { userId: string; role: UserRole; schoolId: string }

export type CoverView = {
  id: string
  title: string
  subjectName: string | null
  sectionName: string | null
  stage: LiveStage | null
  scheduledStart: Date
  scheduledEnd: Date
  timeZone: string
  provider: "livekit" | "external"
  meetingUrl: string | null
  status: string
  /** Students in the room right now. */
  waiting: number
  state: "ok" | "mine" | "taken" | "over"
  coveredByUserId: string | null
}

export type CoverLoad =
  | { ok: true; view: CoverView }
  | { ok: false; reason: "not_found" | "forbidden" }

/**
 * The class, how many students wait in it, and whether THIS actor may cover it.
 * "forbidden" and "not_found" are told apart only to a caller who is allowed to
 * know the class exists: a stranger gets "forbidden" for both.
 */
export async function loadCover(
  actor: CoverActor,
  sessionId: string
): Promise<CoverLoad> {
  const [session, stages] = await Promise.all([
    db.conference.findFirst({
      where: {
        id: sessionId,
        schoolId: actor.schoolId,
        deletedAt: null,
        isPractice: false,
      },
      select: {
        id: true,
        title: true,
        status: true,
        provider: true,
        meetingUrl: true,
        scheduledStart: true,
        scheduledEnd: true,
        coveredByUserId: true,
        subject: { select: { name: true } },
        section: {
          select: {
            name: true,
            grade: { select: GRADE_STAGE_SELECT },
            homeroomTeacher: { select: { userId: true } },
          },
        },
        school: { select: { timezone: true } },
      },
    }),
    actor.role === "ADMIN" || actor.role === "DEVELOPER"
      ? Promise.resolve([] as string[])
      : supervisedStages(actor.schoolId, actor.userId),
  ])
  if (!session) return { ok: false, reason: "forbidden" }

  const stage = stageOfGradeRow(session.section?.grade)
  if (
    !mayCoverSession({
      role: actor.role,
      stage,
      supervisedStages: stages,
      isClassSupervisor: session.section?.homeroomTeacher?.userId === actor.userId,
    })
  ) {
    return { ok: false, reason: "forbidden" }
  }

  const waiting = await db.conferenceParticipant.count({
    where: {
      sessionId: session.id,
      schoolId: actor.schoolId,
      role: "PARTICIPANT",
      activeSince: { not: null },
    },
  })

  return {
    ok: true,
    view: {
      id: session.id,
      title: session.title,
      subjectName: session.subject?.name ?? null,
      sectionName: session.section?.name ?? null,
      stage,
      scheduledStart: session.scheduledStart,
      scheduledEnd: session.scheduledEnd,
      timeZone: session.school.timezone || DEFAULT_SCHOOL_TZ,
      provider: session.provider === "external" ? "external" : "livekit",
      meetingUrl: session.meetingUrl,
      status: session.status,
      waiting,
      state: coverState({
        status: session.status,
        coveredByUserId: session.coveredByUserId,
        userId: actor.userId,
        scheduledEnd: session.scheduledEnd,
        now: new Date(),
      }),
      coveredByUserId: session.coveredByUserId,
    },
  }
}

export type CoverResult =
  | { success: true; data: { sessionId: string; external: string | null } }
  | ReturnType<typeof actionError>

/**
 * Take the class over. Authorised through `loadCover`; the write is guarded on
 * `coveredByUserId: null`, so two supervisors tapping at once cannot overwrite
 * each other — the loser is told it is taken. A second tap by the same person
 * simply walks back in.
 */
export async function coverSession(
  actor: CoverActor,
  sessionId: string
): Promise<CoverResult> {
  const loaded = await loadCover(actor, sessionId)
  if (!loaded.ok) return actionError(ACTION_ERRORS.UNAUTHORIZED)
  const { view } = loaded
  if (view.state === "over" || view.state === "taken") {
    return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
  }
  if (view.state === "ok") {
    const { count } = await db.conference.updateMany({
      where: {
        id: sessionId,
        schoolId: actor.schoolId,
        coveredByUserId: null,
        status: { in: ["scheduled", "live"] },
      },
      data: { coveredByUserId: actor.userId, coveredAt: new Date() },
    })
    if (count === 0) {
      // Lost the race — or the class ended. Whoever won, it is no longer ours.
      const now = await db.conference.findFirst({
        where: { id: sessionId, schoolId: actor.schoolId },
        select: { coveredByUserId: true },
      })
      if (now?.coveredByUserId !== actor.userId) {
        return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
      }
    }
  }
  return {
    success: true,
    data: {
      sessionId,
      external: view.provider === "external" ? view.meetingUrl : null,
    },
  }
}
