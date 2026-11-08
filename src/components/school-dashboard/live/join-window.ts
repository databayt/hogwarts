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

/** How early a teacher may open a scheduled class. Before this, starting it
 *  would flip the row `live`, tell every student "your class has started" an
 *  hour early, and bill an empty room's minutes. */
export const HOST_EARLY_START_MIN = 15

/** How long after the bell the join link still opens the room. Classes run
 *  over; a student who taps Join at 14:52 for a 14:50 end still belongs in the
 *  room the teacher has not closed yet. The end-stale cron is the real backstop
 *  (it closes rooms 30 minutes past their end). */
export const JOIN_GRACE_AFTER_END_MIN = 10

/** The school's reminder lead (`conferenceReminderLeadMinutes`) when unset. */
export const DEFAULT_JOIN_LEAD_MIN = 10

const MIN = 60_000

export type JoinWindow = { opensAtMs: number; closesAtMs: number }

export type JoinPhase = "early" | "open" | "over"

/**
 * The window a class's join link is open, for one viewer.
 *
 * A host opens at the later of the school's lead and the host floor — a
 * teacher needs a few minutes to set up before students arrive, so the host's
 * window is never SHORTER than the students'. Everyone else opens at the
 * school's lead time (the same minutes the "starting soon" reminder uses), so
 * the reminder and the button agree about when the class is joinable.
 */
export function joinWindow(opts: {
  startMs: number
  endMs: number
  leadMinutes?: number | null
  isHost: boolean
}): JoinWindow {
  const lead = clampLead(opts.leadMinutes)
  const openLead = opts.isHost ? Math.max(lead, HOST_EARLY_START_MIN) : lead
  return {
    opensAtMs: opts.startMs - openLead * MIN,
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
