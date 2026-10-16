"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { checkMessageSendRateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * The room chat's memory. Messages travel over the LiveKit data channel —
 * that is the fast path and nothing here sits in front of it. Each sender's
 * client then saves its own message as a `ConferenceEvent` (`eventType:
 * "chat"`), so a late joiner, a reconnect or a reload opens on the
 * conversation so far. No model of its own: the events table already has the
 * `(schoolId, sessionId, occurredAt)` index this reads by, and `eventId`
 * makes a retried write a no-op.
 *
 * Both actions are gated on the caller being a participant of this tenant's
 * session (the join wrote that row) and on the school's chat switch — which
 * makes `tools.chat` a server rule for history, not only a hidden button.
 */

export type RoomChatMessage = {
  id: string
  identity: string
  name: string
  text: string
  at: number
}

const MAX_TEXT = 1000
const PAGE = 50
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/

async function chatContext(sessionId: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false as const, error: ACTION_ERRORS.NOT_AUTHENTICATED }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { ok: false as const, error: ACTION_ERRORS.MISSING_SCHOOL }

  const [conference, participant] = await Promise.all([
    db.conference.findFirst({
      where: { id: sessionId, schoolId, deletedAt: null },
      select: { id: true, school: { select: { conferenceToolChat: true } } },
    }),
    db.conferenceParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
      select: { role: true },
    }),
  ])
  if (!conference) return { ok: false as const, error: ACTION_ERRORS.NOT_FOUND }
  if (!conference.school.conferenceToolChat || !participant) {
    return { ok: false as const, error: ACTION_ERRORS.UNAUTHORIZED }
  }
  return { ok: true as const, schoolId, userId, participant }
}

/** Save one message the caller just sent over the room. Fire-and-forget. */
export async function recordChatMessage(input: {
  sessionId: string
  /** The LiveKit chat message id — the same id every peer received. */
  messageId: string
  text: string
}) {
  const text = input.text?.trim()
  if (
    !text ||
    text.length > MAX_TEXT ||
    !ID_RE.test(input.messageId) ||
    !ID_RE.test(input.sessionId)
  ) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const ctx = await chatContext(input.sessionId)
  if (!ctx.ok) return actionError(ctx.error)

  const limit = checkMessageSendRateLimit(ctx.userId, input.sessionId, ctx.schoolId)
  if (!limit.allowed) return actionError(ACTION_ERRORS.RATE_LIMITED)

  // The name is the server's, never the client's — the same one join-core
  // put on the room token, so history reads exactly as the live chat did.
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { username: true, email: true },
  })
  const name = (user?.username ?? user?.email ?? "").slice(0, 80)

  const eventId = `lc:${input.sessionId}:chat:${input.messageId}`
  await db.conferenceEvent.upsert({
    where: { eventId },
    update: {},
    create: {
      schoolId: ctx.schoolId,
      sessionId: input.sessionId,
      eventType: "chat",
      actorUserId: ctx.userId,
      eventId,
      payload: {
        id: input.messageId,
        text,
        name,
      },
    },
    select: { id: true },
  })
  return { success: true as const }
}

/**
 * The newest page of the room's chat, oldest first. `before` (ms) pages back.
 */
export async function getRoomChat(input: { sessionId: string; before?: number }) {
  if (!ID_RE.test(input.sessionId)) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const ctx = await chatContext(input.sessionId)
  if (!ctx.ok) return actionError(ctx.error)

  const rows = await db.conferenceEvent.findMany({
    where: {
      schoolId: ctx.schoolId,
      sessionId: input.sessionId,
      eventType: "chat",
      ...(input.before ? { occurredAt: { lt: new Date(input.before) } } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: PAGE + 1,
    select: { actorUserId: true, payload: true, occurredAt: true },
  })
  const hasMore = rows.length > PAGE
  const messages: RoomChatMessage[] = []
  for (const row of rows.slice(0, PAGE).reverse()) {
    const p = row.payload as { id?: string; text?: string; name?: string } | null
    if (!p?.id || !p.text) continue
    messages.push({
      id: p.id,
      // The room identity IS the user id (join-core issues `identity: userId`).
      identity: row.actorUserId ?? "",
      name: p.name ?? "",
      text: p.text,
      at: row.occurredAt.getTime(),
    })
  }
  return { success: true as const, data: { messages, hasMore } }
}
