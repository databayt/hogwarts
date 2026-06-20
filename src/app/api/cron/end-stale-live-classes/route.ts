// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 15 minutes — closes conference sessions stuck in `live` long
// past their scheduled end. A LiveKit `room_finished` webhook normally ends a
// session, but if it's never delivered (SFU restart, network blip) the row
// would stay `live` forever and its attendance would never sync. This is the
// backstop: flip those to `ended` (status-guarded so a concurrent webhook can't
// be clobbered) and run the best-effort attendance sync for each.
//
// Only LiveKit sessions ever reach `live` (external pasted-link sessions stay
// `scheduled`), so no provider filter is needed.

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { syncConferenceAttendance } from "@/components/school-dashboard/conference/actions/attendance-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// Minutes past scheduledEnd a `live` session may run before we treat it as
// stranded. Generous so a class running slightly over is never cut short.
const STALE_GRACE_MINUTES = 30

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
      void syncConferenceAttendance(s.schoolId, s.id)
    }
  }

  return NextResponse.json({ ok: true, scanned: stale.length, ended })
}
