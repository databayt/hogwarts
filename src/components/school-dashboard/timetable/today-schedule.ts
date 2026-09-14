// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Today's timetable for one user, without a web session.
 *
 * The body of `getTodaySchedule` (actions.ts) lifted out so the mobile
 * dashboard reads the very same day: the school's own weekday, confirmed
 * substitutions moving slots between teachers, empty periods filled in, live
 * class join targets and a declared closure. `getTodaySchedule` resolves the
 * session and the term, then calls this; `api/mobile/dashboard` does the same
 * with the bearer token.
 */

import { db } from "@/lib/db"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  schoolDayWindow,
} from "@/components/school-dashboard/live/day-window"
import { findSchoolClosure } from "@/components/school-dashboard/live/school-calendar"

import { attachLiveClasses } from "./live-class-join"

export interface TodayScheduleTerm {
  id: string
  yearId: string
  label: string
}

export async function loadTodaySchedule(input: {
  schoolId: string
  userId: string
  role: string | null | undefined
  /** The active term, or null when the school has none. */
  term: TodayScheduleTerm | null
  date?: Date
}) {
  const { schoolId, userId, role, term } = input

  const targetDate = input.date || new Date()
  // School timezone, not the server's — see the note in getChildTodaySchedule.
  const schoolTz =
    (
      await db.school.findUnique({
        where: { id: schoolId },
        select: { timezone: true },
      })
    )?.timezone || DEFAULT_SCHOOL_TZ
  const dayOfWeek = schoolDayOfWeek(schoolTz, targetDate) // 0 = Sunday

  if (!term) {
    return { schedule: [], dayOfWeek, message: "No active term" }
  }

  // Fetch periods (role-independent) alongside the role-entity lookup so the
  // today-view doesn't pay two serial round-trips on its hottest endpoint.
  const [periods, teacher, student] = await Promise.all([
    db.period.findMany({
      where: { schoolId, yearId: term.yearId },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        isBreak: true,
      },
    }),
    role === "TEACHER"
      ? db.teacher.findFirst({
          where: { userId, schoolId },
          select: { id: true },
        })
      : Promise.resolve(null),
    role === "STUDENT"
      ? db.student.findFirst({
          where: { userId, schoolId },
          select: { id: true, sectionId: true },
        })
      : Promise.resolve(null),
  ])

  // Build filter based on role
  const where: {
    schoolId: string
    termId: string
    dayOfWeek: number
    weekOffset: number
    teacherId?: string
    classId?: string | { in: string[] }
    OR?: Array<Record<string, unknown>>
  } = {
    schoolId,
    termId: term.id,
    dayOfWeek,
    weekOffset: 0,
  }

  if (role === "TEACHER") {
    if (teacher) {
      // A CONFIRMED substitution moves the slot to the substitute's day: they
      // see it, the absent teacher does not. Before this the covering teacher
      // had no card at all, and so no Start button for the online arm.
      const { start, end } = schoolDayWindow(schoolTz, targetDate)
      const subs = await db.substitutionRecord.findMany({
        where: {
          schoolId,
          status: "CONFIRMED",
          slotDate: { gte: start, lt: end },
          OR: [
            { substituteTeacherId: teacher.id },
            { originalTeacherId: teacher.id },
          ],
        },
        select: {
          originalSlotId: true,
          substituteTeacherId: true,
          originalTeacherId: true,
        },
      })
      const covering = subs
        .filter((r) => r.substituteTeacherId === teacher.id)
        .map((r) => r.originalSlotId)
      const away = subs
        .filter((r) => r.originalTeacherId === teacher.id)
        .map((r) => r.originalSlotId)
      where.OR = [
        {
          teacherId: teacher.id,
          ...(away.length ? { id: { notIn: away } } : {}),
        },
        ...(covering.length ? [{ id: { in: covering } }] : []),
      ]
    }
  } else if (role === "STUDENT") {
    if (student) {
      const enrollments = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId },
        select: { classId: true },
      })
      const classIds = enrollments.map((e) => e.classId)
      // Section-based slots (primary) + legacy class enrollments
      const orClauses: Array<Record<string, unknown>> = []
      if (classIds.length > 0) orClauses.push({ classId: { in: classIds } })
      if (student.sectionId) orClauses.push({ sectionId: student.sectionId })
      if (orClauses.length > 0) where.OR = orClauses
    }
  }

  const slots = await db.timetable.findMany({
    where,
    include: {
      class: {
        select: { name: true, subject: { select: { name: true } } },
      },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true } },
      classroom: { select: { roomName: true } },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  // Who is actually teaching each slot today. The weekly grid shows the
  // pattern's teacher; the day's cards show the person in the room.
  const subsBySlot = await substitutesForSlots(
    schoolId,
    schoolTz,
    targetDate,
    slots.map((s) => s.id)
  )

  const schedule = slots.map((slot) => ({
    periodId: slot.periodId,
    periodName: slot.period.name,
    startTime: slot.period.startTime,
    endTime: slot.period.endTime,
    subject:
      slot.subject?.name || slot.class?.subject?.name || slot.class?.name || "",
    className: slot.class?.name || slot.section?.name || "",
    teacher: (() => {
      const sub = subsBySlot.get(slot.id)
      if (sub) return `${sub.firstName} ${sub.lastName}`
      return slot.teacher
        ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
        : ""
    })(),
    room: slot.classroom?.roomName || "",
    // Anchors for live-class matching (section-based slots carry these).
    sectionId: slot.sectionId,
    subjectId: slot.subjectId,
    // Timetable slot id — lets the teacher start a live class from this slot.
    timetableId: slot.id,
    isBreak: false,
  }))

  // Fill in empty periods
  const fullSchedule = periods.map((period) => {
    const existing = schedule.find((s) => s.periodId === period.id)
    if (existing) return existing

    const isBreak = period.isBreak
    return {
      periodId: period.id,
      periodName: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      subject: isBreak ? period.name : "",
      className: "",
      teacher: "",
      room: "",
      sectionId: null,
      subjectId: null,
      timetableId: null,
      isBreak,
    }
  })

  // Attach the Join target (today's session, else the recurring default link)
  // for each entry. Scoped by schoolId + active term.
  const [scheduleWithLiveClasses, closure] = await Promise.all([
    attachLiveClasses(schoolId, term.id, targetDate, fullSchedule),
    // Informs, never blanks. A declared holiday is reported alongside the
    // normal day so the view can say so; the pattern still renders, because
    // ScheduleException rows are hand-entered and a stale one must not take a
    // school's whole timetable away with no explanation. The conference sweep
    // reads the SAME predicate and suppresses — see conference/school-calendar.
    findSchoolClosure(schoolId, schoolTz, targetDate),
  ])

  return {
    schedule: scheduleWithLiveClasses,
    dayOfWeek,
    date: targetDate.toISOString(),
    termLabel: term.label,
    closure,
  }
}

/**
 * CONFIRMED substitutes for these slots on the school day containing `date`,
 * keyed by slot id. `slotDate` is compared as a DAY in the school's zone — the
 * row comes from a date picker, so its instant may sit anywhere in that day.
 */
export async function substitutesForSlots(
  schoolId: string,
  timeZone: string,
  date: Date,
  slotIds: string[]
): Promise<Map<string, { firstName: string; lastName: string }>> {
  const out = new Map<string, { firstName: string; lastName: string }>()
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
      substituteTeacher: { select: { firstName: true, lastName: true } },
    },
  })
  for (const r of rows) out.set(r.originalSlotId, r.substituteTeacher)
  return out
}
