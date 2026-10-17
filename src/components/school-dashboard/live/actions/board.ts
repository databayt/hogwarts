"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { Stroke } from "../room/class-channel"

/**
 * The board's memory. Strokes travel over the data channel; the host's
 * client keeps the latest page as ONE `ConferenceEvent` row (`eventType:
 * "board"`, upserted on a stable `eventId`), so a teacher who reloads, or
 * whose tab crashes, comes back to the same board — and the session keeps
 * what was drawn. No model of its own, no migration.
 *
 * Host-side only: the caller must hold a HOST or CO_HOST participant row on
 * this tenant's session, and the school's board switch must be on.
 */

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const MAX_STROKES = 400
const MAX_POINTS = 2000
const MAX_BYTES = 900_000
const TOOLS = new Set([
  "pen",
  "highlighter",
  "line",
  "arrow",
  "rect",
  "ellipse",
  "text",
])

async function boardContext(sessionId: string) {
  if (!ID_RE.test(sessionId))
    return { ok: false as const, error: ACTION_ERRORS.VALIDATION_ERROR }
  const session = await auth()
  const userId = session?.user?.id
  if (!userId)
    return { ok: false as const, error: ACTION_ERRORS.NOT_AUTHENTICATED }
  const { schoolId } = await getTenantContext()
  if (!schoolId)
    return { ok: false as const, error: ACTION_ERRORS.MISSING_SCHOOL }

  const [conference, participant] = await Promise.all([
    db.conference.findFirst({
      where: { id: sessionId, schoolId, deletedAt: null },
      select: {
        id: true,
        school: { select: { conferenceToolWhiteboard: true } },
      },
    }),
    db.conferenceParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
      select: { role: true, schoolId: true },
    }),
  ])
  if (!conference) return { ok: false as const, error: ACTION_ERRORS.NOT_FOUND }
  if (
    !conference.school.conferenceToolWhiteboard ||
    !participant ||
    participant.schoolId !== schoolId ||
    (participant.role !== "HOST" && participant.role !== "CO_HOST")
  ) {
    return { ok: false as const, error: ACTION_ERRORS.UNAUTHORIZED }
  }
  return { ok: true as const, schoolId, userId }
}

/** Keep only well-formed strokes — the payload came from a browser. */
function clean(strokes: unknown): Stroke[] | null {
  if (!Array.isArray(strokes)) return null
  const out: Stroke[] = []
  for (const raw of strokes.slice(-MAX_STROKES)) {
    const s = raw as Partial<Stroke>
    if (
      !s ||
      typeof s.id !== "string" ||
      !ID_RE.test(s.id) ||
      typeof s.color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(s.color) ||
      typeof s.width !== "number" ||
      !Array.isArray(s.points) ||
      s.points.length === 0 ||
      s.points.length > MAX_POINTS
    )
      continue
    const tool = s.tool && TOOLS.has(s.tool) ? s.tool : "pen"
    const points = s.points.filter(
      (p): p is [number, number] =>
        Array.isArray(p) &&
        p.length === 2 &&
        typeof p[0] === "number" &&
        typeof p[1] === "number" &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1])
    )
    if (points.length === 0) continue
    out.push({
      id: s.id,
      color: s.color,
      width: Math.max(1, Math.min(40, s.width)),
      tool,
      points,
      ...(tool === "text" && typeof s.text === "string"
        ? { text: s.text.slice(0, 200) }
        : {}),
      ...(typeof s.by === "string" && ID_RE.test(s.by) ? { by: s.by } : {}),
    })
  }
  return out
}

/** Save the board as it stands now. Called debounced by the host. */
export async function saveBoard(input: {
  sessionId: string
  strokes: unknown
}) {
  const ctx = await boardContext(input.sessionId)
  if (!ctx.ok) return actionError(ctx.error)
  const strokes = clean(input.strokes)
  if (!strokes) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  if (JSON.stringify(strokes).length > MAX_BYTES)
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const eventId = `lc:${input.sessionId}:board`
  const payload = { strokes } as unknown as Prisma.InputJsonObject
  await db.conferenceEvent.upsert({
    where: { eventId },
    create: {
      schoolId: ctx.schoolId,
      sessionId: input.sessionId,
      eventType: "board",
      actorUserId: ctx.userId,
      eventId,
      payload,
    },
    update: { payload, actorUserId: ctx.userId, occurredAt: new Date() },
    select: { id: true },
  })
  return { success: true as const, data: { count: strokes.length } }
}

/** The saved board, for a host coming back into the room. */
export async function getBoard(input: { sessionId: string }) {
  const ctx = await boardContext(input.sessionId)
  if (!ctx.ok) return actionError(ctx.error)
  const row = await db.conferenceEvent.findFirst({
    where: {
      eventId: `lc:${input.sessionId}:board`,
      schoolId: ctx.schoolId,
    },
    select: { payload: true },
  })
  const strokes =
    clean((row?.payload as { strokes?: unknown } | null)?.strokes) ?? []
  return { success: true as const, data: { strokes } }
}
