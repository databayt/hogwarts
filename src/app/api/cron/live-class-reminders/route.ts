// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 5 minutes — finds sessions starting in the next 5-10 min and
// dispatches a `live_class_starting_soon` notification (idempotent via
// LiveClassEvent eventType lookup). The 5-min-wide window matches the */5
// cadence so no start time falls into a gap between consecutive runs; the
// idempotency guard means the boundary overlap never double-sends.

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { notifyClassStartingSoon } from "@/components/school-dashboard/live-classes/actions/notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "live-class-reminders")) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  const now = Date.now()
  const startMin = new Date(now + 5 * 60 * 1000)
  const startMax = new Date(now + 10 * 60 * 1000)

  const sessions = await db.liveClassSession.findMany({
    where: {
      status: "scheduled",
      deletedAt: null,
      scheduledStart: { gte: startMin, lte: startMax },
    },
    select: { id: true, schoolId: true },
    take: 1000,
  })

  let dispatched = 0
  for (const s of sessions) {
    const already = await db.liveClassEvent.findFirst({
      where: {
        schoolId: s.schoolId,
        sessionId: s.id,
        eventType: "reminder_starting_soon",
      },
      select: { id: true },
    })
    if (already) continue
    await notifyClassStartingSoon(s.schoolId, s.id)
    await db.liveClassEvent.create({
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
