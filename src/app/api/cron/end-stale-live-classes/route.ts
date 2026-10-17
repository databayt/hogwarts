// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 30 minutes (vercel.json `*/30`) — closes conference sessions
// stuck in `live` long past their scheduled end. A LiveKit `room_finished` webhook normally ends a
// session, but if it's never delivered (SFU restart, network blip) the row
// would stay `live` forever and its attendance would never sync. This is the
// backstop: flip those to `ended` (status-guarded so a concurrent webhook can't
// be clobbered) and run the best-effort attendance sync for each.
//
// Only LiveKit sessions ever reach `live` (external pasted-link sessions stay
// `scheduled`), so no provider filter is needed on that arm.
//
// A second arm closes `scheduled` sessions nobody ever started — the sweep that
// keeps an online school's materialized day from accumulating forever.

import { after, NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { syncLiveAttendance } from "@/components/school-dashboard/live/actions/attendance-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

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

  const stale = await db.conference.findMany({
    where: {
      status: "live",
      deletedAt: null,
      scheduledEnd: { lt: cutoff },
    },
    select: { id: true, schoolId: true },
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
    abandoned: abandoned.length,
    cancelled,
    recordingsFailed,
  })
}
