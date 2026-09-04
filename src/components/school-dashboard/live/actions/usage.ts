// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class usage metering against the platform's LiveKit tier. Read-only
// aggregation, no mutations — a plain `server-only` module (not "use
// server"), the same shape as helpers.ts / queries.ts elsewhere in this
// block.
//
// HONESTY NOTE (surface this wherever these numbers render): a
// ConferenceParticipant row's `durationSeconds` is written on LEAVE /
// `room_finished` (see CLAUDE.md's presence-across-reconnects note) — it is
// not a live meter. A participant still connected when a caller reads this
// has their current span sitting unrecorded in `durationSeconds`; we close
// that gap by adding `now - activeSince` for every row still open, but the
// number returned is still a snapshot taken at read time. A class in
// progress is undercounted until its participants disconnect.

import "server-only"

import { db } from "@/lib/db"

/**
 * The platform's configured LiveKit tier, matching the free-tier numbers
 * documented in RUNBOOK.md ("5,000 WebRTC participant-minutes/month, 100
 * concurrent connections, 1,000 recording minutes"). LiveKit Cloud has no API
 * to ask "what tier am I on" — this is our own record of what was
 * provisioned, overridable via env once a paid or self-hosted tier lands.
 * The RUNBOOK numbers stay the default so an unconfigured deploy still gets
 * an honest comparison instead of no comparison at all.
 */
export const LIVEKIT_TIER = {
  webrtcMinutes: envPositiveInt("LIVEKIT_TIER_WEBRTC_MINUTES", 5000),
  recordingMinutes: envPositiveInt("LIVEKIT_TIER_RECORDING_MINUTES", 1000),
  concurrent: envPositiveInt("LIVEKIT_TIER_CONCURRENT", 100),
} as const

/** Parses an env var as a positive integer; any garbage (missing, zero,
 * negative, non-numeric, fractional) falls back to the RUNBOOK default. */
function envPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

export type SchoolLiveUsage = {
  participantMinutes: number
  recordingMinutes: number
  /** Conference rows (not soft-deleted) scheduled in the window. */
  sessions: number
  /** Participants still connected (activeSince set) at read time — the
   * portion of `participantMinutes` that is still growing. */
  openSpans: number
}

export type PlatformLiveUsageRow = SchoolLiveUsage & {
  schoolId: string
  name: string
  subdomain: string
}

export type PlatformLiveUsage = {
  rows: PlatformLiveUsageRow[]
  totals: SchoolLiveUsage
  tier: typeof LIVEKIT_TIER
  /** Platform totals as a percentage of the configured tier, one decimal. */
  percentOfTier: { webrtc: number; recording: number }
}

/**
 * One school's live-class usage for the calendar month `monthStart` opens.
 * `monthStart` is the half-open lower bound — pass `currentMonthStart()`
 * below (UTC; see its own comment on why this is not school-timezone-aware
 * yet) — and the upper bound is derived from it via `addUtcMonth`.
 *
 * `participantMinutes` = SUM(ConferenceParticipant.durationSeconds) for
 * participants of THIS school (schoolId is denormalized onto the row) whose
 * session's `scheduledStart` falls in `[monthStart, monthEnd)`, plus — for
 * every row with `activeSince` still set — the open span up to `now`.
 *
 * `recordingMinutes` = SUM(ConferenceRecording.durationSeconds) for the same
 * window, INCLUDING rows the retention cron has soft-deleted (`deletedAt`
 * set). Those minutes were still produced by egress and billed by LiveKit;
 * the retention purge must never reset the meter, so `deletedAt` is
 * deliberately NOT filtered here.
 */
export async function getSchoolLiveUsage(
  schoolId: string,
  monthStart: Date,
  now: Date = new Date()
): Promise<SchoolLiveUsage> {
  const monthEnd = addUtcMonth(monthStart)
  const sessionWindow = { scheduledStart: { gte: monthStart, lt: monthEnd } }

  const [participantAgg, openSpanRows, recordingAgg, sessions] =
    await Promise.all([
      db.conferenceParticipant.aggregate({
        where: { schoolId, session: sessionWindow },
        _sum: { durationSeconds: true },
      }),
      // Currently-connected participants: their durationSeconds hasn't been
      // written yet (only happens on leave), so their open span is summed
      // separately and added in below.
      db.conferenceParticipant.findMany({
        where: { schoolId, activeSince: { not: null }, session: sessionWindow },
        select: { activeSince: true },
      }),
      db.conferenceRecording.aggregate({
        where: { schoolId, session: sessionWindow },
        _sum: { durationSeconds: true },
      }),
      db.conference.count({
        where: { schoolId, deletedAt: null, ...sessionWindow },
      }),
    ])

  const openSeconds = openSpanRows.reduce(
    (sum, row) => sum + secondsSince(row.activeSince, now),
    0
  )

  return {
    participantMinutes: secondsToMinutes(
      (participantAgg._sum.durationSeconds ?? 0) + openSeconds
    ),
    recordingMinutes: secondsToMinutes(recordingAgg._sum.durationSeconds ?? 0),
    sessions,
    openSpans: openSpanRows.length,
  }
}

/**
 * Platform-wide usage for the same month, grouped by school — the source for
 * the DEVELOPER observability page. Same accounting as `getSchoolLiveUsage`,
 * summed per `schoolId` instead of scoped to one, plus the school's display
 * name/subdomain, platform totals, and each total's `percentOfTier`.
 */
export async function getPlatformLiveUsage(
  monthStart: Date,
  now: Date = new Date()
): Promise<PlatformLiveUsage> {
  const monthEnd = addUtcMonth(monthStart)
  const sessionWindow = { scheduledStart: { gte: monthStart, lt: monthEnd } }

  const [durationGroups, openSpanRows, recordingGroups, sessionGroups] =
    await Promise.all([
      db.conferenceParticipant.groupBy({
        by: ["schoolId"],
        where: { session: sessionWindow },
        _sum: { durationSeconds: true },
      }),
      db.conferenceParticipant.findMany({
        where: { activeSince: { not: null }, session: sessionWindow },
        select: { schoolId: true, activeSince: true },
      }),
      db.conferenceRecording.groupBy({
        by: ["schoolId"],
        where: { session: sessionWindow },
        _sum: { durationSeconds: true },
      }),
      db.conference.groupBy({
        by: ["schoolId"],
        where: { deletedAt: null, ...sessionWindow },
        _count: { _all: true },
      }),
    ])

  const webrtcSeconds = new Map<string, number>()
  for (const g of durationGroups) {
    webrtcSeconds.set(g.schoolId, g._sum.durationSeconds ?? 0)
  }
  const openSpanCounts = new Map<string, number>()
  for (const p of openSpanRows) {
    webrtcSeconds.set(
      p.schoolId,
      (webrtcSeconds.get(p.schoolId) ?? 0) + secondsSince(p.activeSince, now)
    )
    openSpanCounts.set(p.schoolId, (openSpanCounts.get(p.schoolId) ?? 0) + 1)
  }

  const recordingSeconds = new Map<string, number>()
  for (const g of recordingGroups) {
    recordingSeconds.set(g.schoolId, g._sum.durationSeconds ?? 0)
  }

  const sessionCounts = new Map<string, number>()
  for (const g of sessionGroups) {
    sessionCounts.set(g.schoolId, g._count._all)
  }

  const schoolIds = new Set<string>([
    ...webrtcSeconds.keys(),
    ...recordingSeconds.keys(),
    ...sessionCounts.keys(),
  ])

  const schools = schoolIds.size
    ? await db.school.findMany({
        where: { id: { in: Array.from(schoolIds) } },
        select: { id: true, name: true, domain: true },
      })
    : []
  const schoolById = new Map(schools.map((s) => [s.id, s]))

  const rows: PlatformLiveUsageRow[] = Array.from(schoolIds)
    .map((schoolId) => ({
      schoolId,
      name: schoolById.get(schoolId)?.name ?? schoolId,
      subdomain: schoolById.get(schoolId)?.domain ?? "",
      participantMinutes: secondsToMinutes(webrtcSeconds.get(schoolId) ?? 0),
      recordingMinutes: secondsToMinutes(recordingSeconds.get(schoolId) ?? 0),
      sessions: sessionCounts.get(schoolId) ?? 0,
      openSpans: openSpanCounts.get(schoolId) ?? 0,
    }))
    .sort((a, b) => b.participantMinutes - a.participantMinutes)

  const totals: SchoolLiveUsage = rows.reduce(
    (acc, r) => ({
      participantMinutes: acc.participantMinutes + r.participantMinutes,
      recordingMinutes: acc.recordingMinutes + r.recordingMinutes,
      sessions: acc.sessions + r.sessions,
      openSpans: acc.openSpans + r.openSpans,
    }),
    { participantMinutes: 0, recordingMinutes: 0, sessions: 0, openSpans: 0 }
  )

  return {
    rows,
    totals,
    tier: LIVEKIT_TIER,
    percentOfTier: {
      webrtc: percentOfTier(
        totals.participantMinutes,
        LIVEKIT_TIER.webrtcMinutes
      ),
      recording: percentOfTier(
        totals.recordingMinutes,
        LIVEKIT_TIER.recordingMinutes
      ),
    },
  }
}

/**
 * Start of "this calendar month" for the metering window, in UTC — for both
 * the platform view (no single school timezone to align to) and the
 * per-school view. A school-timezone version was tried and reverted: pairing
 * a LOCAL-midnight start with `addUtcMonth` (below) does not land on the
 * following LOCAL month's start for any non-zero UTC offset — `addUtcMonth`
 * only preserves the UTC day-of-month, so e.g. Khartoum's (UTC+2) March 1
 * 00:00 local (`2026-02-28T22:00Z`) advances to `2026-03-28T22:00Z`
 * (March 29 00:00 local), silently dropping the month's last three days
 * from every query window. Getting this right needs a paired
 * `currentMonthEnd` built the way `schoolEndOfMonth` (src/lib/timezone.ts)
 * is, not a plain +1-UTC-month shift — left for a future pass; UTC boundaries
 * are honest today, just not aligned to a positive-offset school's own
 * midnight (they run ~2-4 hours into the next school day everywhere this
 * app deploys).
 */
export function currentMonthStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function secondsSince(since: Date | null, now: Date): number {
  if (!since) return 0
  const seconds = Math.floor((now.getTime() - since.getTime()) / 1000)
  return seconds > 0 ? seconds : 0
}

function secondsToMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10
}

/** Percentage of `tier`, one decimal, 0 when the tier itself is non-positive
 * (an env override could not turn a valid tier into a divide-by-zero). */
function percentOfTier(value: number, tier: number): number {
  if (tier <= 0) return 0
  return Math.round((value / tier) * 1000) / 10
}

/**
 * Adds one calendar month in UTC terms. Every school timezone this app
 * supports (Khartoum, Riyadh, Dubai) has a fixed UTC offset with no DST, so
 * shifting the instant by one UTC month lands on the same result as
 * `schoolEndOfMonth(tz, monthStart)` would — without this module needing the
 * timezone string too.
 */
function addUtcMonth(instant: Date): Date {
  const next = new Date(instant)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}
