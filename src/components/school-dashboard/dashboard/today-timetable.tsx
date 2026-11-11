// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  DEFAULT_SCHOOL_TZ,
  slotInstantsOn,
} from "@/components/school-dashboard/live/day-window"
import { joinWindow } from "@/components/school-dashboard/live/join-window"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"
import { getTodaySchedule } from "@/components/school-dashboard/timetable/actions"
import { resolveScheduleDay } from "@/components/school-dashboard/timetable/resolve-schedule-day"

import { SectionHeading } from "./section-heading"
import { TodayGrid } from "./today-grid"
import { type TodayJoinRow } from "./today-join-strip"

/**
 * The day's classes on the dashboard, at every width: under the next-action
 * banner on a phone, a full row under the app grid from `md` up (where a
 * separate "Today" card stood until 2026-11-11 — the same day in a second
 * shape, with its own idea of what a row looks like).
 *
 * It is /timetable's own day mode, not a second timetable: the SAME `SimpleGrid`
 * the student surface renders, narrowed to one day column beside the period
 * column. Nothing here re-implements a cell, a break row or a time label — a
 * grid that drifted from the real one would be worse than no grid, because the
 * reader would learn to distrust both.
 *
 * WHO GETS IT is the whole design. `getTodaySchedule` filters by role for
 * STUDENT (their sections) and TEACHER (their slots, substitutions included),
 * and for every other role it returns the school's ENTIRE day unfiltered — of
 * which the action then keeps whichever slot happens to sort first per period.
 * That is an arbitrary class, not "the school's day", so an admin, an
 * accountant or a staff member gets nothing rather than a plausible-looking
 * lie. /timetable makes the same call: only the student surface offers a
 * week/day toggle at all.
 *
 * Best-effort, like its neighbour `next-action.tsx` — a failed read, a school
 * with no periods configured, or a week with nothing on it renders nothing. The
 * dashboard already opens with a widget that says what today is; a second
 * empty state under it would be the same silence twice.
 */
export async function TodayTimetable({
  locale,
  dictionary,
}: {
  locale: string
  dictionary?: Dictionary["school"]
}) {
  let role: string
  let day: DaySchedule | null

  try {
    const session = await auth()
    role = (session?.user?.role || "").toUpperCase()
    if (role !== "STUDENT" && role !== "TEACHER") return null
    day = await resolveDay(role)
  } catch (error) {
    console.error("[TodayTimetable] Error loading the day's schedule:", error)
    return null
  }

  if (!day) return null

  const d = dictionary?.timetable
  const labels = dictionary?.dashboard?.todaySchedule

  return (
    // From `md` up it is a full row of the dashboard's app grid, ordered after
    // the quick-action tiles: those are grid items too (`contents`), and a
    // full-width row between them and the home cluster would push them a row
    // down, out from beside the calendar widget.
    <section className="md:order-last md:col-span-full md:mt-3">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <SectionHeading
          title={
            day.isToday
              ? labels?.title || "Today's classes"
              : labels?.next || "Next classes"
          }
          className="mb-0"
        />
        <Link
          href={`/${locale}/timetable`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          {labels?.viewAll || "Full timetable"}
        </Link>
      </div>

      <TodayGrid
        slots={day.slots}
        periods={day.periods}
        dayOfWeek={day.dayOfWeek}
        // Empty on a fallen-forward day: nothing there is joinable.
        joinRows={day.isToday ? day.joinRows : []}
        lang={locale as Locale}
        viewMode={role === "TEACHER" ? "teacher" : "class"}
        labels={{
          join:
            dictionary?.liveClasses?.join ??
            (locale === "ar" ? "انضمام" : "Join"),
          liveNow: d?.liveNow ?? (locale === "ar" ? "مباشر الآن" : "Live now"),
        }}
        dictionary={{
          period: d?.period,
          break: d?.break,
          days: d?.dayNames,
          conflict: d?.conflict,
          liveNow: d?.liveNow,
          scheduledToday: dictionary?.liveClasses?.status?.scheduled,
        }}
      />
    </section>
  )
}

interface DaySchedule {
  dayOfWeek: number
  isToday: boolean
  /** Today's classes that are online (a room, or the policy) — the strip's
   *  candidates. Empty on a fallen-forward day: nothing there is joinable. */
  joinRows: TodayJoinRow[]
  periods: Array<{
    id: string
    name: string
    order: number
    startTime: Date | string
    endTime: Date | string
    isBreak: boolean
  }>
  slots: Array<{
    id: string
    dayOfWeek: number
    periodId: string
    subject: string
    teacher: string
    room: string
    sectionName?: string
  }>
}

/**
 * Read the day, then the next few, until one of them has classes.
 *
 * The walk itself is `resolveScheduleDay` — shared with the mobile dashboard's
 * `today_timetable`, so the phone web card and the app land on the same day.
 * Falling forward rather than showing an empty weekend is /timetable's own
 * behaviour — `student-view.tsx` picks the next working day for the same
 * reason, and the column header names the day it landed on, so nothing here
 * has to explain itself.
 */
async function resolveDay(role: string): Promise<DaySchedule | null> {
  const { resolved } = await resolveScheduleDay((date) =>
    getTodaySchedule(date ? { date } : undefined)
  )
  if (!resolved) return null

  const { day: result, isToday } = resolved
  // Spread rather than read straight off the union: the no-active-term
  // branch returns `never[]`, and `.map` on `never[] | Row[]` is not
  // callable.
  const rows = [...result.schedule]

  // Which of today's classes are online: a room already exists, or the
  // section's policy says so (the join link writes the room on the tap).
  let joinRows: TodayJoinRow[] = []
  if (isToday) {
    const { schoolId } = await getTenantContext()
    const sectionIds = rows
      .map((row) => row.sectionId)
      .filter((id): id is string => !!id)
    const [policies, school] = await Promise.all([
      schoolId && sectionIds.length > 0
        ? resolveOnlinePolicies(schoolId, sectionIds)
        : Promise.resolve(new Map()),
      schoolId
        ? db.school.findUnique({
            where: { id: schoolId },
            select: { timezone: true, conferenceReminderLeadMinutes: true },
          })
        : Promise.resolve(null),
    ])
    const tz = school?.timezone || DEFAULT_SCHOOL_TZ
    const now = new Date()
    joinRows = rows
      .filter(
        (row) =>
          row.timetableId &&
          !row.isBreak &&
          (row.liveClass ||
            (row.sectionId && policies.get(row.sectionId)?.online))
      )
      .flatMap((row) => {
        // The join window as INSTANTS, in the school's zone — the strip
        // compares it with `Date.now()`, right on any device clock.
        const at = slotInstantsOn(tz, now, {
          startTime: new Date(row.startTime),
          endTime: new Date(row.endTime),
        })
        if (!at) return []
        const w = joinWindow({
          startMs: at.scheduledStart.getTime(),
          endMs: at.scheduledEnd.getTime(),
          leadMinutes: school?.conferenceReminderLeadMinutes ?? null,
          isHost: false,
        })
        return [
          {
            timetableId: row.timetableId as string,
            subject: row.subject,
            fromMs: w.opensAtMs,
            untilMs: w.closesAtMs,
            live: row.liveClass?.status === "live",
          },
        ]
      })
  }

  return {
    dayOfWeek: result.dayOfWeek,
    isToday,
    joinRows,
    periods: rows.map((row, i) => ({
      id: row.periodId,
      name: row.periodName,
      order: i,
      startTime: row.startTime,
      endTime: row.endTime,
      isBreak: row.isBreak,
    })),
    slots: rows
      .filter((row) => row.timetableId)
      .map((row) => ({
        id: row.timetableId as string,
        dayOfWeek: result.dayOfWeek,
        periodId: row.periodId,
        subject: row.subject,
        teacher: row.teacher,
        room: row.room,
        // A teacher already knows who is teaching; what they need beside the
        // subject is which section walks in. `viewMode="teacher"` reads this.
        sectionName: role === "TEACHER" ? row.className : undefined,
      })),
  }
}
