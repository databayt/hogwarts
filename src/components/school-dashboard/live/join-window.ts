// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// When a class can be joined, as plain arithmetic on instants.
//
// One module, no imports, so the SAME rule runs in three places that used to
// each carry their own: the join link's server gate (`/live/join/[slot]`), the
// host auto-start in `actions/join-core.ts` and `startLiveClass`, and the
// client buttons that decide whether to show Join at all. Instants (epoch ms)
// rather than wall-clock times on purpose — an instant means the same moment
// on a server in UTC and on a phone in Khartoum, so nothing here can be off by
// the school's UTC offset, which is the bug class this block keeps meeting.

/** How early a teacher may open an AD-HOC class (one not on the timetable).
 *  Timetable classes use `joinWindow` — one window for everyone. */
export const HOST_EARLY_START_MIN = 15

/** How long after the bell the join link still opens the room. Classes run
 *  over; a student who taps Join at 14:52 for a 14:50 end still belongs in the
 *  room. It is also when a timetable class closes by the clock: the end-stale
 *  cron and the room_finished webhook end the session after this grace. */
export const JOIN_GRACE_AFTER_END_MIN = 10

/** The school's reminder lead (`conferenceReminderLeadMinutes`) when unset. */
export const DEFAULT_JOIN_LEAD_MIN = 10

const MIN = 60_000

export type JoinWindow = { opensAtMs: number; closesAtMs: number }

export type JoinPhase = "early" | "open" | "over"

/**
 * The window a class's join link is open — the same for everyone.
 *
 * A timetable class is a classroom that is simply THERE for its time: the
 * teacher and the students walk in whenever they arrive, in any order, so
 * there is one window, opening at the school's lead (the same minutes the
 * "starting soon" reminder uses) and closing JOIN_GRACE_AFTER_END_MIN after
 * the bell. `isHost` is kept for callers but no longer widens the window.
 */
export function joinWindow(opts: {
  startMs: number
  endMs: number
  leadMinutes?: number | null
  isHost: boolean
}): JoinWindow {
  const lead = clampLead(opts.leadMinutes)
  return {
    opensAtMs: opts.startMs - lead * MIN,
    closesAtMs: opts.endMs + JOIN_GRACE_AFTER_END_MIN * MIN,
  }
}

/** Where `nowMs` falls against a join window. */
export function joinPhase(nowMs: number, w: JoinWindow): JoinPhase {
  if (nowMs < w.opensAtMs) return "early"
  if (nowMs > w.closesAtMs) return "over"
  return "open"
}

/**
 * May a host START this scheduled class now? Only the opening edge matters: a
 * class past its end is still startable (a teacher running a late sitting), and
 * the end-stale cron closes what is forgotten.
 */
export function hostMayStart(
  scheduledStart: Date | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!scheduledStart) return true
  return nowMs >= scheduledStart.getTime() - HOST_EARLY_START_MIN * MIN
}

function clampLead(lead: number | null | undefined): number {
  if (typeof lead !== "number" || !Number.isFinite(lead)) {
    return DEFAULT_JOIN_LEAD_MIN
  }
  // The settings form bounds it to 1–60; anything outside is bad data, and a
  // negative lead would open the link after the class started.
  return Math.min(60, Math.max(0, Math.round(lead)))
}
