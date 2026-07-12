"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type {
  ConferenceParticipantRole,
  ConferenceVisibility,
  UserRole,
} from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLiveKitConfig } from "@/components/school-dashboard/conference/livekit/client"
import { ensureRoom } from "@/components/school-dashboard/conference/livekit/rooms"
import { issueAccessToken } from "@/components/school-dashboard/conference/livekit/token"
import type { RoomJoinTicket } from "@/components/school-dashboard/conference/types"

import { concurrentCapError } from "./helpers"

/**
 * Decide a user's role within a given session based on their UserRole and
 * relationship to the section, honoring the session's visibility tier.
 * Returns `null` if the user is not eligible.
 *
 * - `section` (default): section roster joins as PARTICIPANT, their guardians
 *   as OBSERVER; no section → host-only (a private meeting).
 * - `school`: any member of THIS school — students PARTICIPANT, guardians
 *   OBSERVER, staff/accountant PARTICIPANT. Never anyone outside the school:
 *   schoolId comes from the tenant context and every lookup is scoped by it.
 */
async function resolveParticipantRole(
  userId: string,
  userRole: UserRole,
  schoolId: string,
  sessionId: string,
  sessionTeacherUserId: string | null,
  sessionSectionId: string | null,
  sessionVisibility: ConferenceVisibility = "section"
): Promise<ConferenceParticipantRole | null> {
  if (userRole === "DEVELOPER") return "HOST"
  if (userRole === "ADMIN") return "CO_HOST"
  if (userRole === "TEACHER") {
    return sessionTeacherUserId === userId ? "HOST" : "CO_HOST"
  }
  if (sessionVisibility === "school") {
    if (userRole === "STUDENT") {
      const student = await db.student.findFirst({
        where: { schoolId, userId },
        select: { id: true },
      })
      return student ? "PARTICIPANT" : null
    }
    if (userRole === "GUARDIAN") {
      const guardian = await db.guardian.findFirst({
        where: { schoolId, userId },
        select: { id: true },
      })
      return guardian ? "OBSERVER" : null
    }
    if (userRole === "STAFF" || userRole === "ACCOUNTANT") {
      return "PARTICIPANT"
    }
    return null
  }
  if (!sessionSectionId) return null // No section → only host can join
  if (userRole === "STUDENT") {
    const student = await db.student.findFirst({
      where: { schoolId, userId, sectionId: sessionSectionId },
      select: { id: true },
    })
    return student ? "PARTICIPANT" : null
  }
  if (userRole === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: {
        schoolId,
        userId,
        studentGuardians: {
          some: { student: { sectionId: sessionSectionId } },
        },
      },
      select: { id: true },
    })
    return guardian ? "OBSERVER" : null
  }
  return null
}

/**
 * Request a join token for a live class. Validates auth + tenant +
 * eligibility, ensures the SFU room exists, and returns a short-lived JWT
 * the client uses to connect.
 */
export async function joinLiveClass(
  sessionId: string
): Promise<
  { success: true; data: RoomJoinTicket } | ReturnType<typeof actionError>
> {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role as UserRole | undefined
  if (!userId || !role) {
    return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

  // Fetch the session, the joining user (display name), and any existing
  // participant row concurrently — all keyed only by ids known here.
  const [liveClass, userRow, existingParticipant] = await Promise.all([
    db.conference.findFirst({
      where: { id: sessionId, schoolId, deletedAt: null },
      select: {
        id: true,
        roomName: true,
        sectionId: true,
        visibility: true,
        maxParticipants: true,
        status: true,
        lang: true,
        teacher: { select: { userId: true } },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    }),
    db.conferenceParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
      select: { status: true },
    }),
  ])
  if (!liveClass) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
  // A kicked participant cannot rejoin — revocation that doesn't wait for TTL.
  if (existingParticipant?.status === "removed") {
    return actionError(ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED)
  }
  if (liveClass.status === "cancelled" || liveClass.status === "ended") {
    return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
  }

  const participantRole = await resolveParticipantRole(
    userId,
    role,
    schoolId,
    sessionId,
    liveClass.teacher.userId,
    liveClass.sectionId,
    liveClass.visibility
  )
  if (!participantRole) {
    return actionError(ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED)
  }

  // Hosts can start a not-yet-live class on join. Others get blocked.
  if (liveClass.status === "scheduled" && participantRole !== "HOST") {
    return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
  }
  if (liveClass.status === "scheduled" && participantRole === "HOST") {
    // Joining as HOST auto-starts the room, so it must respect the same
    // per-school concurrent-room cap that startLiveClass enforces.
    const capError = await concurrentCapError(schoolId)
    if (capError) return capError
    try {
      await ensureRoom({
        roomName: liveClass.roomName,
        maxParticipants: liveClass.maxParticipants,
      })
      await db.conference.update({
        where: { id: sessionId },
        data: { status: "live", actualStart: new Date() },
      })
    } catch {
      return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
    }
  }

  // Upsert participant row + token timestamp.
  await db.conferenceParticipant.upsert({
    where: { sessionId_userId: { sessionId, userId } },
    create: {
      schoolId,
      sessionId,
      userId,
      role: participantRole,
      tokenIssuedAt: new Date(),
    },
    update: {
      role: participantRole,
      tokenIssuedAt: new Date(),
    },
  })

  const displayName = userRow?.username ?? userRow?.email ?? userId

  let token: string
  let wsUrl: string
  try {
    token = await issueAccessToken({
      schoolId,
      sessionId,
      userId,
      role: participantRole,
      roomName: liveClass.roomName,
      displayName,
      lang: liveClass.lang,
      ttlSec: 300,
    })
    wsUrl = getLiveKitConfig().wsUrl
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
  }

  const expiresAt = new Date(Date.now() + 300 * 1000).toISOString()
  return {
    success: true as const,
    data: {
      token,
      wsUrl,
      roomName: liveClass.roomName,
      identity: userId,
      role: participantRole,
      expiresAt,
    },
  }
}

/**
 * Refresh a join token mid-session (e.g. near expiry). Re-runs the
 * eligibility check, so revoked access takes effect at the next refresh
 * boundary — i.e. revocation latency = token TTL (≤5 min), NOT instant.
 * LiveKit JWTs are stateless; an already-issued token cannot be invalidated
 * server-side before it expires (no removeParticipant is wired to revocation).
 */
export async function refreshLiveClassToken(sessionId: string) {
  return joinLiveClass(sessionId)
}
