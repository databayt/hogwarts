"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { sanitizeTrace } from "../room/connection-trace"

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
/** Rows one person may leave on one class. */
const MAX_ROWS_PER_SEAT = 40

/**
 * Save what one seat's connection went through (room/connection-trace.ts) as
 * a `ConferenceEvent` row, `eventType: "client_trace"`. Read by people, with
 * SQL, when a class went badly: it answers "was the phone asleep, or was the
 * network gone?", which the video server's log cannot.
 *
 * Gated on the caller holding a seat in this tenant's class — the join wrote
 * that row. Fire-and-forget for the client; nothing in the room waits on it.
 */
export async function recordConnectionTrace(input: {
  sessionId: string
  events: unknown
}) {
  if (typeof input?.sessionId !== "string" || !ID_RE.test(input.sessionId)) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const events = sanitizeTrace(input.events)
  if (events.length === 0) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  const { schoolId } = await getTenantContext()
  if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

  const seat = await db.conferenceParticipant.findFirst({
    where: { sessionId: input.sessionId, schoolId, userId },
    select: { id: true },
  })
  if (!seat) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  const written = await db.conferenceEvent.count({
    where: {
      schoolId,
      sessionId: input.sessionId,
      eventType: "client_trace",
      actorUserId: userId,
    },
  })
  // Past the cap the answer is still "taken": the client drops the batch
  // instead of holding it for a retry that would be refused again.
  if (written >= MAX_ROWS_PER_SEAT) {
    return { success: true as const, data: { stored: false } }
  }

  await db.conferenceEvent.create({
    data: {
      schoolId,
      sessionId: input.sessionId,
      eventType: "client_trace",
      actorUserId: userId,
      payload: { v: 1, events } as unknown as Prisma.InputJsonObject,
    },
    select: { id: true },
  })
  return { success: true as const, data: { stored: true } }
}
