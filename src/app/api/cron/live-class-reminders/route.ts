// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 15 minutes — reminds each class once, shortly before it starts,
// with a `live_class_starting_soon` notification (idempotent via a
// ConferenceEvent row). A class is due once it is within the school's lead, or
// within one cron cadence when the lead is shorter than that: the window must
// be at least as wide as the gap between two runs, or some start times are
// never inside it at any tick. (Cadence was reduced from */5 to */15 so Neon
// compute can scale to zero between runs — see cf/crons.json.)

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { runLiveDailyDigest } from "@/components/school-dashboard/live/actions/daily-digest"
import { materializeOnlineSchools } from "@/components/school-dashboard/live/actions/materialize-day"
import { processPendingWebPushes } from "@/lib/notifications/push-web"
import { notifyClassStartingSoon } from "@/components/school-dashboard/live/actions/notifications"
import {
  runLiveMinutesGuard,
  type MinutesGuardResult,
} from "@/components/school-dashboard/live/actions/usage-guard"

/** Upper bound of `School.conferenceReminderLeadMinutes` (mirrors the settings schema). */
const MAX_REMINDER_LEAD_MINUTES = 60

/**
 * How often this route runs (cf/crons.json). A school's lead shorter than this
 * cannot be honoured exactly: with the default 10 minutes, a class starting on
 * a quarter hour is 15 minutes out at one tick and already starting at the
 * next, so it was never inside the lead at any run — on 2026-11-09 that was 40
 * of one school's 52 classes. Such a class is reminded at the tick BEFORE its
 * lead instead; the notice prints the real minutes.
 */
const CRON_CADENCE_MINUTES = 15

/** A tick runs the materialization sweep first, so "now" drifts by seconds to
 *  a minute or two between runs; the window overlaps by this much. */
const TICK_SLACK_MINUTES = 2

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
  // (`conferenceReminderLeadMinutes`, default 10). Scan the widest reach the
  // setting allows and keep the sessions inside THEIR school's reach that
  // have not started — a reminder for a class that has started is noise.
  // The event-row dedupe below keeps re-runs idempotent.
  const now = Date.now()
  const startMin = new Date(now)
  const startMax = new Date(
    now + (MAX_REMINDER_LEAD_MINUTES + TICK_SLACK_MINUTES) * 60 * 1000
  )
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
    const reach = Math.max(lead, CRON_CADENCE_MINUTES) + TICK_SLACK_MINUTES
    return s.scheduledStart.getTime() - now <= reach * 60 * 1000
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
  //
  // Each session gets its OWN minutes-to-start, not the school's configured
  // lead: two sessions in the same run can be at different points inside
  // that lead window (e.g. lead=45 catches one 40 minutes out and one 8
  // minutes out on the same sweep), and the notification body says the
  // actual count. Rounded to the nearest minute, floored at 1 — a session
  // about to start would otherwise print "in 0 minutes".
  await inBatches(due, NOTIFY_CONCURRENCY, async (s) => {
    const leadMinutes = Math.max(
      1,
      Math.round((s.scheduledStart.getTime() - now) / 60_000)
    )
    await notifyClassStartingSoon(s.schoolId, s.id, leadMinutes)
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

  // Deliver the reminders' pushes NOW. The push drain is its own route on this
  // same tick and the Worker fires a tick's routes in parallel (cf/worker.js),
  // so it has usually finished before these rows exist — a "starts in 10
  // minutes" push would then leave on the next tick, after the bell.
  // Best-effort: the drain route still picks up whatever this misses.
  let pushed = 0
  if (due.length > 0) {
    try {
      pushed = (await processPendingWebPushes(400)).succeeded
    } catch (err) {
      console.error("[live-class] reminder push drain failed", {
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Once a day (its own tick check): the month's LiveKit minutes against the
  // plan, emailed to the platform from 80%. Last, and best-effort — a meter
  // read must never cost a reminder.
  let minutesGuard: MinutesGuardResult = { ran: false }
  try {
    minutesGuard = await runLiveMinutesGuard()
  } catch (err) {
    console.error("[live-class] minutes guard failed", {
      err: err instanceof Error ? err.message : String(err),
    })
  }

  // The admins' morning note on today's live classes — once per school day,
  // from 06:00 school time. Best-effort, after the reminders.
  let digest = { sent: 0 }
  try {
    digest = await runLiveDailyDigest()
  } catch (err) {
    console.error("[live-class] daily digest failed", {
      err: err instanceof Error ? err.message : String(err),
    })
  }

  return NextResponse.json({
    ok: true,
    dispatched: due.length,
    pushed,
    materialized,
    minutesGuard,
    digest,
  })
}
