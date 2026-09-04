// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Join/eligibility core shared by the `joinLiveClass` server action (initial
// SSR join on the room page) and the GET /api/conference/token route handler
// (the in-room ~4-min token refresh). Mirrors notifications' poll-actions
// split: the recurring client call must be a route handler, NOT an action —
// auth() rotates the session cookie inside action requests, so every poll
// response would ship a full RSC re-render of the page (~1MB per participant
// per refresh) instead of ~1KB of JSON.
import "server-only"

import { auth } from "@/auth"
import type {
  ConferenceParticipantRole,
  ConferenceVisibility,
  UserRole,
} from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLiveKitConfig } from "@/components/school-dashboard/live/livekit/client"
import { ensureRoom } from "@/components/school-dashboard/live/livekit/rooms"
import { issueAccessToken } from "@/components/school-dashboard/live/livekit/token"
import type { RoomJoinTicket } from "@/components/school-dashboard/live/types"

import { concurrentCapError } from "./helpers"
import { transitionToLive } from "./went-live"

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

export type JoinResult =
  | { success: true; data: RoomJoinTicket }
  | ReturnType<typeof actionError>

/**
 * Validate auth + tenant + eligibility for a session, ensure the SFU room
 * exists, and mint a short-lived join JWT.
 *
 * `allowAutoStart` distinguishes the two callers: the initial join (action /
 * room page) may auto-start a scheduled room as HOST; the refresh route never
 * starts anything — by refresh time the room is already live, and a GET must
 * not carry start-a-room side effects.
 */
/**
 * Who is joining. The web lanes leave this off and it comes from the NextAuth
 * session + subdomain tenant context; the mobile lane passes it explicitly
 * because a phone authenticates with a Bearer JWT and has no cookie or host to
 * resolve a tenant from.
 *
 * Passing an actor bypasses only IDENTITY resolution. Everything downstream —
 * enrollment, visibility, removed-participant checks, session state, the
 * concurrent-room cap, the grants baked into the token — is unchanged and runs
 * exactly once, here, for every caller. That is the point: mobile must not grow
 * a second eligibility path that can drift from the web one.
 */
export type JoinActor = {
  userId: string
  role: UserRole
  schoolId: string
}

export async function performLiveClassJoin(
  sessionId: string,
  {
    allowAutoStart = true,
    actor,
  }: { allowAutoStart?: boolean; actor?: JoinActor } = {}
): Promise<JoinResult> {
  let userId: string
  let role: UserRole
  let schoolId: string

  if (actor) {
    ;({ userId, role, schoolId } = actor)
  } else {
    const session = await auth()
    const sessionUserId = session?.user?.id
    const sessionRole = session?.user?.role as UserRole | undefined
    if (!sessionUserId || !sessionRole) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    const tenant = await getTenantContext()
    if (!tenant.schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    userId = sessionUserId
    role = sessionRole
    schoolId = tenant.schoolId
  }

  // Fetch the session, the joining user (display name), and any existing
  // participant row concurrently — all keyed only by ids known here.
  const [liveClass, userRow, existingParticipant] = await Promise.all([
    db.conference.findFirst({
      where: { id: sessionId, schoolId, deletedAt: null },
      select: {
        id: true,
        roomName: true,
        provider: true,
        sectionId: true,
        visibility: true,
        maxParticipants: true,
        status: true,
        lang: true,
        recordingEnabled: true,
        studentsJoinMuted: true,
        teacher: { select: { userId: true } },
        school: {
          select: {
            conferenceGuardiansObserve: true,
            conferenceStudentsJoinMuted: true,
            conferenceRecordingConsentNote: true,
            conferenceToolChat: true,
            conferenceToolHands: true,
            conferenceToolPolls: true,
            conferenceToolWhiteboard: true,
            conferenceToolStudentShare: true,
          },
        },
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
  // Only an in-app (LiveKit) session has a room to mint a ticket for. An
  // external session IS its meeting URL: the web room page redirects to it
  // before ever calling this, but the mobile route and any future caller land
  // here directly — and without this gate a HOST would open a real SFU room
  // under the `ext-…` name (which no webhook can parse back) and flip the row
  // `live` with nothing to run it.
  if (liveClass.provider !== "livekit") {
    return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
  }
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
  // School switch: guardians observe only where the school allows it.
  if (
    participantRole === "OBSERVER" &&
    role === "GUARDIAN" &&
    !liveClass.school.conferenceGuardiansObserve
  ) {
    return actionError(ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED)
  }
  if (!participantRole) {
    return actionError(ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED)
  }

  // Hosts can start a not-yet-live class on join. Others get blocked.
  if (liveClass.status === "scheduled") {
    if (participantRole !== "HOST" || !allowAutoStart) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
    }
    // Joining as HOST auto-starts the room, so it must respect the same
    // per-school concurrent-room cap that startLiveClass enforces.
    const capError = await concurrentCapError(schoolId)
    if (capError) return capError
    try {
      await ensureRoom({
        roomName: liveClass.roomName,
        maxParticipants: liveClass.maxParticipants,
      })
    } catch {
      return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
    }
    // The guarded flip + its side effects (roster notification, recording
    // egress) — performed by whichever writer wins, this one or the SFU's
    // room_started webhook. See actions/went-live.ts.
    await transitionToLive({
      schoolId,
      sessionId,
      roomName: liveClass.roomName,
      recordingEnabled: liveClass.recordingEnabled,
    })
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
      allowScreenShare: liveClass.school.conferenceToolStudentShare,
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
      // Where hand-raises and poll votes are addressed over the data channel.
      hostIdentity: liveClass.teacher?.userId ?? null,
      roomConfig: {
        joinMuted:
          liveClass.studentsJoinMuted ??
          liveClass.school.conferenceStudentsJoinMuted,
        tools: {
          chat: liveClass.school.conferenceToolChat,
          hands: liveClass.school.conferenceToolHands,
          polls: liveClass.school.conferenceToolPolls,
          whiteboard: liveClass.school.conferenceToolWhiteboard,
          studentShare: liveClass.school.conferenceToolStudentShare,
        },
        consentNote: liveClass.school.conferenceRecordingConsentNote,
        recording: liveClass.recordingEnabled,
      },
      expiresAt,
    },
  }
}
