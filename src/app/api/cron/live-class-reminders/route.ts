// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 10 minutes — finds scheduled sessions starting in the next
// 5-15 min and dispatches a `live_class_starting_soon` notification
// (idempotent via LiveClassEvent eventType lookup). The 10-min-wide window
// matches the */10 cadence so no start time falls into a gap between runs;
// the idempotency guard means the boundary overlap never double-sends.

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { notifyClassStartingSoon } from "@/components/school-dashboard/live-classes/actions/notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  const now = Date.now()
  const startMin = new Date(now + 5 * 60 * 1000)
  const startMax = new Date(now + 15 * 60 * 1000)

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
