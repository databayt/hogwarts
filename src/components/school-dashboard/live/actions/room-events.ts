"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext } from "./helpers"

const KINDS = new Set(["poll_closed", "question", "whiteboard_cleared"])

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
  kind: "poll_closed" | "question" | "whiteboard_cleared"
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
    select: { id: true, teacherId: true },
  })
  if (!session) return actionError(ACTION_ERRORS.NOT_FOUND)

  if (ctx.role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { schoolId: ctx.schoolId, userId: ctx.userId },
      select: { id: true },
    })
    if (!teacher || teacher.id !== session.teacherId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
  }

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
