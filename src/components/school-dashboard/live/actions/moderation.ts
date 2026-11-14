"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Host moderation — remove a participant from a live conference. Wraps the
// LiveKit `removeParticipant` room-service call with auth + tenant scoping.
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { isLiveKitConfigured } from "@/components/school-dashboard/live/livekit/client"
import { removeParticipant } from "@/components/school-dashboard/live/livekit/rooms"
import { muteMicsFor } from "@/components/school-dashboard/live/moderation-core"

import { requireContext } from "./helpers"

/**
 * Remove (kick) a participant from a live conference. The session is resolved
 * scoped by `schoolId` so a host can never kick from another tenant's room.
 * Marks the participant row `removed`. No-op providers (external links) have
 * no SFU room → returns NOT_IMPLEMENTED.
 *
 * Who may remove: an ADMIN or DEVELOPER, or anyone holding a HOST / CO_HOST
 * seat in THIS session — the rule mute already uses. It used to be "the
 * session's own teacher" for a TEACHER, so a co-teacher (and a substitute
 * hosting the class) was shown Remove and then refused.
 *
 * Who may be removed: students and observers. A host or co-host seat can only
 * be removed by an ADMIN / DEVELOPER — a co-teacher must not be able to put
 * the class's teacher out of their own room.
 */
export async function kickParticipant(sessionId: string, userId: string) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return ctx.response
  if (!isLiveKitConfigured()) return actionError(ACTION_ERRORS.NOT_IMPLEMENTED)

  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId: ctx.schoolId, deletedAt: null },
    select: { roomName: true },
  })
  if (!session) return actionError(ACTION_ERRORS.NOT_FOUND)

  const isAdmin = ctx.role === "ADMIN" || ctx.role === "DEVELOPER"
  if (!isAdmin) {
    const seat = await db.conferenceParticipant.findFirst({
      where: {
        sessionId,
        schoolId: ctx.schoolId,
        userId: ctx.userId,
        role: { in: ["HOST", "CO_HOST"] },
      },
      select: { id: true },
    })
    if (!seat) return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  // Only kick an actual enrolled participant of THIS session/school — never
  // forward an arbitrary identity string straight to the SFU eviction call.
  const participant = await db.conferenceParticipant.findFirst({
    where: { sessionId, userId, schoolId: ctx.schoolId },
    select: { id: true, role: true },
  })
  if (!participant) return actionError(ACTION_ERRORS.NOT_FOUND)
  if (
    !isAdmin &&
    (participant.role === "HOST" || participant.role === "CO_HOST")
  ) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  // DB first, SFU second. The `removed` row is what blocks a rejoin (join +
  // token refresh both check it), so if the pair can only half-complete the
  // safe half is the DB: a failed eviction leaves them in the room for at
  // most the token TTL, whereas the old order (SFU first) could evict them
  // yet leave the row active — free to rejoin, moderation defeated.
  try {
    await db.conferenceParticipant.updateMany({
      where: { sessionId, userId, schoolId: ctx.schoolId },
      data: { status: "removed", leftAt: new Date() },
    })
    await removeParticipant(session.roomName, userId)
  } catch (err) {
    console.error("[kickParticipant]", err)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }

  return { success: true as const, data: { userId } }
}

/** Mute `only`'s microphone, or every student's when omitted. */
async function muteMics(sessionId: string, only?: string) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return ctx.response
  return muteMicsFor(
    { userId: ctx.userId, schoolId: ctx.schoolId, role: ctx.role },
    sessionId,
    only
  )
}

/** Host: mute every student's microphone. They may unmute themselves. */
export async function muteAll(sessionId: string) {
  return muteMics(sessionId)
}

/** Host: mute one participant's microphone. */
export async function muteParticipant(sessionId: string, identity: string) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(identity))
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  return muteMics(sessionId, identity)
}
