// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import type { UserRole } from "@prisma/client"
import { TrackSource } from "livekit-server-sdk"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { checkLiveClassPermission } from "@/components/school-dashboard/live/authorization"
import { isLiveKitConfigured } from "@/components/school-dashboard/live/livekit/client"
import {
  listParticipants,
  muteTrack,
} from "@/components/school-dashboard/live/livekit/rooms"

/**
 * Host microphone moderation, for a VERIFIED viewer: the web action
 * (`actions/moderation.ts`) passes the session's, the mobile route
 * (`/api/mobile/conference/[id]/mute`) the JWT's. A plain module — never
 * export these from a `"use server"` file.
 */
export interface ModerationViewer {
  userId: string
  schoolId: string
  role: UserRole
}

/**
 * The caller must be a HOST or CO_HOST of this tenant's session — the same
 * participant row the room's host trust is published from. Co-teachers
 * moderate too, as they run every other host tool.
 */
async function hostRoom(viewer: ModerationViewer, sessionId: string) {
  const ctx = viewer
  if (
    !checkLiveClassPermission(
      { userId: viewer.userId, role: viewer.role, schoolId: viewer.schoolId },
      "end_live_class"
    )
  )
    return {
      ok: false as const,
      response: actionError(ACTION_ERRORS.UNAUTHORIZED),
    }
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
export async function muteMicsFor(
  viewer: ModerationViewer,
  sessionId: string,
  only?: string
) {
  const host = await hostRoom(viewer, sessionId)
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

