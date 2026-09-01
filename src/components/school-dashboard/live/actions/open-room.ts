// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The LOOSE delivery mode — one open room per section per school day.
//
// `timetable` mode says "this class happens at 09:15 because the timetable
// says so". `open` mode says the opposite: the section has a standing room for
// the whole teaching day and meets in it whenever it needs to. That is what an
// emergency actually looks like — a school that has gone online because of a
// storm rarely reproduces its bell schedule on day one, and a school that is
// online by design may not want a bell schedule at all.
//
// Modelled as an ordinary slot-less Conference, which the block already
// supports (assemblies, town halls, one-off tutorials): `timetableId: null`,
// `subjectId: null`, a section, and a schedule spanning the day's periods.
// Nothing downstream needs to learn a new concept.
//
// Two consequences of being slot-less, both intentional:
//   - no `timetableId` ⇒ `syncLiveAttendance` skips it. An open room is
//     not a period, so it cannot write period attendance. Teachers mark
//     attendance for the period as they always would.
//   - no `subjectId` ⇒ `ConferenceLink` (keyed on subject) cannot supply a
//     URL. An external open room therefore depends entirely on the school's
//     fallback link, which is shared across sections. Per-section fallback
//     links are an ISSUE.md follow-up.
//
// A plain `server-only` module for the same reason as `slot-session.ts`: the
// cron runs with no user session.
import "server-only"

import { after } from "next/server"
import type { ConferenceStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { prewarm } from "@/components/translation/prewarm"
import { detectLang } from "@/components/translation/util"

import { schoolDayWindow, slotInstantsOn } from "../day-window"
import { roomNameFor } from "../livekit/room-naming"
import type { OnlinePolicy } from "../online-policy"

/**
 * Same "already decided today" set the slot materializer uses. An open room
 * the teacher ended or cancelled stays ended — the sweep re-runs every 15
 * minutes and must not keep reopening it. (A teacher who wants a second
 * sitting creates an ad-hoc session from the wizard; auto-reopening would
 * spawn a fresh row every quarter hour for the rest of the day.)
 */
const DECIDED: ConferenceStatus[] = [
  "scheduled",
  "live",
  "ended",
  "cancelled",
  "failed",
]

export type OpenRoomSection = {
  id: string
  name: string
  /** Host. `Conference.teacherId` is required, so a section without one is skipped. */
  homeroomTeacherId: string | null
  homeroomTeacherUserId: string | null
  conferenceRecordingOptOut: boolean
}

export type OpenRoomContext = {
  schoolId: string
  timeZone: string
  date: Date
  policy: OnlinePolicy
  recordingEnabled: boolean
  /** Shared standing link. An external open room has no other source. */
  meetingUrl: string | null
  meetingProvider: string | null
  lang: string
  /** The day's teaching window, from the first and last non-break periods. */
  dayStart: Date
  dayEnd: Date
}

export type OpenRoomResult =
  | { created: true; sessionId: string }
  | {
      created: false
      reason: "exists" | "cancelled" | "no_link" | "no_teacher" | "day_over"
    }

/**
 * The UTC instants an open room spans on `date`: the first period's start to
 * the last period's end, in the school's timezone.
 *
 * Falls back to the whole calendar day when the school has no periods at all —
 * a school with no bell schedule is precisely the school most likely to want
 * loose delivery, so "no periods" must not mean "no room".
 */
export function openRoomWindow(
  timeZone: string,
  date: Date,
  periods: Array<{ startTime: Date; endTime: Date }>
): { start: Date; end: Date } {
  if (periods.length === 0) return schoolDayWindow(timeZone, date)
  const sorted = [...periods].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )
  const first = sorted[0]!
  const last = sorted.reduce((acc, p) =>
    p.endTime.getTime() > acc.endTime.getTime() ? p : acc
  )
  const instants = slotInstantsOn(timeZone, date, {
    startTime: first.startTime,
    endTime: last.endTime,
  })
  if (!instants) return schoolDayWindow(timeZone, date)
  return { start: instants.scheduledStart, end: instants.scheduledEnd }
}

/**
 * Create today's open room for one section.
 *
 * Idempotent through a deterministic lookup rather than a unique constraint:
 * the row is identified by (section, no slot, no subject, exact start). The
 * start is computed from the day and the bell schedule, so a re-run finds the
 * row it wrote 15 minutes ago. A hand-created ad-hoc session could only
 * collide by starting at exactly the first period's instant for the same
 * section with no subject — and the only consequence of that collision is that
 * we do not create a second room, which is the benign direction.
 */
export async function materializeOpenRoom(
  section: OpenRoomSection,
  ctx: OpenRoomContext
): Promise<OpenRoomResult> {
  // A room whose whole window is already over is not worth creating: nobody
  // can use it, the reminder window has passed, and the end-stale cron would
  // cancel it on its next pass. This is what stops an afternoon flip from
  // filling the table with dead-on-arrival rows.
  //
  // Compared against NOW, never against `ctx.date` — same as
  // `materializeSlotSession`'s `period_over`. `ctx.date` is the target DAY, and
  // callers pass it carrying the current time-of-day; comparing to that makes
  // every FUTURE day look already over the moment the wall clock passes the
  // last period's end. (Which is exactly what happened: a run at 15:20 UTC
  // refused to build tomorrow's rooms because tomorrow's classes end at 12:10.)
  if (ctx.dayEnd.getTime() <= Date.now()) {
    return { created: false, reason: "day_over" }
  }
  if (!section.homeroomTeacherId) {
    return { created: false, reason: "no_teacher" }
  }
  if (ctx.policy.provider === "external" && !ctx.meetingUrl) {
    return { created: false, reason: "no_link" }
  }

  const existing = await db.conference.findFirst({
    where: {
      schoolId: ctx.schoolId,
      sectionId: section.id,
      timetableId: null,
      subjectId: null,
      scheduledStart: ctx.dayStart,
      status: { in: DECIDED },
      deletedAt: null,
    },
    select: { id: true, status: true },
  })
  if (existing) {
    return {
      created: false,
      reason: existing.status === "cancelled" ? "cancelled" : "exists",
    }
  }

  const title = section.name
  const common = {
    schoolId: ctx.schoolId,
    timetableId: null,
    teacherId: section.homeroomTeacherId,
    sectionId: section.id,
    subjectId: null,
    scheduledStart: ctx.dayStart,
    scheduledEnd: ctx.dayEnd,
    status: "scheduled" as const,
    visibility: "section" as const,
    recordingEnabled: ctx.recordingEnabled,
    maxParticipants: 50,
    title,
    lang: detectLang(title) || ctx.lang,
  }

  if (ctx.policy.provider === "livekit") {
    // Two-step so the tenant-namespaced roomName can embed the row's own cuid,
    // exactly as every other create path does — the webhook recovers schoolId
    // from that name alone.
    const created = await db.conference.create({
      data: {
        ...common,
        provider: "livekit" as const,
        roomName: `pending-open-${section.id}-${ctx.dayStart.getTime()}`,
      },
      select: { id: true },
    })
    await db.conference.update({
      where: { id: created.id },
      data: { roomName: roomNameFor(ctx.schoolId, created.id) },
    })
    if (section.homeroomTeacherUserId) {
      await db.conferenceParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId: created.id,
            userId: section.homeroomTeacherUserId,
          },
        },
        create: {
          schoolId: ctx.schoolId,
          sessionId: created.id,
          userId: section.homeroomTeacherUserId,
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
      provider: "external" as const,
      roomName: `ext-open-${section.id}-${ctx.dayStart.getTime()}`,
      meetingUrl: ctx.meetingUrl,
      meetingProvider: ctx.meetingProvider,
    },
    select: { id: true },
  })
  warmTitle(ctx.schoolId, common.title, common.lang)
  return { created: true, sessionId: created.id }
}

/** Same rationale as `slot-session.ts warmTitle` — see the note there. */
function warmTitle(schoolId: string, title: string, lang: string): void {
  const run = () => prewarm("Conference", { title, lang }, { schoolId })
  try {
    after(run)
  } catch {
    void run()
  }
}
