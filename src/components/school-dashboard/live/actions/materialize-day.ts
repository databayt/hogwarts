// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Turn the whole school online" — the materialization sweep.
//
// A school that teaches online declares INTENT (School.conferenceOnlineDefault,
// the temporary conferenceOnlineFrom/Until window, and the per-section
// Section.conferenceOnline override); this turns that intent into the actual
// sessions for ONE school day. Deliberately a day at a time: a term's
// timetable is a weekly pattern, so pre-creating a row per slot per week would
// be thousands of guesses per term, every one of them invalidated by a
// cancelled class or a changed slot. A day's worth is ~120 rows for a
// 15-section school.
//
// Rows must exist BEFORE anyone clicks, which is the whole reason this is a
// sweep rather than lazy creation on join: the reminder cron, the "scheduled
// today" dot on the weekly grid, and the class-scheduled notification all read
// `scheduled` rows. Lazy creation would light them up only after the teacher
// had already started the class — too late to be a reminder.
//
// Two delivery modes, both handled here (see ConferenceOnlineMode):
//   timetable — one session per slot, bounded by the period's times.
//   open      — one loose all-day room per section, no period boundaries.
import "server-only"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"

import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  schoolDayWindow,
} from "../day-window"
import {
  deliversOpenRoom,
  deliversTimetable,
  effectivePolicy,
  ONLINE_POLICY_SELECT,
  resolveOnlinePolicies,
} from "../online-policy"
import { isSchoolClosedOn } from "../school-calendar"
import { materializeOpenRoom, openRoomWindow } from "./open-room"
import { materializeSlotSession } from "./slot-session"

/** Slots examined per school per run. A 15-section day is ~120. */
const MAX_SLOTS_PER_SCHOOL = 500

/** Sections given an open room per run. */
const MAX_OPEN_ROOMS_PER_SCHOOL = 300

export type MaterializeDayResult = {
  created: number
  skipped: number
  /** Slots dropped because the cap was hit — never truncate silently. */
  truncated: number
  reasons: Record<string, number>
}

const EMPTY: MaterializeDayResult = {
  created: 0,
  skipped: 0,
  truncated: 0,
  reasons: {},
}

function bump(result: MaterializeDayResult, reason: string): void {
  result.skipped++
  result.reasons[reason] = (result.reasons[reason] ?? 0) + 1
}

/**
 * Materialize every online class for one school on one day — slot sessions,
 * the open room, or both, according to the school's delivery mode.
 *
 * Idempotent: each writer re-checks per (anchor, school day) against every
 * DECIDED status, so running this every 15 minutes creates each session
 * exactly once AND leaves a hand-cancelled class cancelled instead of
 * resurrecting it on the next tick.
 */
export async function materializeSchoolDay(
  schoolId: string,
  date: Date = new Date()
): Promise<MaterializeDayResult> {
  const school = await loadSchool(schoolId)
  if (!school) return EMPTY

  const timeZone = school.timezone || DEFAULT_SCHOOL_TZ

  // Nothing is online on a day the school has declared closed. Checked before
  // the term lookup because a holiday costs one indexed query and short-
  // circuits the whole sweep for that school.
  if (await isSchoolClosedOn(schoolId, timeZone, date)) {
    return { ...EMPTY, reasons: { holiday: 1 } }
  }

  const { term } = await resolveActiveTerm(schoolId)
  if (!term) return EMPTY

  const result: MaterializeDayResult = {
    created: 0,
    skipped: 0,
    truncated: 0,
    reasons: {},
  }

  // The delivery mode is a school-level setting, so a school that is online
  // only through per-section overrides still uses the school's mode. Read the
  // stored column directly rather than a resolved policy's `mode`, which is
  // pinned to `timetable` whenever that particular answer came back offline.
  const mode = school.conferenceOnlineMode

  if (deliversTimetable(mode)) {
    await materializeSlots(schoolId, timeZone, date, term.id, school, result)
  }
  if (deliversOpenRoom(mode)) {
    await materializeOpenRooms(
      schoolId,
      timeZone,
      date,
      term.id,
      school,
      result
    )
  }

  return result
}

/**
 * The School columns the sweep needs: everything the policy resolver reads,
 * plus the recording default, the storage language, and the standing fallback
 * link. Derived from the query so the two can never drift.
 */
async function loadSchool(schoolId: string) {
  return db.school.findUnique({
    where: { id: schoolId },
    select: {
      ...ONLINE_POLICY_SELECT,
      preferredLanguage: true,
      conferenceRecordingDefault: true,
      conferenceFallbackUrl: true,
    },
  })
}

type LoadedSchool = NonNullable<Awaited<ReturnType<typeof loadSchool>>>

async function materializeSlots(
  schoolId: string,
  timeZone: string,
  date: Date,
  termId: string,
  school: LoadedSchool,
  result: MaterializeDayResult
): Promise<void> {
  // Mirror `getTodaySchedule`'s slot filter exactly (weekOffset 0 + dayOfWeek),
  // so the sweep can never disagree with what the timetable actually shows.
  // `rotationWeek` is deliberately ignored: no read path in the app resolves
  // an A/B rotation today — it is template-only metadata — and inventing a
  // resolution here would put sessions on days the timetable doesn't show.
  const dayOfWeek = schoolDayOfWeek(timeZone, date)
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId,
      dayOfWeek,
      weekOffset: 0,
      // An online class needs a roster to invite and a host to run it.
      sectionId: { not: null },
      teacherId: { not: null },
      // Never infer break-ness from Period.name — `isBreak` is the source of
      // truth (an Arabic «فسحة» reads as teaching time to a name check).
      period: { isBreak: false },
    },
    select: {
      id: true,
      teacherId: true,
      sectionId: true,
      subjectId: true,
      subject: { select: { name: true } },
      section: { select: { name: true, conferenceRecordingOptOut: true } },
      teacher: { select: { userId: true } },
      period: { select: { startTime: true, endTime: true } },
    },
    // By start time, not periodId (a cuid — arbitrary): if the cap ever bites,
    // it must drop the END of the day, deterministically.
    orderBy: [{ period: { startTime: "asc" } }],
    take: MAX_SLOTS_PER_SCHOOL + 1,
  })

  result.truncated += Math.max(0, slots.length - MAX_SLOTS_PER_SCHOOL)
  const todays = slots.slice(0, MAX_SLOTS_PER_SCHOOL)
  if (todays.length === 0) return

  // A confirmed substitute HOSTS the online arm of the class they are covering.
  // Before this the session was always minted for the ORIGINAL teacher, so the
  // one day a class most needs its online channel — the teacher is out — the
  // substitute physically in the room could neither start nor host it.
  // Keyed by slot on the school-calendar day; CONFIRMED only, because a
  // pending request is still the absent teacher's class on paper.
  const substitutes = await resolveSubstitutes(
    schoolId,
    timeZone,
    date,
    todays.map((s) => s.id)
  )

  const sectionIds = todays
    .map((s) => s.sectionId)
    .filter((id): id is string => Boolean(id))

  const [policies, links] = await Promise.all([
    resolveOnlinePolicies(schoolId, sectionIds, date),
    // The recurring "set once & reuse" link is where an external online class
    // gets its meeting URL — the same row the timetable Join button already
    // falls back to.
    db.conferenceLink.findMany({
      where: { schoolId, termId, sectionId: { in: sectionIds } },
      select: {
        sectionId: true,
        subjectId: true,
        meetingUrl: true,
        meetingProvider: true,
      },
    }),
  ])

  const linkFor = new Map(
    links.map((l) => [`${l.sectionId}:${l.subjectId}`, l])
  )

  for (const slot of todays) {
    if (!slot.sectionId || !slot.teacherId) continue
    const policy = policies.get(slot.sectionId)
    if (!policy?.online) {
      bump(result, "not_online")
      continue
    }

    const link = linkFor.get(`${slot.sectionId}:${slot.subjectId}`)
    const sub = substitutes.get(slot.id)
    if (sub) bump(result, "substituted")
    try {
      const outcome = await materializeSlotSession(
        {
          id: slot.id,
          teacherId: sub?.teacherId ?? slot.teacherId,
          sectionId: slot.sectionId,
          subjectId: slot.subjectId,
          subjectName: slot.subject?.name ?? null,
          sectionName: slot.section?.name ?? null,
          teacherUserId: sub ? sub.userId : (slot.teacher?.userId ?? null),
          period: slot.period,
        },
        {
          schoolId,
          timeZone,
          date,
          policy,
          recordingEnabled:
            school.conferenceRecordingDefault &&
            !(slot.section?.conferenceRecordingOptOut ?? false),
          // Per-section link first, the school's standing fallback second.
          // Without the fallback a school that flips online overnight
          // materializes NOTHING — every pair skips with `no_link` and the
          // only trace is a cron log.
          meetingUrl: link?.meetingUrl ?? school.conferenceFallbackUrl ?? null,
          meetingProvider: link?.meetingProvider ?? null,
          lang: school.preferredLanguage ?? "ar",
        }
      )
      if (outcome.created) {
        result.created++
      } else {
        bump(result, outcome.reason)
      }
    } catch (err) {
      // One bad slot must not abort the sweep for the rest of the school.
      bump(result, "error")
      console.error("[conference] materializeSlotSession failed", {
        schoolId,
        timetableId: slot.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }
}

/**
 * CONFIRMED substitutions for these slots on the school day containing `date`,
 * keyed by slot id. `slotDate` is compared as a day in the school's zone —
 * the row is written from a date picker, so its instant may sit anywhere in
 * that day depending on who saved it and from where.
 */
export async function resolveSubstitutes(
  schoolId: string,
  timeZone: string,
  date: Date,
  slotIds: string[]
): Promise<Map<string, { teacherId: string; userId: string | null }>> {
  const out = new Map<string, { teacherId: string; userId: string | null }>()
  if (slotIds.length === 0) return out
  const { start, end } = schoolDayWindow(timeZone, date)
  const rows = await db.substitutionRecord.findMany({
    where: {
      schoolId,
      originalSlotId: { in: slotIds },
      status: "CONFIRMED",
      slotDate: { gte: start, lt: end },
    },
    select: {
      originalSlotId: true,
      substituteTeacherId: true,
      substituteTeacher: { select: { userId: true } },
    },
  })
  for (const r of rows) {
    out.set(r.originalSlotId, {
      teacherId: r.substituteTeacherId,
      userId: r.substituteTeacher?.userId ?? null,
    })
  }
  return out
}

/** The teacher with the most slots on a section this term — the open room's host of last resort. */
function fallbackHost(
  slots:
    | undefined
    | Array<{
        teacherId: string | null
        teacher: { userId: string | null } | null
      }>
): { teacherId: string; userId: string | null } | null {
  const tally = new Map<string, { n: number; userId: string | null }>()
  for (const s of slots ?? []) {
    if (!s.teacherId) continue
    const cur = tally.get(s.teacherId) ?? {
      n: 0,
      userId: s.teacher?.userId ?? null,
    }
    cur.n++
    tally.set(s.teacherId, cur)
  }
  let best: { teacherId: string; userId: string | null; n: number } | null =
    null
  for (const [teacherId, { n, userId }] of tally) {
    if (!best || n > best.n || (n === best.n && teacherId < best.teacherId)) {
      best = { teacherId, userId, n }
    }
  }
  return best ? { teacherId: best.teacherId, userId: best.userId } : null
}

async function materializeOpenRooms(
  schoolId: string,
  timeZone: string,
  date: Date,
  termId: string,
  school: LoadedSchool,
  result: MaterializeDayResult
): Promise<void> {
  const term = await db.term.findFirst({
    where: { id: termId, schoolId },
    select: { yearId: true },
  })

  const [sections, periods] = await Promise.all([
    db.section.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        conferenceOnline: true,
        grade: { select: { conferenceOnline: true } },
        conferenceRecordingOptOut: true,
        homeroomTeacherId: true,
        homeroomTeacher: { select: { userId: true } },
        // Fallback host when no homeroom teacher is set: whoever teaches this
        // section most this term. `autoProvisionSections` (the real onboarding
        // path) never writes `homeroomTeacherId` and no UI does either, so
        // without this every real school's `open` mode materialized zero rooms
        // and said so only in a cron log. Deterministic — most slots, then id.
        timetables: {
          where: { schoolId, termId, teacherId: { not: null } },
          select: { teacherId: true, teacher: { select: { userId: true } } },
        },
      },
      orderBy: { name: "asc" },
      take: MAX_OPEN_ROOMS_PER_SCHOOL + 1,
    }),
    term
      ? db.period.findMany({
          where: { schoolId, yearId: term.yearId, isBreak: false },
          select: { startTime: true, endTime: true },
        })
      : Promise.resolve([]),
  ])

  result.truncated += Math.max(0, sections.length - MAX_OPEN_ROOMS_PER_SCHOOL)
  const todays = sections.slice(0, MAX_OPEN_ROOMS_PER_SCHOOL)
  if (todays.length === 0) return

  const { start: dayStart, end: dayEnd } = openRoomWindow(
    timeZone,
    date,
    periods
  )

  for (const section of todays) {
    const policy = effectivePolicy(
      school,
      section.conferenceOnline,
      date,
      section.grade?.conferenceOnline ?? null
    )
    if (!policy.online) {
      bump(result, "not_online")
      continue
    }
    try {
      const outcome = await materializeOpenRoom(
        {
          id: section.id,
          name: section.name,
          // Homeroom teacher when set; otherwise whoever teaches the section
          // most. Both halves of the host must come from the SAME choice.
          ...(() => {
            const host = section.homeroomTeacherId
              ? {
                  teacherId: section.homeroomTeacherId,
                  userId: section.homeroomTeacher?.userId ?? null,
                }
              : fallbackHost(section.timetables)
            return {
              homeroomTeacherId: host?.teacherId ?? null,
              homeroomTeacherUserId: host?.userId ?? null,
            }
          })(),
          conferenceRecordingOptOut: section.conferenceRecordingOptOut,
        },
        {
          schoolId,
          timeZone,
          date,
          policy,
          recordingEnabled:
            school.conferenceRecordingDefault &&
            !section.conferenceRecordingOptOut,
          // An open room has no subject, so `ConferenceLink` (keyed on
          // subject) cannot supply one. The school's standing link is the
          // only external source.
          meetingUrl: school.conferenceFallbackUrl ?? null,
          meetingProvider: null,
          lang: school.preferredLanguage ?? "ar",
          dayStart,
          dayEnd,
        }
      )
      if (outcome.created) {
        result.created++
      } else {
        bump(result, `open_${outcome.reason}`)
      }
    } catch (err) {
      bump(result, "error")
      console.error("[conference] materializeOpenRoom failed", {
        schoolId,
        sectionId: section.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }
}

/** Schools per sweep. Raise with the cron's budget, never silently. */
const MAX_SCHOOLS_PER_RUN = 100

/** How long an expired window keeps a school in the candidate set. */
const WINDOW_GRACE_MS = 48 * 60 * 60 * 1000

/**
 * Every school that might be online today — school-wide, through at least one
 * section or grade override, or inside a temporary "go online" window. A
 * school with none of the four is never touched.
 *
 * The window arm is deliberately COARSE (any school with a start date and no
 * long-expired end date), because window activeness depends on the school's
 * own timezone and only `materializeSchoolDay` knows it. The `until` grace
 * keeps a school that once had a closure two years ago from occupying a slot
 * in the cap forever — without it, expired windows would crowd out schools
 * that are genuinely online today.
 */
export async function materializeOnlineSchools(
  date: Date = new Date()
): Promise<{
  schools: number
  created: number
  skipped: number
  truncated: number
}> {
  const graceFloor = new Date(date.getTime() - WINDOW_GRACE_MS)
  const schools = await db.school.findMany({
    where: {
      OR: [
        { conferenceOnlineDefault: true },
        { sections: { some: { conferenceOnline: true } } },
        // The per-grade override (hybrid mode: section ?? GRADE ?? school).
        // Shipped 2026-08-30 without this arm, so a school online through a
        // grade alone was never a candidate and never swept — the same
        // failure the window arm below guards against.
        { academicGrades: { some: { conferenceOnline: true } } },
        {
          conferenceOnlineFrom: { not: null },
          OR: [
            { conferenceOnlineUntil: null },
            { conferenceOnlineUntil: { gte: graceFloor } },
          ],
        },
      ],
    },
    select: { id: true },
    take: MAX_SCHOOLS_PER_RUN + 1,
  })
  if (schools.length > MAX_SCHOOLS_PER_RUN) {
    console.warn("[conference] online-school sweep truncated", {
      seen: schools.length,
      cap: MAX_SCHOOLS_PER_RUN,
    })
  }

  const totals = { schools: 0, created: 0, skipped: 0, truncated: 0 }
  for (const s of schools.slice(0, MAX_SCHOOLS_PER_RUN)) {
    const r = await materializeSchoolDay(s.id, date)
    totals.schools++
    totals.created += r.created
    totals.skipped += r.skipped
    totals.truncated += r.truncated
  }
  return totals
}
