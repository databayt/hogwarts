// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getTodaySchedule } from "@/components/school-dashboard/timetable/actions"
import SimpleGrid from "@/components/school-dashboard/timetable/views/simple-grid"

import { SectionHeading } from "./section-heading"

/**
 * The day's classes on the phone dashboard, directly under the next-action
 * banner.
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
 * phone dashboard already opens with a widget that says what today is; a second
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
    <section className="md:hidden">
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

      <SimpleGrid
        slots={day.slots}
        workingDays={[day.dayOfWeek]}
        periods={day.periods}
        isRTL={locale === "ar"}
        viewMode={role === "TEACHER" ? "teacher" : "class"}
        editable={false}
        // The single column IS the day, so the highlight has nothing to
        // contrast against — and tailwind-merge collapses its `bg-primary/5`
        // onto the subject colour rather than over it, greying the day out.
        highlightToday={false}
        // Deliberately NOT passed: `liveIndicators`. The grid's live lamp only
        // lights on the cell it considers current, and that cell is decided by
        // comparing a LOCAL wall clock against UTC-extracted period bounds — on
        // /timetable that is fine, because the grid mounts after a client fetch
        // and is never server-rendered. This card IS server-rendered, and in
        // production the server's local zone is UTC while the reader's is
        // Khartoum, so the two would light different cells and the lamp's label
        // would be a hydration mismatch on every school day. Joining a live
        // class stays on /timetable and /live, where the time gate lives.
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
 * How many days forward the card will look for a day that actually has classes
 * on it.
 *
 * The Sudanese school week runs Sunday to Thursday, so the two-day weekend
 * needs two hops at most; the extra headroom is for a declared holiday sitting
 * against it. The search stops at the FIRST day with classes, so a school day
 * costs exactly one read and only a Friday pays for a second.
 *
 * Falling forward rather than showing an empty weekend is /timetable's own
 * behaviour — `student-view.tsx` picks the next working day for the same
 * reason, and the column header names the day it landed on, so nothing here
 * has to explain itself.
 */
const LOOKAHEAD_DAYS = 4

/** Read the day, then the next few, until one of them has classes. */
async function resolveDay(role: string): Promise<DaySchedule | null> {
  const today = new Date()

  for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)

    const result = await getTodaySchedule(offset === 0 ? undefined : { date })
    // Spread rather than read straight off the union: the no-active-term
    // branch returns `never[]`, and `.map` on `never[] | Row[]` is not
    // callable.
    const rows = [...result.schedule]

    // No periods at all means no term and no school week — looking at
    // tomorrow would ask the same question and get the same answer.
    if (rows.length === 0) return null

    // A declared holiday still returns the day's PATTERN — `getTodaySchedule`
    // informs rather than blanks, and /timetable prints a "school is closed"
    // notice above the grid for exactly this case. This card has no room for a
    // notice, so it treats a closed day the way it treats a weekend and moves
    // on; showing the pattern with nothing saying عيد would be a lie. The `in`
    // guard is for the no-active-term branch of the union, which has no
    // `closure` at all.
    if ("closure" in result && result.closure) continue

    const slots = rows
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
      }))

    if (slots.length === 0) continue

    return {
      dayOfWeek: result.dayOfWeek,
      isToday: offset === 0,
      periods: rows.map((row, i) => ({
        id: row.periodId,
        name: row.periodName,
        order: i,
        startTime: row.startTime,
        endTime: row.endTime,
        isBreak: row.isBreak,
      })),
      slots,
    }
  }

  return null
}
