// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The ONE place a live class row is created. Plain `server-only` module (not a
// "use server" file): `createLiveClass` (sessions.ts) and the make-up core
// (../makeup-core.ts) both call it, so the checks, the notifications and the
// revalidation cannot drift between the two doors.
//
// It takes the already-resolved tenant context, never an identity from input.
//
// A make-up class (`makeupForId`) is created inside the make-up core's
// transaction (`tx`) so two taps cannot both pass. In that mode this function
// registers NO side effect — an `after()` registered before the commit would
// announce a class that a rollback then erases. The caller runs
// `afterLiveClassCreated` once the transaction has committed, and errors are
// re-thrown (not swallowed into an actionError) so the transaction rolls back.
import "server-only"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { isLiveKitConfigured } from "@/components/school-dashboard/live/livekit/client"
import { roomNameFor } from "@/components/school-dashboard/live/livekit/room-naming"
import {
  liveClassScheduleSchema,
  type LiveClassServerInput,
} from "@/components/school-dashboard/live/validation"
import { prewarm } from "@/components/translation/prewarm"

import { liveListRevalidatePaths } from "./helpers"
import { notifyClassScheduled } from "./notifications"

export type CreateLiveClassCtx = { schoolId: string }

export type CreateLiveClassOptions = {
  /** The ROOT missed class this one makes up. */
  makeupForId?: string | null
  /** An external meeting provider (copied from the missed class). */
  provider?: "livekit" | "external"
  meetingUrl?: string | null
  meetingProvider?: string | null
  /**
   * Run every read and write on this transaction client. The caller then owns
   * the side effects: call `afterLiveClassCreated` after the commit.
   */
  tx?: Prisma.TransactionClient
}

type CreatedSession = Awaited<ReturnType<typeof db.conference.create>>

export type CreateLiveClassResult =
  | ReturnType<typeof actionError>
  | { success: true; data: CreatedSession }

/** The best-effort fan-out + cache invalidation of a freshly created class. */
export function afterLiveClassCreated(
  schoolId: string,
  session: CreatedSession
) {
  // Best-effort fan-out — failures here must not roll back the create.
  // A make-up has its own notice (`notifyMakeup`, sent by makeup-core with the
  // actor left out) — saying "scheduled" as well would tell everyone twice.
  if (!session.makeupForId) {
    after(() => notifyClassScheduled(schoolId, session.id))
  }

  after(() => prewarm("Conference", session, { schoolId }))
  for (const path of liveListRevalidatePaths()) {
    revalidatePath(path, "page")
  }
}

export async function createLiveClassCore(
  ctx: CreateLiveClassCtx,
  input: LiveClassServerInput,
  opts: CreateLiveClassOptions = {}
): Promise<CreateLiveClassResult> {
  const parsed = liveClassScheduleSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data
  const client = opts.tx ?? db
  const external = opts.provider === "external"

  // This form has no meeting-URL field, so every row it writes takes the
  // schema's `provider = livekit`. Without an SFU that row looks scheduled and
  // only fails when the teacher presses Start — refuse at create time, as the
  // wizard does (list-actions.ts), and point the school at a link instead.
  // A make-up of an external class is itself external: it needs no SFU.
  if (!external && !isLiveKitConfigured()) {
    return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
  }

  try {
    // School config + (optional) the section's recording opt-out, in parallel.
    const [school, section] = await Promise.all([
      client.school.findUnique({
        where: { id: ctx.schoolId },
        select: {
          conferenceMaxDuration: true,
          conferenceRecordingDefault: true,
          preferredLanguage: true,
        },
      }),
      data.sectionId
        ? client.section.findFirst({
            where: { id: data.sectionId, schoolId: ctx.schoolId },
            select: { conferenceRecordingOptOut: true },
          })
        : Promise.resolve(null),
    ])
    if (!school) return actionError(ACTION_ERRORS.SCHOOL_NOT_FOUND)
    const sectionOptOut = section?.conferenceRecordingOptOut ?? false

    const durationMin =
      (new Date(data.scheduledEnd).getTime() -
        new Date(data.scheduledStart).getTime()) /
      60_000
    if (durationMin > school.conferenceMaxDuration) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_MAX_DURATION_EXCEEDED)
    }

    // Verify the teacher belongs to this school.
    const teacher = await client.teacher.findFirst({
      where: { id: data.teacherId, schoolId: ctx.schoolId },
      select: { id: true, userId: true },
    })
    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    // Two-step create so we can write the final roomName containing the cuid.
    const placeholder = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const created = await client.conference.create({
      data: {
        schoolId: ctx.schoolId,
        teacherId: teacher.id,
        timetableId: data.timetableId ?? null,
        sectionId: data.sectionId ?? null,
        subjectId: data.subjectId ?? null,
        title: data.title,
        description: data.description ?? null,
        lang: data.lang,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        recordingEnabled:
          (data.recordingEnabled ?? school.conferenceRecordingDefault) &&
          !sectionOptOut,
        maxParticipants: data.maxParticipants ?? 50,
        visibility: data.visibility ?? "section",
        catalogLessonId: data.catalogLessonId ?? null,
        roomName: placeholder,
        ...(opts.makeupForId ? { makeupForId: opts.makeupForId } : {}),
        ...(external
          ? {
              provider: "external" as const,
              meetingUrl: opts.meetingUrl ?? null,
              meetingProvider: opts.meetingProvider ?? null,
            }
          : {}),
      },
    })
    const finalRoomName = roomNameFor(ctx.schoolId, created.id)
    const session = await client.conference.update({
      where: { id: created.id },
      data: { roomName: finalRoomName },
    })

    // Auto-invite the teacher as HOST. Students/observers are resolved
    // lazily on join via the section roster, so we don't pre-fan-out.
    if (teacher.userId) {
      await client.conferenceParticipant.upsert({
        where: {
          sessionId_userId: { sessionId: session.id, userId: teacher.userId },
        },
        create: {
          schoolId: ctx.schoolId,
          sessionId: session.id,
          userId: teacher.userId,
          role: "HOST",
        },
        update: { role: "HOST" },
      })
    }

    // Inside a caller's transaction the side effects wait for the commit.
    if (!opts.tx) afterLiveClassCreated(ctx.schoolId, session)
    return { success: true as const, data: session }
  } catch (err) {
    // In a transaction the failure must reach the caller so it rolls back.
    if (opts.tx) throw err
    return actionError(ACTION_ERRORS.LIVE_CLASS_CREATE_FAILED)
  }
}
