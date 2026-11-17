// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The board's memory, shared by the web room's server actions (board.ts) and
// the app's mobile route (api/mobile/conference/[id]/board). One ConferenceEvent
// row per session (`eventType: "board"`, stable `eventId`), host-only, and only
// while the school's board switch is on. Callers bring an authenticated actor.
import "server-only"

import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, type ActionErrorCode } from "@/lib/action-errors"
import { db } from "@/lib/db"

import type { Stroke } from "../room/class-channel"

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

export type BoardActor = { userId: string; schoolId: string }

type Access =
  | { ok: true; schoolId: string; userId: string }
  | { ok: false; error: ActionErrorCode }

/** A HOST or CO_HOST seat on this tenant's session, with the board switch on. */
export async function boardAccess(
  actor: BoardActor,
  sessionId: string
): Promise<Access> {
  if (!ID_RE.test(sessionId))
    return { ok: false, error: ACTION_ERRORS.VALIDATION_ERROR }
  const { userId, schoolId } = actor
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
  if (!conference) return { ok: false, error: ACTION_ERRORS.NOT_FOUND }
  if (
    !conference.school.conferenceToolWhiteboard ||
    !participant ||
    participant.schoolId !== schoolId ||
    (participant.role !== "HOST" && participant.role !== "CO_HOST")
  ) {
    return { ok: false, error: ACTION_ERRORS.UNAUTHORIZED }
  }
  return { ok: true, schoolId, userId }
}

/** Keep only well-formed strokes — the payload came from a browser. */
export function cleanBoardStrokes(strokes: unknown): Stroke[] | null {
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

export type BoardResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionErrorCode }

/** Save the board as it stands now (the host, debounced). */
export async function saveBoardFor(
  actor: BoardActor,
  sessionId: string,
  rawStrokes: unknown
): Promise<BoardResult<{ count: number }>> {
  const ctx = await boardAccess(actor, sessionId)
  if (!ctx.ok) return { success: false, error: ctx.error }
  const strokes = cleanBoardStrokes(rawStrokes)
  if (!strokes || JSON.stringify(strokes).length > MAX_BYTES)
    return { success: false, error: ACTION_ERRORS.VALIDATION_ERROR }
  const eventId = `lc:${sessionId}:board`
  const payload = { strokes } as unknown as Prisma.InputJsonObject
  await db.conferenceEvent.upsert({
    where: { eventId },
    create: {
      schoolId: ctx.schoolId,
      sessionId,
      eventType: "board",
      actorUserId: ctx.userId,
      eventId,
      payload,
    },
    update: { payload, actorUserId: ctx.userId, occurredAt: new Date() },
    select: { id: true },
  })
  return { success: true, data: { count: strokes.length } }
}

/** The saved board, for a host coming back into the room. */
export async function getBoardFor(
  actor: BoardActor,
  sessionId: string
): Promise<BoardResult<{ strokes: Stroke[] }>> {
  const ctx = await boardAccess(actor, sessionId)
  if (!ctx.ok) return { success: false, error: ctx.error }
  const row = await db.conferenceEvent.findFirst({
    where: { eventId: `lc:${sessionId}:board`, schoolId: ctx.schoolId },
    select: { payload: true },
  })
  const strokes =
    cleanBoardStrokes((row?.payload as { strokes?: unknown } | null)?.strokes) ??
    []
  return { success: true, data: { strokes } }
}
