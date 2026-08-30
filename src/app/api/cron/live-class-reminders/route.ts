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
import { materializeOnlineSchools } from "@/components/school-dashboard/conference/actions/materialize-day"
import { notifyClassStartingSoon } from "@/components/school-dashboard/conference/actions/notifications"

/** Upper bound of `School.conferenceReminderLeadMinutes` (mirrors the settings schema). */
const MAX_REMINDER_LEAD_MINUTES = 60

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// 300, not 60: this run now materializes an online school's whole day before
// the reminder sweep. The first run of a school day creates ~120 rows and the
// reminders must still fit afterwards — a timeout here strands the tail of the
// sweep, which is the exact failure the batching above removed.
export const maxDuration = 300

/**
 * Notifications dispatched at once. `dispatch` fans out to a section roster
 * plus guardians and renders an email per recipient, so this is deliberately
 * modest — enough to stop the run being a serial queue, small enough not to
 * stampede the notification hub or the connection pool.
 */
const NOTIFY_CONCURRENCY = 10

async function inBatches<T>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "live-class-reminders")) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  // Turn today's online-school intent into actual sessions BEFORE the reminder
  // sweep below reads them — a slot materialized now is reminded on this very
  // run if it starts within the window. Best-effort: a materialization failure
  // must never cost the reminders for sessions that already exist.
  let materialized = { schools: 0, created: 0, skipped: 0, truncated: 0 }
  try {
    materialized = await materializeOnlineSchools()
  } catch (err) {
    console.error("[live-class] online-school materialization failed", {
      err: err instanceof Error ? err.message : String(err),
    })
  }

  // Each school sets how far ahead its reminder goes out
  // (`conferenceReminderLeadMinutes`, default 10). Scan the widest lead the
  // setting allows and keep the sessions inside THEIR school's lead and at
  // least a minute out — a reminder for a class that has started is noise.
  // The event-row dedupe below keeps re-runs idempotent.
  const now = Date.now()
  const startMin = new Date(now + 1 * 60 * 1000)
  const startMax = new Date(now + MAX_REMINDER_LEAD_MINUTES * 60 * 1000)
  const candidates = await db.conference.findMany({
    where: {
      status: "scheduled",
      deletedAt: null,
      scheduledStart: { gte: startMin, lte: startMax },
    },
    select: {
      id: true,
      schoolId: true,
      scheduledStart: true,
      school: { select: { conferenceReminderLeadMinutes: true } },
    },
    take: 2000,
  })
  const sessions = candidates.filter((s) => {
    const lead = s.school?.conferenceReminderLeadMinutes ?? 10
    return s.scheduledStart.getTime() - now <= lead * 60 * 1000
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

  const due = sessions.filter((s) => !reminded.has(s.id))

  // Batched, not serial. The old loop awaited a full fan-out AND an event
  // insert per session, up to 1000 of them, under a 60s budget — on
  // timeout the untouched tail was never reminded at all, because by the next
  // run 15 minutes later the 5–20-minute window had moved past those sessions.
  // `dispatch` swallows its own errors, so a bad session can't reject here.
  await inBatches(due, NOTIFY_CONCURRENCY, async (s) => {
    await notifyClassStartingSoon(s.schoolId, s.id)
  })

  // Stamp the idempotency rows AFTER dispatching, in one insert. Order matters:
  // marking first and crashing would suppress the reminder forever, while
  // dispatching first and crashing costs at worst a duplicate notification.
  if (due.length > 0) {
    await db.conferenceEvent.createMany({
      data: due.map((s) => ({
        schoolId: s.schoolId,
        sessionId: s.id,
        eventType: "reminder_starting_soon",
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({
    ok: true,
    dispatched: due.length,
    materialized,
  })
}
