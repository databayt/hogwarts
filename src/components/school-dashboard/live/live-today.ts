// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// TODAY's live classes for one school, in one read. Two callers use it:
// - the teaching-mode page's "Ready for today" checklist;
// - the admin/principal dashboard banner ("3 classes live now").
// It is a plain `server-only` module, not "use server". It takes a schoolId the
// caller has already resolved from the session, and must never be exposed as
// an action that accepts one from the client.
//
// The filter matches the sweep's (`materialize-day.ts`): active term, the
// school-calendar day, no breaks, a section and a teacher. So "online today"
// here means the same slots the sweep will open rooms for.

import "server-only"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"

import {
  DEFAULT_SCHOOL_TZ,
  periodWallTime,
  schoolDayOfWeek,
  schoolDayWindow,
} from "./day-window"
import { isLiveKitConfigured } from "./livekit/client"
import { resolveOnlinePolicies } from "./online-policy"

export type LiveTodaySummary = {
  deliveryMode: "physical" | "online" | "hybrid"
  /** In-app rooms can be opened (LiveKit env present). */
  roomsReady: boolean
  /** Teaching slots on today's timetable (any mode). */
  slotsToday: number
  /** Of those, the slots whose section is online by policy today. */
  onlineToday: number
  /** Online slots whose teacher has no login, so nobody can start the class. */
  noTeacherLogin: number
  /** Distinct teachers behind `noTeacherLogin`. */
  teachersWithoutLogin: number
  /** Start of the earliest online slot still to come today, "HH:mm" wall time. */
  nextStart: string | null
  /** Rooms running right now. */
  liveNow: number
  reminderLeadMinutes: number
  recordingDefault: boolean
  attendanceSync: boolean
}

const hhmm = (t: Date) => {
  const { hour, minute } = periodWallTime(t)
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export async function getLiveTodaySummary(
  schoolId: string,
  now: Date = new Date()
): Promise<LiveTodaySummary> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      timezone: true,
      conferenceDeliveryMode: true,
      conferenceReminderLeadMinutes: true,
      conferenceRecordingDefault: true,
      conferenceAttendanceSync: true,
    },
  })
  const tz = school?.timezone || DEFAULT_SCHOOL_TZ
  const base: LiveTodaySummary = {
    deliveryMode: school?.conferenceDeliveryMode ?? "physical",
    roomsReady: isLiveKitConfigured(),
    slotsToday: 0,
    onlineToday: 0,
    noTeacherLogin: 0,
    teachersWithoutLogin: 0,
    nextStart: null,
    liveNow: 0,
    reminderLeadMinutes: school?.conferenceReminderLeadMinutes ?? 10,
    recordingDefault: school?.conferenceRecordingDefault ?? false,
    attendanceSync: school?.conferenceAttendanceSync ?? false,
  }
  if (!school) return base

  const { start, end } = schoolDayWindow(tz, now)
  const [{ term }, liveNow] = await Promise.all([
    resolveActiveTerm(schoolId),
    db.conference.count({
      where: {
        schoolId,
        status: "live",
        scheduledStart: { gte: start, lt: end },
      },
    }),
  ])
  base.liveNow = liveNow
  if (!term) return base

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: term.id,
      dayOfWeek: schoolDayOfWeek(tz, now),
      weekOffset: 0,
      sectionId: { not: null },
      teacherId: { not: null },
      period: { isBreak: false },
    },
    select: {
      sectionId: true,
      teacherId: true,
      teacher: { select: { userId: true } },
      period: { select: { startTime: true, endTime: true } },
    },
  })
  base.slotsToday = slots.length
  if (slots.length === 0 || base.deliveryMode === "physical") return base

  const policies = await resolveOnlinePolicies(
    schoolId,
    slots.map((s) => s.sectionId!),
    now
  )
  const online = slots.filter((s) => policies.get(s.sectionId!)?.online)
  base.onlineToday = online.length

  const orphaned = online.filter((s) => !s.teacher?.userId)
  base.noTeacherLogin = orphaned.length
  base.teachersWithoutLogin = new Set(orphaned.map((s) => s.teacherId)).size

  // Wall-clock comparison in the school's zone: the minute of the day now,
  // against each slot's end.
  const wall = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now)
  const upcoming = online
    .filter((s) => s.period && hhmm(s.period.endTime) > wall)
    .map((s) => hhmm(s.period!.startTime))
    .sort()
  base.nextStart = upcoming[0] ?? null
  return base
}
