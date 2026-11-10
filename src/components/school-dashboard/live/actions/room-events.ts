"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext } from "./helpers"
import { holdsHostSeat } from "./host-seat"

const KINDS = new Set([
  "poll_closed",
  "question",
  "whiteboard_cleared",
  "quiz_launched",
  "quiz_closed",
])

/**
 * The host's client persists what the room produced — a closed poll with its
 * tally, a question asked — as `ConferenceEvent` rows, so the class history
 * survives the room. Everything else on the data channel is ephemeral by
 * design (strokes, hand state) and is not written.
 *
 * Idempotent on `(session, key)`: the host may call twice (a re-render, a
 * retry) and the second call is a no-op.
 */
export async function recordClassEvent(input: {
  sessionId: string
  kind:
    | "poll_closed"
    | "question"
    | "whiteboard_cleared"
    | "quiz_launched"
    | "quiz_closed"
  /** Stable id from the room (poll id, question id). */
  key: string
  payload: Record<string, unknown>
}) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return ctx.response
  if (!KINDS.has(input.kind) || !/^[A-Za-z0-9_-]{1,64}$/.test(input.key)) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }

  const session = await db.conference.findFirst({
    where: { id: input.sessionId, schoolId: ctx.schoolId, deletedAt: null },
    select: { id: true, teacher: { select: { userId: true } } },
  })
  if (!session) return actionError(ACTION_ERRORS.NOT_FOUND)

  // Host-side on THIS class: an admin, its own teacher, or a co-host seated
  // in it. A co-host running the room alone still persists closed polls and
  // questions exactly as the owning teacher does — they hold a seat. What no
  // longer passes is a teacher of the school with no seat in this class.
  const seated = await holdsHostSeat({
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
    sessionId: session.id,
    sessionTeacherUserId: session.teacher?.userId,
  })
  if (!seated) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  const eventId = `lc:${session.id}:${input.kind}:${input.key}`
  const existing = await db.conferenceEvent.findUnique({
    where: { eventId },
    select: { id: true },
  })
  if (existing)
    return {
      success: true as const,
      data: { id: existing.id, duplicate: true },
    }

  const serialized = JSON.stringify(input.payload ?? {})
  const row = await db.conferenceEvent.create({
    data: {
      schoolId: ctx.schoolId,
      sessionId: session.id,
      eventType: input.kind,
      actorUserId: ctx.userId,
      eventId,
      payload: (serialized.length <= 8_000
        ? input.payload
        : { truncated: true }) as Prisma.InputJsonObject,
    },
    select: { id: true },
  })
  return { success: true as const, data: { id: row.id, duplicate: false } }
}
