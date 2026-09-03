// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Resolves the "Join live class" target for timetable schedule entries.
// Kept separate from the (huge) actions.ts so it can be unit-tested in
// isolation — it depends only on `db`.

import { db } from "@/lib/db"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  schoolDayWindow,
} from "@/components/school-dashboard/live/day-window"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"

/**
 * Live-class Join info attached to a today-schedule entry. `sessionId` is
 * present only for an actual scheduled session (LiveKit room or external
 * meeting URL); a recurring `ConferenceLink` resolves with
 * `sessionId: null`.
 */
export type LiveClassJoinInfo = {
  sessionId: string | null
  provider: "livekit" | "external"
  meetingUrl: string | null
  status: string | null
}

/**
 * Resolve a Join target for each schedule entry, most specific first:
 *
 *   1. a session anchored to THIS slot today,
 *   2. a session for this (section, subject) today,
 *   3. the stable recurring default link for (section, subject),
 *   4. the section's all-day OPEN ROOM (conference delivery mode `open`).
 *
 * Time-gating (only showing the button in the live window) is the view's
 * responsibility via `isLiveJoinable`.
 *
 * Tenant safety: every query is scoped by the passed `schoolId` (resolved from
 * the request context upstream, never from client input).
 */
export async function attachLiveClasses<
  T extends {
    sectionId?: string | null
    subjectId?: string | null
    timetableId?: string | null
  },
>(
  schoolId: string,
  termId: string,
  date: Date,
  entries: T[]
): Promise<(T & { liveClass: LiveClassJoinInfo | null })[]> {
  const sectionIds = [
    ...new Set(entries.map((e) => e.sectionId).filter(Boolean)),
  ] as string[]
  const subjectIds = [
    ...new Set(entries.map((e) => e.subjectId).filter(Boolean)),
  ] as string[]
  if (sectionIds.length === 0 || subjectIds.length === 0) {
    return entries.map((e) => ({ ...e, liveClass: null }))
  }

  // "Today" means the SCHOOL's calendar day, not the server's. `setHours()`
  // reads the server zone — UTC on Vercel — so for any school whose local day
  // straddles the UTC boundary the window covered the wrong day and the Join
  // button appeared on the wrong date. Same bug class the 2026-08-12 pass
  // fixed for schedule storage; this is the read side of it.
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  const { start: dayStart, end: dayEnd } = schoolDayWindow(
    school?.timezone || DEFAULT_SCHOOL_TZ,
    date
  )

  // Is each of these sections actually online right now? Only tier 3 needs the
  // answer — see the suppression note where it is applied.
  const policies = await resolveOnlinePolicies(schoolId, sectionIds, date)

  const [sessions, openRooms, defaults] = await Promise.all([
    db.conference.findMany({
      where: {
        schoolId,
        sectionId: { in: sectionIds },
        subjectId: { in: subjectIds },
        status: { in: ["scheduled", "live"] },
        // `lt` on an exclusive end — `lte` on a 23:59:59.999 approximation
        // dropped anything scheduled in the final millisecond of the day.
        scheduledStart: { gte: dayStart, lt: dayEnd },
        deletedAt: null,
      },
      select: {
        id: true,
        provider: true,
        meetingUrl: true,
        status: true,
        sectionId: true,
        subjectId: true,
        timetableId: true,
      },
      orderBy: { scheduledStart: "asc" },
    }),
    // The section's OPEN ROOM for today, if the school runs the loose delivery
    // mode. It is deliberately slot-less AND subject-less (see conference
    // `actions/open-room.ts`), so the (section, subject) key above cannot see
    // it — without this query a school on `mode: "open"` has no path from any
    // timetable card to its own room, and /live is its only surface.
    db.conference.findMany({
      where: {
        schoolId,
        sectionId: { in: sectionIds },
        timetableId: null,
        subjectId: null,
        status: { in: ["scheduled", "live"] },
        scheduledStart: { gte: dayStart, lt: dayEnd },
        deletedAt: null,
      },
      select: {
        id: true,
        provider: true,
        meetingUrl: true,
        status: true,
        sectionId: true,
      },
      orderBy: { scheduledStart: "asc" },
    }),
    db.conferenceLink.findMany({
      where: {
        schoolId,
        termId,
        sectionId: { in: sectionIds },
        subjectId: { in: subjectIds },
      },
      select: {
        sectionId: true,
        subjectId: true,
        provider: true,
        meetingUrl: true,
      },
    }),
  ])

  const keyOf = (sec: string, sub: string) => `${sec}:${sub}`
  // Matched by SLOT first. A subject taught twice in one day (a double period,
  // or maths on two periods) yields two sessions under one `section:subject`
  // key, and "earliest today wins" would resolve the afternoon card to the
  // morning session — a Join there writes attendance against the wrong slot's
  // timetableId. Only sessions with no slot anchor (assemblies, ad-hoc
  // tutorials) fall back to the section+subject key.
  const byTimetable = new Map<string, (typeof sessions)[number]>()
  const sessionMap = new Map<string, (typeof sessions)[number]>()
  for (const s of sessions) {
    if (s.timetableId && !byTimetable.has(s.timetableId)) {
      byTimetable.set(s.timetableId, s)
    }
    if (!s.sectionId || !s.subjectId) continue
    const k = keyOf(s.sectionId, s.subjectId)
    if (!sessionMap.has(k)) sessionMap.set(k, s) // earliest today wins
  }
  const defaultMap = new Map<string, (typeof defaults)[number]>()
  for (const d of defaults) defaultMap.set(keyOf(d.sectionId, d.subjectId), d)

  // One open room per section per day; earliest wins if a manual ad-hoc
  // session ever collided with the materializer's key.
  const openBySection = new Map<string, (typeof openRooms)[number]>()
  for (const r of openRooms) {
    if (r.sectionId && !openBySection.has(r.sectionId)) {
      openBySection.set(r.sectionId, r)
    }
  }

  return entries.map((e) => {
    if (!e.sectionId || !e.subjectId) return { ...e, liveClass: null }
    const k = keyOf(e.sectionId, e.subjectId)
    const sess =
      (e.timetableId ? byTimetable.get(e.timetableId) : undefined) ??
      sessionMap.get(k)
    if (sess) {
      return {
        ...e,
        liveClass: {
          sessionId: sess.id,
          provider: sess.provider,
          meetingUrl: sess.meetingUrl,
          status: sess.status,
        },
      }
    }
    // Tier 3 is the one tier NOT backed by a materialized row, so it is the one
    // that can outlive the decision that created it: a school that switches back
    // to `physical` keeps its `ConferenceLink` rows, and without this check every
    // slot of that subject would offer a live room forever. The policy engine is
    // the single source of truth for "is this section online", and it is
    // consulted HERE — inside the shared resolver — rather than in one caller, so
    // the weekly grid, the Today cards and the mobile route can never disagree
    // about whether a class is online.
    //
    // Tiers 1, 2 and 4 are deliberately NOT gated: those are real Conference rows
    // that the materializer only creates per policy, and online is ADDITIVE — a
    // session that already exists stays joinable even if the school flips to
    // physical mid-day. Suppressing a live room someone is sitting in would be
    // the worse failure.
    const def = policies.get(e.sectionId)?.online
      ? defaultMap.get(k)
      : undefined
    if (def) {
      return {
        ...e,
        liveClass: {
          sessionId: null,
          provider: def.provider,
          meetingUrl: def.meetingUrl,
          status: null,
        },
      }
    }
    // Last: the section's all-day open room. Ranked BELOW a per-slot session
    // and below the subject's own link, because both are more specific — the
    // open room is where you go when this particular class has nothing of its
    // own. It resolves for every period of the section's day, which is correct:
    // the room is open for all of them.
    const open = openBySection.get(e.sectionId)
    if (open) {
      return {
        ...e,
        liveClass: {
          sessionId: open.id,
          provider: open.provider,
          meetingUrl: open.meetingUrl,
          status: open.status,
        },
      }
    }
    return { ...e, liveClass: null }
  })
}

/**
 * Build a `timetableId -> "live" | "scheduled"` map for today's Conference
 * sessions, so the weekly grid (`SimpleGrid`) can show a lightweight "live
 * now" / "scheduled today" indicator on the matching slot — independent of
 * `attachLiveClasses` above, which resolves a Join *target* for the
 * section+subject of the current today-schedule entry only (Today cards),
 * not a per-slot map for the full week grid.
 *
 * A slot with no session today (or a session not anchored to a timetable
 * slot, e.g. an ad-hoc conference) has no entry in the returned map.
 *
 * Tenant safety: every query is scoped by the passed `schoolId` (resolved
 * from the request context upstream, never from client input).
 */
export async function getLiveClassIndicators(
  schoolId: string
): Promise<Record<string, "live" | "scheduled">> {
  // School-calendar day, for the same reason as `attachLiveClasses` above.
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  const { start: dayStart, end: dayEnd } = schoolDayWindow(
    school?.timezone || DEFAULT_SCHOOL_TZ
  )

  const sessions = await db.conference.findMany({
    where: {
      schoolId,
      status: { in: ["scheduled", "live"] },
      scheduledStart: { gte: dayStart, lt: dayEnd },
      deletedAt: null,
    },
    select: { timetableId: true, status: true },
    // One school-day of sessions is small, but an online school materializes
    // one per slot per day — bound it so a pathological day can't stream
    // thousands of rows into a map that only feeds grid dots.
    take: 2000,
  })

  const indicators: Record<string, "live" | "scheduled"> = {}
  for (const session of sessions) {
    if (!session.timetableId) continue
    if (indicators[session.timetableId] === "live") continue // live never downgrades to scheduled
    indicators[session.timetableId] =
      session.status === "live" ? "live" : "scheduled"
  }
  return indicators
}

/**
 * Join targets for the WEEKLY grid, keyed by `Timetable.id`.
 *
 * The grid used to receive `getLiveClassIndicators` only — a dot per slot, with
 * no way in — so Join lived exclusively on the Today cards. That was a sound
 * split until the student view became a bare grid with no day list, at which
 * point a student could see that their third period was online and had no route
 * to it. This is the other half: the same resolver the Today rows use, reduced
 * to a map the grid can look a slot up in.
 *
 * TWO invariants, both load-bearing:
 *
 *   1. Only TODAY's slots are passed to `attachLiveClasses`. Its tier 1 (exact
 *      `timetableId`) is day-aware; tiers 2 and 3 are not — tier 2 matches any
 *      of today's sessions for the same (section, subject) and tier 3 is a
 *      standing link with no day at all. Hand it a whole week and Monday's maths
 *      inherits Thursday's session while a standing link stamps every weekday
 *      row of that subject.
 *   2. The day is the SCHOOL's, via `schoolDayOfWeek` — never the server's
 *      `getDay()`, which puts a Sudanese school on the wrong day for the hours
 *      either side of midnight.
 *
 * Because the map only ever holds today's slot ids, a caller needs no day check
 * of its own: a Thursday cell simply misses the map. That also means a day-mode
 * grid showing the NEXT working day (when today is a weekend) is correctly
 * join-free rather than offering a button for a class that is days away.
 */
export async function resolveTodayJoinTargets(
  schoolId: string,
  termId: string,
  slots: Array<{
    id: string
    dayOfWeek: number
    sectionId?: string | null
    subjectId?: string | null
  }>
): Promise<Record<string, LiveClassJoinInfo>> {
  if (slots.length === 0) return {}

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  const now = new Date()
  const today = schoolDayOfWeek(school?.timezone || DEFAULT_SCHOOL_TZ, now)

  const todaySlots = slots.filter((s) => s.dayOfWeek === today)
  if (todaySlots.length === 0) return {}

  const attached = await attachLiveClasses(
    schoolId,
    termId,
    now,
    todaySlots.map((s) => ({
      timetableId: s.id,
      sectionId: s.sectionId ?? null,
      subjectId: s.subjectId ?? null,
    }))
  )

  const map: Record<string, LiveClassJoinInfo> = {}
  for (const row of attached) {
    if (row.liveClass && row.timetableId) map[row.timetableId] = row.liveClass
  }
  return map
}
