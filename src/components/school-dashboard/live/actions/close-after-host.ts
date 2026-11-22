// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// A timetable class closes with its time: once the bell has rung and the
// teacher has left the room, the class is over — it must not sit as "live"
// into the next period, where a tap on it lands in the old room.
//
// The rule is `shouldCloseAfterHost` (join-window.ts). Two callers, one
// implementation: the webhook arms a short timer when a host leaves, and the
// end-stale cron sweeps what a timer missed.
import "server-only"

import { db } from "@/lib/db"

import { HOST_GONE_HOLD_MS, shouldCloseAfterHost } from "../join-window"
import { getRoomServiceClient, isLiveKitConfigured } from "../livekit/client"
import { closeRoom } from "../livekit/close-room"
import { syncLiveAttendance } from "./attendance-sync"

/** Farther than this from the bell, the cron is the backstop — no timer. */
const ARM_WITHIN_MS = 20 * 60_000
/** Margin after the bell so the timer never fires a hair before it. */
const BELL_MARGIN_MS = 5_000

// One timer per session. An in-process timer is acceptable here because the
// app runs as one long-lived container, and it is only an accelerator: if the
// process restarts, the end-stale cron re-checks every 15 minutes and closes
// the same classes through `closeIfHostGone`.
const timers = new Map<string, NodeJS.Timeout>()

/**
 * Called after a host (HOST / CO_HOST) leaves a live timetable class. Arms —
 * or re-arms — the single close timer for the session. Reads nothing: the
 * webhook is on the SFU's delivery path. Never throws.
 */
export function scheduleCloseAfterHost(input: {
  schoolId: string
  sessionId: string
  /** The class's bell — the caller already holds the row. */
  scheduledEnd: Date | null
}): void {
  const { schoolId, sessionId, scheduledEnd } = input
  try {
    if (!scheduledEnd) return
    const untilBell = scheduledEnd.getTime() - Date.now()
    if (untilBell > ARM_WITHIN_MS) return

    const delay = Math.max(HOST_GONE_HOLD_MS, untilBell + BELL_MARGIN_MS)
    const existing = timers.get(sessionId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      timers.delete(sessionId)
      void closeIfHostGone(schoolId, sessionId)
    }, delay)
    timer.unref?.()
    timers.set(sessionId, timer)
  } catch (err) {
    console.error("[live-class] schedule close-after-host failed", {
      schoolId,
      sessionId,
      err: err instanceof Error ? err.message : err,
    })
  }
}

/** The video server answering "no such room" — as opposed to not answering. */
function isRoomMissing(err: unknown): boolean {
  const e = err as { status?: number; code?: string; message?: string }
  return (
    e?.status === 404 ||
    e?.code === "not_found" ||
    /not found|does not exist/i.test(e?.message ?? "")
  )
}

/**
 * Close the class when the rule says so: live, timetable, not practice, bell
 * rung, no host in the room. Re-reads everything (scoped by school) — a host
 * who came back during the hold keeps the class open. Does what the cron does
 * for a stale class: guarded status write, close the SFU room, sync attendance.
 * Never throws; returns whether this call closed the class.
 */
export async function closeIfHostGone(
  schoolId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const session = await db.conference.findFirst({
      where: { id: sessionId, schoolId },
      select: {
        id: true,
        status: true,
        timetableId: true,
        isPractice: true,
        scheduledEnd: true,
        roomName: true,
        teacher: { select: { userId: true } },
        recordings: {
          where: { status: { in: ["pending", "processing"] } },
          select: { egressId: true },
        },
      },
    })
    if (!session) return false

    const hostsPresent = await db.conferenceParticipant.count({
      where: {
        sessionId,
        schoolId,
        role: { in: ["HOST", "CO_HOST"] },
        activeSince: { not: null },
        status: "joined",
      },
    })

    if (
      !shouldCloseAfterHost({
        status: session.status,
        timetableId: session.timetableId,
        isPractice: session.isPractice,
        scheduledEnd: session.scheduledEnd,
        nowMs: Date.now(),
        hostsPresent,
      })
    ) {
      return false
    }

    // The rows above come from webhooks. A webhook lost while the server
    // restarted would make a teaching teacher look absent — so before closing,
    // ask the video server who is actually in the room.
    if (isLiveKitConfigured()) {
      const hostRows = await db.conferenceParticipant.findMany({
        where: { sessionId, schoolId, role: { in: ["HOST", "CO_HOST"] } },
        select: { id: true, userId: true, activeSince: true },
      })
      const hostIds = new Set<string>(hostRows.map((h) => h.userId))
      if (session.teacher?.userId) hostIds.add(session.teacher.userId)

      let identities: string[]
      try {
        const live = await getRoomServiceClient().listParticipants(
          session.roomName
        )
        identities = live.map((p) => p.identity)
      } catch (err) {
        if (!isRoomMissing(err)) {
          // Unreachable: never close on a guess — the 15-minute job retries.
          console.error("[live-class] close-after-host room check failed", {
            schoolId,
            sessionId,
            err: err instanceof Error ? err.message : err,
          })
          return false
        }
        identities = [] // no such room: nobody is in it
      }

      const present = identities.filter((id) => hostIds.has(id))
      if (present.length > 0) {
        // Repair the row so the next check agrees with the video server.
        const stale = hostRows
          .filter((h) => h.activeSince === null && present.includes(h.userId))
          .map((h) => h.id)
        if (stale.length > 0) {
          await db.conferenceParticipant.updateMany({
            where: { id: { in: stale }, schoolId, activeSince: null },
            data: { activeSince: new Date() },
          })
        }
        return false
      }
    }

    const { count } = await db.conference.updateMany({
      where: { id: sessionId, schoolId, status: "live" },
      data: { status: "ended", actualEnd: new Date() },
    })
    if (count === 0) return false

    await closeRoom(
      session.roomName,
      (session.recordings ?? []).map((r) => r.egressId)
    )
    // Best-effort, like every other closer: the class is already ended.
    try {
      await syncLiveAttendance(schoolId, sessionId)
    } catch (err) {
      console.error("[live-class] attendance sync after close failed", {
        schoolId,
        sessionId,
        err: err instanceof Error ? err.message : err,
      })
    }
    return true
  } catch (err) {
    console.error("[live-class] close-after-host failed", {
      schoolId,
      sessionId,
      err: err instanceof Error ? err.message : err,
    })
    return false
  }
}
