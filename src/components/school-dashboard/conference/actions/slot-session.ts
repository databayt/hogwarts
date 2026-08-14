// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Slot-anchored sessions, keyed by SCHOOL-CALENDAR DAY.
//
// A timetable slot recurs weekly, so "the session on this slot" is only
// meaningful together with a date. The previous lookup in
// `createLiveClassFromTimetable` matched any `scheduled|live` row on the slot
// (`orderBy: createdAt desc`) — harmless while sessions were one-offs, but the
// moment a slot is taught online every week it silently reuses LAST week's
// row. Everything here is day-qualified.
//
// A plain `server-only` module (not `"use server"`) so the cron can call it:
// the materializer runs with NO user session, which is exactly why it cannot
// go through `createLiveClass`. The two writers are deliberate — the
// interactive path keeps its auth context, ownership fallback and concurrent
// cap; the cron path writes directly — and they share the day math and the
// lookup below so they cannot disagree about WHICH row belongs to a day.
import "server-only"

import { after } from "next/server"
import type { ConferenceProvider, ConferenceStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { prewarm } from "@/components/translation/prewarm"
import { detectLang } from "@/components/translation/util"

import { schoolDayWindow, slotInstantsOn } from "../day-window"
import { roomNameFor } from "../livekit/room-naming"
import type { OnlinePolicy } from "../online-policy"

/** Statuses that mean "there is a session to join on this slot right now". */
const JOINABLE: ConferenceStatus[] = ["scheduled", "live"]

/**
 * Statuses that mean "this slot has already been decided for today" — which
 * includes `cancelled` and `ended`.
 *
 * The distinction matters and is not cosmetic. The materialization sweep must
 * use THIS set: it re-runs every 15 minutes, so if it only looked for
 * joinable rows it would cheerfully recreate a class the teacher cancelled an
 * hour ago, over and over, all day.
 */
const DECIDED: ConferenceStatus[] = [
  "scheduled",
  "live",
  "ended",
  "cancelled",
  "failed",
]

/**
 * The session anchored to `timetableId` on the school day containing `date`.
 * Earliest first — a day holds at most one session per slot in practice, and
 * taking the earliest keeps the choice deterministic if a manual create ever
 * produced two.
 *
 * `statuses` defaults to the joinable set, which is what the interactive Start
 * button wants: a class that already ENDED today should not be reused, so a
 * teacher can hold a second sitting.
 */
export async function findSlotSessionForDay(
  schoolId: string,
  timetableId: string,
  timeZone: string,
  date: Date = new Date(),
  statuses: ConferenceStatus[] = JOINABLE
): Promise<{ id: string; status: ConferenceStatus } | null> {
  const { start, end } = schoolDayWindow(timeZone, date)
  return db.conference.findFirst({
    where: {
      schoolId,
      timetableId,
      status: { in: statuses },
      scheduledStart: { gte: start, lt: end },
      deletedAt: null,
    },
    select: { id: true, status: true },
    orderBy: { scheduledStart: "asc" },
  })
}

export type MaterializableSlot = {
  id: string
  teacherId: string
  sectionId: string
  subjectId: string | null
  subjectName: string | null
  sectionName: string | null
  teacherUserId: string | null
  period: { startTime: Date; endTime: Date }
}

export type MaterializeContext = {
  schoolId: string
  timeZone: string
  date: Date
  policy: OnlinePolicy
  /** School-wide recording default, already merged with the section opt-out. */
  recordingEnabled: boolean
  /** Recurring meeting link for the slot's (subject, section, term), if set. */
  meetingUrl: string | null
  meetingProvider: string | null
  lang: string
}

export type MaterializeResult =
  | { created: true; sessionId: string }
  | {
      created: false
      reason: "exists" | "cancelled" | "no_link" | "bad_period" | "period_over"
    }

/**
 * Create the `scheduled` session for one slot on one school day.
 *
 * Idempotent through `findSlotSessionForDay` — a re-run (the cron fires every
 * 15 minutes) is a no-op. Returns a reason instead of throwing so the caller
 * can report a per-run tally without one bad slot aborting the sweep.
 */
export async function materializeSlotSession(
  slot: MaterializableSlot,
  ctx: MaterializeContext
): Promise<MaterializeResult> {
  // DECIDED, not just joinable: a class the teacher cancelled must stay
  // cancelled, or the next sweep 15 minutes later would resurrect it.
  const existing = await findSlotSessionForDay(
    ctx.schoolId,
    slot.id,
    ctx.timeZone,
    ctx.date,
    DECIDED
  )
  if (existing) {
    return {
      created: false,
      reason: existing.status === "cancelled" ? "cancelled" : "exists",
    }
  }

  const instants = slotInstantsOn(ctx.timeZone, ctx.date, slot.period)
  if (!instants) return { created: false, reason: "bad_period" }

  // A period that is already over is not worth a row. This matters the moment
  // a school can go online MID-DAY: flipping the switch at 13:00 would
  // otherwise materialize every morning slot as `scheduled`, publish Join
  // buttons for classes that finished hours ago, and hand the end-stale cron a
  // pile of instantly-stranded rows to cancel. Unconditional rather than
  // "only for today", so back-filling a past date is a no-op too.
  if (instants.scheduledEnd.getTime() <= Date.now()) {
    return { created: false, reason: "period_over" }
  }

  // An external session IS its link. With no recurring link for this
  // (subject, section, term) there is nothing to join, so materializing one
  // would only publish a dead Join button and an empty reminder.
  if (ctx.policy.provider === "external" && !ctx.meetingUrl) {
    return { created: false, reason: "no_link" }
  }

  const title =
    [slot.subjectName, slot.sectionName].filter(Boolean).join(" · ") ||
    "Live Class"

  const common = {
    schoolId: ctx.schoolId,
    timetableId: slot.id,
    teacherId: slot.teacherId,
    sectionId: slot.sectionId,
    subjectId: slot.subjectId,
    scheduledStart: instants.scheduledStart,
    scheduledEnd: instants.scheduledEnd,
    status: "scheduled" as const,
    visibility: "section" as const,
    recordingEnabled: ctx.recordingEnabled,
    maxParticipants: 50,
    title,
    lang: detectLang(title) || ctx.lang,
  }

  if (ctx.policy.provider === "livekit") {
    // Two-step so the tenant-namespaced roomName can embed the row's own cuid,
    // exactly as both interactive create paths do.
    const created = await db.conference.create({
      data: {
        ...common,
        provider: "livekit" as ConferenceProvider,
        roomName: `pending-${slot.id}-${instants.scheduledStart.getTime()}`,
      },
      select: { id: true },
    })
    await db.conference.update({
      where: { id: created.id },
      data: { roomName: roomNameFor(ctx.schoolId, created.id) },
    })
    // Teacher is HOST up front; students and guardians resolve lazily on join
    // from the section roster.
    if (slot.teacherUserId) {
      await db.conferenceParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId: created.id,
            userId: slot.teacherUserId,
          },
        },
        create: {
          schoolId: ctx.schoolId,
          sessionId: created.id,
          userId: slot.teacherUserId,
          role: "HOST",
        },
        update: { role: "HOST" },
      })
    }
    warmTitle(ctx.schoolId, common.title, common.lang)
    return { created: true, sessionId: created.id }
  }

  const created = await db.conference.create({
    data: {
      ...common,
      provider: "external" as ConferenceProvider,
      // External sessions hold no SFU room, but roomName is a required @unique
      // column — mirror the `ext-` synthetic used by the wizard.
      roomName: `ext-${slot.id}-${instants.scheduledStart.getTime()}`,
      meetingUrl: ctx.meetingUrl,
      meetingProvider: ctx.meetingProvider,
    },
    select: { id: true },
  })
  warmTitle(ctx.schoolId, common.title, common.lang)
  return { created: true, sessionId: created.id }
}

/**
 * Pre-translate a materialized session's title off the response path.
 *
 * Worth doing per row despite the volume: `prewarm` only FILLS cache gaps, and
 * a slot's title ("Maths · Grade 1-A") is the same every week — so each
 * distinct title costs one translation for the life of the term, and every
 * reader in the other language gets a cache hit instead of waiting.
 */
function warmTitle(schoolId: string, title: string, lang: string): void {
  const run = () => prewarm("Conference", { title, lang }, { schoolId })
  try {
    after(run)
  } catch {
    // `after()` throws when there is no request scope. This module is a plain
    // one — reachable from a script or a future queue worker as well as the
    // cron route — and outside a request there is no response to defer past,
    // so a cache fill must not be the thing that fails the materialization.
    void run()
  }
}
