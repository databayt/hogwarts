// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 15 minutes (cf/crons.json `*/15`) — closes conference sessions
// that are over but still `live`.
//
// Arm 0: a timetable class whose bell has rung and whose teacher is no longer
// in the room closes now, through `closeIfHostGone` (the rule lives there, and
// the webhook's own timer uses it too) — so a finished class is not "live"
// into the next period.
//
// Arm 1: a LiveKit `room_finished` webhook normally ends a session, but if
// it's never delivered (SFU restart, network blip) the row would stay `live`
// forever and its attendance would never sync. This is the backstop: flip
// those to `ended` (status-guarded so a concurrent webhook can't be clobbered)
// and run the best-effort attendance sync for each.
//
// Only LiveKit sessions ever reach `live` (external pasted-link sessions stay
// `scheduled`), so no provider filter is needed on that arm.
//
// A COVERED class (an admin or stage supervisor took it over — see
// live/actions/cover.ts) with its covering host still in the room is never
// closed by the clock arm, and a covered class is not "missed".
//
// A second arm closes `scheduled` sessions nobody ever started — the sweep that
// keeps an online school's materialized day from accumulating forever.

import { after, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { syncLiveAttendance } from "@/components/school-dashboard/live/actions/attendance-sync"
import { closeIfHostGone } from "@/components/school-dashboard/live/actions/close-after-host"
import { JOIN_GRACE_AFTER_END_MIN } from "@/components/school-dashboard/live/join-window"
import { closeRoom } from "@/components/school-dashboard/live/livekit/close-room"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/** A covered class whose covering host is in the room right now. */
const COVERED_WITH_HOST_PRESENT: Prisma.ConferenceWhereInput = {
  coveredByUserId: { not: null },
  participants: {
    some: {
      role: { in: ["HOST", "CO_HOST"] },
      activeSince: { not: null },
    },
  },
}

// Minutes past scheduledEnd a `live` session may run before we treat it as
// stranded. Generous so a class running slightly over is never cut short.
const STALE_GRACE_MINUTES = 30

// Hours a recording may sit pending/processing after its class ended before
// we stop waiting for LiveKit's egress_ended webhook.
const STUCK_RECORDING_HOURS = 3

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "end-stale-live-classes")) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  const cutoff = new Date(Date.now() - STALE_GRACE_MINUTES * 60 * 1000)

  // Arm 0: timetable classes past the bell with nobody hosting. The candidate
  // read is cheap; `closeIfHostGone` re-reads presence and applies the rule,
  // so a teacher still in the room keeps her class.
  const bellRung = await db.conference.findMany({
    where: {
      status: "live",
      deletedAt: null,
      isPractice: false,
      timetableId: { not: null },
      scheduledEnd: { lt: new Date() },
      NOT: COVERED_WITH_HOST_PRESENT,
    },
    select: { id: true, schoolId: true },
    take: 1000,
  })
  let hostGone = 0
  for (const s of bellRung) {
    if (await closeIfHostGone(s.schoolId, s.id)) hostGone++
  }

  // A TIMETABLE class closes by the clock: the room is there for its slot,
  // and once the slot's join window (end + JOIN_GRACE_AFTER_END_MIN) is over
  // the class is over — attendance is written then, whoever was in the room.
  // (An empty room inside the window does not end it; see the webhook.)
  const slotCutoff = new Date(Date.now() - JOIN_GRACE_AFTER_END_MIN * 60 * 1000)
  const stale = await db.conference.findMany({
    where: {
      status: "live",
      deletedAt: null,
      // The practice room never ends by the clock.
      isPractice: false,
      // Nor does a covered class while its covering host is in the room.
      NOT: COVERED_WITH_HOST_PRESENT,
      OR: [
        { scheduledEnd: { lt: cutoff } },
        { timetableId: { not: null }, scheduledEnd: { lt: slotCutoff } },
      ],
    },
    select: {
      id: true,
      schoolId: true,
      roomName: true,
      recordings: {
        where: { status: { in: ["pending", "processing"] } },
        select: { egressId: true },
      },
    },
    take: 1000,
  })

  let ended = 0
  for (const s of stale) {
    // Status-guarded so a room_finished webhook racing this run wins cleanly.
    const { count } = await db.conference.updateMany({
      where: { id: s.id, schoolId: s.schoolId, status: "live" },
      data: { status: "ended", actualEnd: new Date() },
    })
    if (count > 0) {
      ended++
      // The clock closes the ROOM too, not only the row. It used to run on —
      // recording included — for as long as one tab stayed open, and whoever
      // was in it was told "token expired" at their next heartbeat. Ending it
      // gives every client the class-has-ended screen at once.
      await closeRoom(
        s.roomName,
        (s.recordings ?? []).map((r) => r.egressId)
      )
      after(() => syncLiveAttendance(s.schoolId, s.id))
    }
  }

  // Second arm: sessions nobody ever started.
  //
  // An online school materializes a session per slot per day, so every class
  // that isn't held leaves a `scheduled` row behind — nothing else transitions
  // one (external sessions never even reach `live`). Left alone that is ~120
  // rows per school per day accumulating forever, and each one keeps showing a
  // "scheduled today" dot and a Join button long after the period ended.
  //
  // Deliberately NOT `ended`, and deliberately no attendance sync: whether a
  // no-show online class should mark its whole roster absent is a product
  // decision, not something a cleanup cron should make silently. `cancelled`
  // says what actually happened — the class never ran. See conference/ISSUE.md.
  const abandoned = await db.conference.findMany({
    where: {
      status: "scheduled",
      deletedAt: null,
      isPractice: false,
      scheduledEnd: { lt: cutoff },
    },
    select: { id: true, schoolId: true },
    take: 1000,
  })

  let cancelled = 0
  for (const s of abandoned) {
    // Status-guarded, like the arm above: a teacher starting late must win.
    const { count } = await db.conference.updateMany({
      where: { id: s.id, schoolId: s.schoolId, status: "scheduled" },
      data: { status: "cancelled" },
    })
    if (count > 0) cancelled++
  }

  // Third arm: recordings whose egress_ended webhook never came. Without it a
  // row sits "preparing" on the class page forever; `failed` lets the page say
  // so. Only once the class itself is over and the row has been quiet a while —
  // a long class keeps its egress `processing` for as long as it runs.
  const recordingCutoff = new Date(
    Date.now() - STUCK_RECORDING_HOURS * 60 * 60 * 1000
  )
  const { count: recordingsFailed } = await db.conferenceRecording.updateMany({
    where: {
      status: { in: ["pending", "processing"] },
      deletedAt: null,
      updatedAt: { lt: recordingCutoff },
      session: { status: { in: ["ended", "cancelled"] } },
    },
    data: {
      status: "failed",
      failureReason: `no egress result within ${STUCK_RECORDING_HOURS}h`,
    },
  })

  return NextResponse.json({
    ok: true,
    scanned: stale.length,
    ended,
    hostGone,
    abandoned: abandoned.length,
    cancelled,
    recordingsFailed,
  })
}
