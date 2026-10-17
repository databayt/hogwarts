"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Host moderation — remove a participant from a live conference. Wraps the
// LiveKit `removeParticipant` room-service call with auth + tenant scoping.
import { TrackSource } from "livekit-server-sdk"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { isLiveKitConfigured } from "@/components/school-dashboard/live/livekit/client"
import {
  listParticipants,
  muteTrack,
  removeParticipant,
} from "@/components/school-dashboard/live/livekit/rooms"

import { requireContext } from "./helpers"

/**
 * Remove (kick) a participant from a live conference. HOST roles only
 * (DEVELOPER/ADMIN/TEACHER via `end_live_class`). The session is resolved
 * scoped by `schoolId` so a host can never kick from another tenant's room.
 * Marks the participant row `removed`. No-op providers (external links) have
 * no SFU room → returns NOT_IMPLEMENTED.
 */
export async function kickParticipant(sessionId: string, userId: string) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return ctx.response
  if (!isLiveKitConfigured()) return actionError(ACTION_ERRORS.NOT_IMPLEMENTED)

  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId: ctx.schoolId, deletedAt: null },
    select: { roomName: true, teacherId: true },
  })
  if (!session) return actionError(ACTION_ERRORS.NOT_FOUND)

  // A TEACHER may only moderate their own session; ADMIN/DEVELOPER any.
  if (ctx.role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { schoolId: ctx.schoolId, userId: ctx.userId },
      select: { id: true },
    })
    if (!teacher || teacher.id !== session.teacherId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
  }

  // Only kick an actual enrolled participant of THIS session/school — never
  // forward an arbitrary identity string straight to the SFU eviction call.
  const participant = await db.conferenceParticipant.findFirst({
    where: { sessionId, userId, schoolId: ctx.schoolId },
    select: { id: true },
  })
  if (!participant) return actionError(ACTION_ERRORS.NOT_FOUND)

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

/**
 * The caller must be a HOST or CO_HOST of this tenant's session — the same
 * participant row the room's host trust is published from. Co-teachers
 * moderate too, as they run every other host tool.
 */
async function hostRoom(sessionId: string) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return { ok: false as const, response: ctx.response }
  if (!isLiveKitConfigured())
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.NOT_IMPLEMENTED),
    }
  const [session, hosts] = await Promise.all([
    db.conference.findFirst({
      where: { id: sessionId, schoolId: ctx.schoolId, deletedAt: null },
      select: { roomName: true },
    }),
    db.conferenceParticipant.findMany({
      where: {
        sessionId,
        schoolId: ctx.schoolId,
        role: { in: ["HOST", "CO_HOST"] },
      },
      select: { userId: true },
    }),
  ])
  const hostIds = new Set(hosts.map((h) => h.userId))
  if (!session)
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.NOT_FOUND),
    }
  if (!hostIds.has(ctx.userId))
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.UNAUTHORIZED),
    }
  return {
    ok: true as const,
    roomName: session.roomName,
    userId: ctx.userId,
    hostIds,
  }
}

/** Mute `only`'s microphone, or every student's when omitted. */
async function muteMics(sessionId: string, only?: string) {
  const host = await hostRoom(sessionId)
  if (!host.ok) return host.response
  // Never mute a teacher — judged from the DB, not from participant
  // attributes, which a student's own client can rewrite.
  try {
    const people = await listParticipants(host.roomName)
    let muted = 0
    for (const p of people) {
      if (host.hostIds.has(p.identity)) continue
      if (only && p.identity !== only) continue
      for (const t of p.tracks) {
        if (t.source === TrackSource.MICROPHONE && !t.muted) {
          await muteTrack(host.roomName, p.identity, t.sid)
          muted++
        }
      }
    }
    return { success: true as const, data: { muted } }
  } catch (err) {
    console.error("[muteMics]", err)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
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
