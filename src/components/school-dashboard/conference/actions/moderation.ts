"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Host moderation — remove a participant from a live conference. Wraps the
// LiveKit `removeParticipant` room-service call with auth + tenant scoping.
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { isLiveKitConfigured } from "@/components/school-dashboard/conference/livekit/client"
import { removeParticipant } from "@/components/school-dashboard/conference/livekit/rooms"

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
    where: { id: sessionId, schoolId: ctx.schoolId },
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

  try {
    await removeParticipant(session.roomName, userId)
    await db.conferenceParticipant.updateMany({
      where: { sessionId, userId },
      data: { status: "removed", leftAt: new Date() },
    })
  } catch {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }

  return { success: true as const, data: { userId } }
}
