// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Someone is waiting for you."
//
// In the first class with students (2026-11-10, 12:00) the teacher and the
// students were in the room at different times for half an hour: the teacher
// from 12:05 to 12:10, a student at 12:17, the teacher again at 12:23, another
// student at 12:36. "The class is live" had gone out once, at the first
// walk-in; after that nobody was told that the other side had arrived, so
// each waited a minute alone and left. They met for six minutes of fifty.
//
// This runs when the SFU confirms an arrival. If the person who just came in
// is a student and no teacher is in the room, the teacher is told; if it is a
// teacher and no student is in, the roster is told. Rate-limited per class, so
// a connection that flaps cannot become a stream of notices.
//
// A plain `server-only` module: the webhook has no user session.
import "server-only"

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { processPendingWebPushes } from "@/lib/notifications/push-web"

import { notifyClassWaiting } from "./notifications"

export type WaitingSide = "teacher" | "roster"

/** "The class is live" went to the same people this recently — say nothing. */
const STARTED_NOTICE_COVERS_MS = 2 * 60_000

/**
 * A waiting student is urgent for one person, so the teacher may be told a
 * few times; a waiting teacher is told to a whole roster and their parents,
 * so that side is told rarely.
 */
const LIMITS: Record<WaitingSide, { gapMs: number; max: number }> = {
  teacher: { gapMs: 5 * 60_000, max: 4 },
  roster: { gapMs: 10 * 60_000, max: 2 },
}

const EVENT: Record<WaitingSide, string> = {
  teacher: "waiting_nudge_teacher",
  roster: "waiting_nudge_roster",
}

const isHost = (role: string) => role === "HOST" || role === "CO_HOST"

/**
 * Tell the other side that `joinerUserId` is in the room without them.
 * Returns which side was told, or null when nothing was sent. Never throws
 * for a lost race; a database failure does throw — the caller logs it.
 */
export async function nudgeWaiting(input: {
  schoolId: string
  sessionId: string
  joinerUserId: string
  now?: Date
}): Promise<WaitingSide | null> {
  const { schoolId, sessionId, joinerUserId } = input
  const now = input.now ?? new Date()

  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId, status: "live", deletedAt: null },
    select: {
      id: true,
      actualStart: true,
      scheduledEnd: true,
      visibility: true,
    },
  })
  // A school-wide session's "roster" is the whole school; its first notice
  // is enough.
  if (!session || session.visibility === "school") return null
  if (session.scheduledEnd && now >= session.scheduledEnd) return null

  // Every seat of the class, by the same presence rows the register is
  // written from: who is in the room right now (an open span), and who has
  // been. The joiner's own row was opened by the event that got here.
  const seats = await db.conferenceParticipant.findMany({
    where: { sessionId, schoolId },
    select: {
      userId: true,
      role: true,
      status: true,
      activeSince: true,
      joinedAt: true,
    },
  })
  const present = seats.filter((p) => p.status === "joined" && p.activeSince)
  const joiner = present.find((p) => p.userId === joinerUserId)
  if (!joiner) return null

  const hostIn = present.some((p) => isHost(p.role))
  const studentIn = present.some((p) => p.role === "PARTICIPANT")
  const side: WaitingSide | null =
    joiner.role === "PARTICIPANT" && !hostIn
      ? "teacher"
      : isHost(joiner.role) && !studentIn
        ? "roster"
        : null
  if (!side) return null

  // Right after the class went live, "the class is live" has just reached
  // the people this would reach. That is always so for the roster. For the
  // teacher it is so only when a student opened the room; a teacher who
  // opened it and stepped out was sent nothing, and is told at once.
  const justStarted =
    session.actualStart !== null &&
    now.getTime() - session.actualStart.getTime() < STARTED_NOTICE_COVERS_MS
  const hostHasBeenIn = seats.some((p) => isHost(p.role) && p.joinedAt)
  if (justStarted && (side === "roster" || !hostHasBeenIn)) return null

  const limit = LIMITS[side]
  const sent = await db.conferenceEvent.findMany({
    where: { schoolId, sessionId, eventType: EVENT[side] },
    orderBy: { occurredAt: "desc" },
    take: limit.max,
    select: { occurredAt: true },
  })
  if (sent.length >= limit.max) return null
  if (sent[0] && now.getTime() - sent[0].occurredAt.getTime() < limit.gapMs) {
    return null
  }

  // The claim. Two students walking in at the same second both pass the
  // check above; the minute-bucketed id lets only one of them send.
  try {
    await db.conferenceEvent.create({
      data: {
        schoolId,
        sessionId,
        eventType: EVENT[side],
        actorUserId: joinerUserId,
        eventId: `nudge:${sessionId}:${side}:${Math.floor(now.getTime() / 60_000)}`,
        payload: { present: present.length },
      },
      select: { id: true },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return null
    }
    throw err
  }

  // Everyone already in the room is left out — they can see for themselves.
  const { created } = await notifyClassWaiting(
    schoolId,
    sessionId,
    side,
    present.map((p) => p.userId)
  )
  // The push leaves with the notice, not a cron tick later (went-live.ts).
  if (created > 0) await processPendingWebPushes(200).catch(() => {})
  return side
}
