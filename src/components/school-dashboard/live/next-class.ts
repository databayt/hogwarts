// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Your next class": after a class is over (or its link is dead) the reader
// needs a way forward, not a dead end. Teachers teach back-to-back periods;
// the next one is one tap away.
//
// "Today" and every instant are in the SCHOOL's timezone (`day-window.ts`).
// The slot filters are the timetable's own (`today-schedule.ts`) so a
// confirmed substitute counts as teaching the slot, and a substituted-away
// slot is not the original teacher's.
import "server-only"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { teacherDaySlotFilter } from "@/components/school-dashboard/timetable/today-schedule"

import { combinedPrimaryForSlots } from "./combined"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  schoolDayWindow,
  slotInstantsOn,
} from "./day-window"

export type NextClass = {
  timetableId: string
  subject: string
  section: string
  startsAt: Date
  endsAt: Date
}

export async function loadNextClassToday(input: {
  schoolId: string
  userId: string
  role: string | null | undefined
  now?: Date
  /** The slot the reader is leaving — never offered back. */
  afterTimetableId?: string | null
}): Promise<NextClass | null> {
  const { schoolId, userId, role, afterTimetableId } = input
  if (role !== "TEACHER" && role !== "STUDENT") return null
  const now = input.now ?? new Date()

  const [school, { term }] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { timezone: true },
    }),
    resolveActiveTerm(schoolId),
  ])
  if (!term) return null
  const timeZone = school?.timezone || DEFAULT_SCHOOL_TZ

  const where: {
    schoolId: string
    termId: string
    dayOfWeek: number
    weekOffset: number
    sectionId: { not: null }
    OR?: Array<Record<string, unknown>>
  } = {
    schoolId,
    termId: term.id,
    dayOfWeek: schoolDayOfWeek(timeZone, now),
    weekOffset: 0,
    sectionId: { not: null },
  }

  if (role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!teacher) return null
    where.OR = await teacherDaySlotFilter(schoolId, teacher.id, timeZone, now)
  } else {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { sectionId: true },
    })
    if (!student?.sectionId) return null
    where.OR = [{ sectionId: student.sectionId }]
  }

  const slots = await db.timetable.findMany({
    where,
    select: {
      id: true,
      section: { select: { name: true } },
      subject: { select: { name: true } },
      period: { select: { startTime: true, endTime: true, isBreak: true } },
    },
  })

  const timed = slots
    .filter((s) => s.period && !s.period.isBreak)
    .flatMap((s) => {
      const at = slotInstantsOn(timeZone, now, s.period)
      if (!at || at.scheduledEnd.getTime() <= now.getTime()) return []
      return [{ slot: s, at }]
    })
    .sort(
      (a, b) => a.at.scheduledStart.getTime() - b.at.scheduledStart.getTime()
    )
  if (timed.length === 0) return null

  // A combined class (one teacher, several sections, one period) is ONE class
  // with ONE room, owned by its primary slot — and each section still has a
  // slot of its own. Without this a teacher leaving the G12 science room was
  // offered the G12 arts slot of the very class she had just taught, and a
  // student of the second section was offered the class they were leaving.
  // So every slot is judged by the slot that owns its room.
  const primaries = await combinedPrimaryForSlots(
    schoolId,
    [
      ...timed.map((c) => c.slot.id),
      ...(afterTimetableId ? [afterTimetableId] : []),
    ],
    now
  )
  const roomSlot = (id: string) => primaries.get(id) ?? id
  const leaving = afterTimetableId ? roomSlot(afterTimetableId) : null
  const candidates = timed.filter((c) => roomSlot(c.slot.id) !== leaving)
  if (candidates.length === 0) return null

  // ONE read for every candidate's day row, not one per slot.
  const { start, end } = schoolDayWindow(timeZone, now)
  const decided = await db.conference.findMany({
    where: {
      schoolId,
      timetableId: {
        in: [...new Set(candidates.map((c) => roomSlot(c.slot.id)))],
      },
      status: { in: ["ended", "cancelled"] },
      scheduledStart: { gte: start, lt: end },
      deletedAt: null,
    },
    select: { timetableId: true },
  })
  const done = new Set(decided.map((d) => d.timetableId))

  const next = candidates.find((c) => !done.has(roomSlot(c.slot.id)))
  if (!next) return null
  return {
    timetableId: next.slot.id,
    subject: next.slot.subject?.name ?? "",
    section: next.slot.section?.name ?? "",
    startsAt: next.at.scheduledStart,
    endsAt: next.at.scheduledEnd,
  }
}
