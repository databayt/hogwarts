// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 15 minutes — finds sessions starting in the next 5-20 min and
// dispatches a `live_class_starting_soon` notification (idempotent via
// ConferenceEvent eventType lookup). The 15-min-wide window matches the */15
// cadence so no start time falls into a gap between consecutive runs; the
// idempotency guard means the boundary overlap never double-sends.
// (Cadence was reduced from */5 to */15 so Neon compute can scale to zero
// between runs — see vercel.json crons.)

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { notifyClassStartingSoon } from "@/components/school-dashboard/conference/actions/notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "live-class-reminders")) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  const now = Date.now()
  const startMin = new Date(now + 5 * 60 * 1000)
  const startMax = new Date(now + 20 * 60 * 1000)

  const sessions = await db.conference.findMany({
    where: {
      status: "scheduled",
      deletedAt: null,
      scheduledStart: { gte: startMin, lte: startMax },
    },
    select: { id: true, schoolId: true },
    take: 1000,
  })

  // Batch-load which of these sessions already have a reminder event — one
  // query instead of one findFirst per session (was an N+1 over up to 1000 rows).
  const reminded = new Set(
    sessions.length === 0
      ? []
      : (
          await db.conferenceEvent.findMany({
            where: {
              sessionId: { in: sessions.map((s) => s.id) },
              eventType: "reminder_starting_soon",
            },
            select: { sessionId: true },
          })
        ).map((e) => e.sessionId)
  )

  let dispatched = 0
  for (const s of sessions) {
    if (reminded.has(s.id)) continue
    await notifyClassStartingSoon(s.schoolId, s.id)
    await db.conferenceEvent.create({
      data: {
        schoolId: s.schoolId,
        sessionId: s.id,
        eventType: "reminder_starting_soon",
      },
    })
    dispatched++
  }
  return NextResponse.json({ ok: true, dispatched })
}
