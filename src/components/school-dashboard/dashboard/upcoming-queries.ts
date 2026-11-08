// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Upcoming-data loaders behind the dashboard's Upcoming card and the phone
 * next-action banner — keyed by (userId, schoolId, role) instead of the web
 * session, so the mobile dashboard route reads the exact same payload
 * `rankNextActions` ranks on the web.
 *
 * Plain module on purpose (no "use server"): `actions.ts` wraps these with the
 * session, `api/mobile/dashboard` wraps them with the bearer token.
 */

import { subDays } from "date-fns"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { studentAudienceWhere } from "@/lib/teaching-audience"
import { getStudentScopes, getTeacherPairs } from "@/lib/teaching-scope"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { teacherAssignmentsWhere } from "@/components/school-dashboard/listings/assignments/queries"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  slotInstantsOn,
} from "@/components/school-dashboard/live/day-window"
import { joinWindow } from "@/components/school-dashboard/live/join-window"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"
import { attachLiveClasses } from "@/components/school-dashboard/timetable/live-class-join"
import { teacherDaySlotFilter } from "@/components/school-dashboard/timetable/today-schedule"

import type { EmergencyAlert } from "./actions"

/**
 * Upcoming data for a role. PRINCIPAL is not a stored role and stays in
 * `actions.ts` (its alerts read compliance + finance through the session).
 */
export async function loadUpcomingData(
  userId: string,
  schoolId: string,
  role: string
) {
  switch (role.toUpperCase()) {
    case "STUDENT":
      return getStudentUpcomingData(userId, schoolId)
    case "TEACHER":
      return getTeacherUpcomingData(userId, schoolId)
    case "GUARDIAN":
      return getParentUpcomingData(userId, schoolId)
    case "STAFF":
      return getStaffUpcomingData(userId, schoolId)
    case "ACCOUNTANT":
      return getAccountantUpcomingData(schoolId)
    case "ADMIN":
    case "DEVELOPER":
    default:
      return getAdminUpcomingData(schoolId)
  }
}

/** Minutes before a period's start that its live room counts as "now". */
type TodaySlot = {
  id: string
  termId: string
  sectionId: string | null
  subjectId: string | null
  period: { startTime: Date; endTime: Date } | null
}

/** What the banner knows about the class happening now or next. */
type NextSlot<T> = {
  slot: T
  /** Today's room, when one exists already (kept for the mobile payload). */
  live: { sessionId: string } | null
  /** The class can be joined through its join link today — a room exists,
   *  or the section is online by policy and the link will open one. */
  joinable: boolean
  /** The join window, as instants: when Join opens and when it closes. The
   *  client re-ranks against its own clock, so "next class" turns into "live —
   *  join" at the opening instant without a reload. */
  window: { fromMs: number; untilMs: number } | null
}

/**
 * The class happening now or next, by the SCHOOL's clock — and whether it can
 * be joined. `nextClass` used to be the day's FIRST slot (no time filter, and
 * the server's `getDay()`), so at 11:00 the card still said period 1. The live
 * half used to need a real session row AND the server clock inside ten minutes
 * of the start; a school on a standing link, or a class whose row the sweep
 * had not written yet, never got a banner Join, and a banner rendered at 07:40
 * still said "next class" at 08:05. Now it reports the policy too, and the
 * WINDOW, and the client decides when it is open.
 */
async function currentOrNextSlot<T extends TodaySlot>(
  schoolId: string,
  school: SchoolClock,
  now: Date,
  slots: T[],
  isHost: boolean
): Promise<NextSlot<T> | null> {
  const tz = school.timezone
  const timed = slots
    .map((slot) => ({
      slot,
      at: slot.period ? slotInstantsOn(tz, now, slot.period) : null,
    }))
    .filter((x) => x.at && x.at.scheduledEnd.getTime() > now.getTime())
    .sort(
      (a, b) => a.at!.scheduledStart.getTime() - b.at!.scheduledStart.getTime()
    )
  const pick = timed[0]
  if (!pick) return null

  const [attached, policies] = await Promise.all([
    attachLiveClasses(
      schoolId,
      pick.slot.termId,
      now,
      [
        {
          timetableId: pick.slot.id,
          sectionId: pick.slot.sectionId,
          subjectId: pick.slot.subjectId,
        },
      ],
      tz
    ),
    pick.slot.sectionId
      ? resolveOnlinePolicies(schoolId, [pick.slot.sectionId], now)
      : Promise.resolve(new Map()),
  ])
  const room = attached[0]?.liveClass ?? null
  const online = pick.slot.sectionId
    ? Boolean(policies.get(pick.slot.sectionId)?.online)
    : false
  const w = joinWindow({
    startMs: pick.at!.scheduledStart.getTime(),
    endMs: pick.at!.scheduledEnd.getTime(),
    leadMinutes: school.leadMinutes,
    isHost,
  })
  return {
    slot: pick.slot,
    live: room?.sessionId ? { sessionId: room.sessionId } : null,
    joinable: Boolean(room) || online,
    window: { fromMs: w.opensAtMs, untilMs: w.closesAtMs },
  }
}

type SchoolClock = {
  timezone: string
  leadMinutes: number | null
  guardiansObserve: boolean
}

async function schoolClock(schoolId: string): Promise<SchoolClock> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      timezone: true,
      conferenceReminderLeadMinutes: true,
      conferenceGuardiansObserve: true,
    },
  })
  return {
    timezone: school?.timezone || DEFAULT_SCHOOL_TZ,
    leadMinutes: school?.conferenceReminderLeadMinutes ?? null,
    guardiansObserve: school?.conferenceGuardiansObserve ?? true,
  }
}

/** The banner's live fields for a next-class payload. */
function liveFields(next: NextSlot<TodaySlot> | null) {
  return {
    // Kept: the mobile dashboard reads it.
    liveSessionId: next?.live?.sessionId ?? null,
    slotId: next?.joinable ? next.slot.id : null,
    liveFromMs: next?.joinable ? (next.window?.fromMs ?? null) : null,
    liveUntilMs: next?.joinable ? (next.window?.untilMs ?? null) : null,
  }
}

async function getStudentUpcomingData(userId: string, schoolId: string) {
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true, sectionId: true },
  })

  if (!student) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [scope] = await getStudentScopes(schoolId, [student.id])

  // Work set for the student's section or their whole grade
  const assignments = scope
    ? await db.schoolAssignment.findMany({
        where: {
          schoolId,
          ...studentAudienceWhere(scope),
          status: "PUBLISHED",
        },
        include: {
          subject: { select: { name: true } },
          submissions: {
            where: { studentId: student.id },
            select: { status: true },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      })
    : []

  // The class happening now or next, by the school's clock — in the ACTIVE
  // term (without the filter a finished term's slot could still be "next").
  const now = new Date()
  const [clock, { term }] = await Promise.all([
    schoolClock(schoolId),
    resolveActiveTerm(schoolId),
  ])
  const tz = clock.timezone
  const todaySlots = !student.sectionId
    ? []
    : await db.timetable.findMany({
        where: {
          schoolId,
          dayOfWeek: schoolDayOfWeek(tz, now),
          weekOffset: 0,
          ...(term ? { termId: term.id } : {}),
          sectionId: student.sectionId,
          period: { isBreak: false },
        },
        include: {
          subject: { select: { name: true } },
          classroom: { select: { roomName: true } },
          period: { select: { startTime: true, endTime: true } },
        },
        orderBy: { period: { startTime: "asc" } },
      })
  const next = await currentOrNextSlot(schoolId, clock, now, todaySlots, false)
  const nextClass = next?.slot ?? null

  return {
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject?.name || "Unknown",
      dueDate: a.dueDate < today ? "Overdue" : formatDate(a.dueDate, "ar"),
      isOverdue: a.dueDate < today,
      status: (a.submissions[0]?.status?.toLowerCase() || "not_submitted") as
        | "not_submitted"
        | "submitted"
        | "graded",
    })),
    nextClass: nextClass
      ? {
          subject: nextClass.subject?.name || "Unknown",
          time: nextClass.period?.startTime
            ? new Date(nextClass.period.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBA",
          room: nextClass.classroom?.roomName || "TBA",
          ...liveFields(next),
        }
      : undefined,
  }
}

async function getTeacherUpcomingData(userId: string, schoolId: string) {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const now = new Date()
  const [clock, { term }] = await Promise.all([
    schoolClock(schoolId),
    resolveActiveTerm(schoolId),
  ])
  const tz = clock.timezone
  const dayOfWeek = schoolDayOfWeek(tz, now)
  // Their own slots minus the covered ones, plus the ones they are covering —
  // so a substitute's banner says "your class is live" for the class they are
  // actually teaching today (the timetable's Today list uses the same filter).
  const dayOr = await teacherDaySlotFilter(schoolId, teacher.id, tz, now)

  // Get today's classes
  const todaysClasses = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek,
      weekOffset: 0,
      ...(term ? { termId: term.id } : {}),
      OR: dayOr,
      period: { isBreak: false },
    },
    include: {
      section: {
        select: { name: true, _count: { select: { students: true } } },
      },
      subject: { select: { name: true } },
      classroom: { select: { roomName: true } },
      period: { select: { startTime: true, endTime: true } },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  // Submissions waiting on work the teacher teaches, and today's sections
  // with no attendance mark yet
  const todaySectionIds = [
    ...new Set(
      todaysClasses
        .map((slot) => slot.sectionId)
        .filter((id): id is string => !!id)
    ),
  ]
  const pairs = await getTeacherPairs(schoolId, teacher.id)
  const [pendingGrading, markedSections] = await Promise.all([
    db.assignmentSubmission.count({
      where: {
        schoolId,
        status: "SUBMITTED",
        assignment: teacherAssignmentsWhere({
          teacherId: teacher.id,
          userId,
          pairs,
        }),
      },
    }),
    todaySectionIds.length === 0
      ? Promise.resolve([])
      : db.attendance.findMany({
          where: {
            schoolId,
            sectionId: { in: todaySectionIds },
            date: { gte: today, lt: tomorrow },
          },
          distinct: ["sectionId"],
          select: { sectionId: true },
        }),
  ])
  const attendanceDue = todaySectionIds.length - markedSections.length

  const next = await currentOrNextSlot(
    schoolId,
    clock,
    now,
    todaysClasses,
    true
  )
  const nextClass = next?.slot ?? null

  return {
    nextClass: nextClass
      ? {
          subject: nextClass.subject?.name || "Unknown",
          time: nextClass.period?.startTime
            ? new Date(nextClass.period.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBA",
          room: nextClass.classroom?.roomName || "TBA",
          students: nextClass.section?._count.students ?? 0,
          ...liveFields(next),
        }
      : undefined,
    pendingGrading,
    attendanceDue,
    classesToday: todaysClasses.length,
  }
}

async function getParentUpcomingData(userId: string, schoolId: string) {
  const studentGuardians = await db.studentGuardian.findMany({
    // StudentGuardian.guardianId is a Guardian id, not a User id — matching
    // it against the session user found no children for any guardian.
    where: { guardian: { userId }, schoolId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          sectionId: true,
        },
      },
    },
  })

  if (studentGuardians.length === 0) return null
  const nameDisplay = await schoolNameDisplay(schoolId)
  // For the child's live class: the school clock, whether guardians may watch,
  // and the active term — read once for every child.
  const now = new Date()
  const [clock, { term }] = await Promise.all([
    schoolClock(schoolId),
    resolveActiveTerm(schoolId),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const scopes = new Map(
    (
      await getStudentScopes(
        schoolId,
        studentGuardians.map((sg) => sg.student.id)
      )
    ).map((scope) => [scope.studentId, scope])
  )

  const children = await Promise.all(
    studentGuardians.map(async (sg) => {
      // Work set for the child's section or their whole grade
      const scope = scopes.get(sg.student.id)
      const audience = scope ? studentAudienceWhere(scope) : { id: { in: [] } }

      // The child's class now or next, only where the school lets guardians
      // watch — join-core refuses them otherwise, so a banner Join would be a
      // button that can only fail.
      const childNextPromise =
        clock.guardiansObserve && sg.student.sectionId
          ? db.timetable
              .findMany({
                where: {
                  schoolId,
                  dayOfWeek: schoolDayOfWeek(clock.timezone, now),
                  weekOffset: 0,
                  ...(term ? { termId: term.id } : {}),
                  sectionId: sg.student.sectionId,
                  period: { isBreak: false },
                },
                include: {
                  subject: { select: { name: true } },
                  period: { select: { startTime: true, endTime: true } },
                },
              })
              .then((slots) =>
                currentOrNextSlot(schoolId, clock, now, slots, false)
              )
          : Promise.resolve(null)

      const [pendingAssignments, overdueAssignments, childNext] =
        await Promise.all([
          db.schoolAssignment.count({
            where: {
              schoolId,
              ...audience,
              status: "PUBLISHED",
              dueDate: { gte: today },
              submissions: {
                none: {
                  studentId: sg.student.id,
                  status: { in: ["SUBMITTED", "GRADED"] },
                },
              },
            },
          }),
          db.schoolAssignment.count({
            where: {
              schoolId,
              ...audience,
              status: "PUBLISHED",
              dueDate: { lt: today },
              submissions: {
                none: {
                  studentId: sg.student.id,
                  status: { in: ["SUBMITTED", "GRADED"] },
                },
              },
            },
          }),
          childNextPromise,
        ])

      return {
        id: sg.student.id,
        name: displayName(sg.student, nameDisplay),
        pendingAssignments,
        overdueAssignments,
        nextClass:
          childNext?.joinable && childNext.slot.subject?.name
            ? { subject: childNext.slot.subject.name, ...liveFields(childNext) }
            : undefined,
      }
    })
  )

  // Get upcoming events
  const upcomingEvents = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      createdAt: { gte: today },
    },
    select: { title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 3,
  })

  return {
    children,
    upcomingEvents: upcomingEvents.map((e) => ({
      title: e.title || "Event",
      date: formatDate(e.createdAt, "ar"),
    })),
  }
}

async function getStaffUpcomingData(userId: string, schoolId: string) {
  // For now, return mock data as staff tasks aren't fully modeled in Prisma
  return {
    urgentTasks: [
      { id: "1", title: "Review pending requests", priority: "high" as const },
      { id: "2", title: "Update inventory", priority: "medium" as const },
    ],
    pendingRequests: 5,
    todaysTasks: 8,
  }
}

async function getAccountantUpcomingData(schoolId: string) {
  // Get invoice/payment data
  const [pendingInvoices, overdueInvoices] = await Promise.all([
    db.userInvoice.count({ where: { schoolId, status: "UNPAID" } }),
    db.userInvoice.count({ where: { schoolId, status: "OVERDUE" } }),
  ])

  const pendingAmount = await db.userInvoice.aggregate({
    where: { schoolId, status: "UNPAID" },
    _sum: { total: true },
  })

  const overdueAmount = await db.userInvoice.aggregate({
    where: { schoolId, status: "OVERDUE" },
    _sum: { total: true },
  })

  return {
    pendingPayments: {
      count: pendingInvoices,
      totalAmount: pendingAmount._sum.total || 0,
    },
    overdueInvoices: {
      count: overdueInvoices,
      totalAmount: overdueAmount._sum.total || 0,
    },
    todayCollections: 0, // Would need payment tracking
  }
}

async function getAdminUpcomingData(schoolId: string) {
  const [activeAlerts, pendingAnnouncements] = await Promise.all([
    getActiveAlertsForSchool(schoolId),
    db.announcement.count({ where: { schoolId, published: false } }),
  ])

  return {
    systemAlerts: activeAlerts.slice(0, 3).map((a) => ({
      type: a.type,
      message: a.message,
      severity: a.severity as "high" | "medium" | "low",
    })),
    pendingApprovals: pendingAnnouncements,
    activeIssues: activeAlerts.filter((a) => !a.acknowledged).length,
  }
}

export async function getActiveAlertsForSchool(
  schoolId: string
): Promise<EmergencyAlert[]> {
  const now = new Date()

  const [attendanceRate, studentCount] = await Promise.all([
    getAttendanceAlertStatus(schoolId),
    db.student.count({ where: { schoolId } }),
  ])

  const alerts: EmergencyAlert[] = []

  if (attendanceRate < 70) {
    alerts.push({
      id: "alert_attendance_001",
      type: "attendance",
      severity: attendanceRate < 50 ? "high" : "medium",
      title: "Low Attendance Alert",
      message: `School attendance is critically low at ${attendanceRate.toFixed(1)}%. Investigation required.`,
      createdAt: now,
      acknowledged: false,
      affectedCount: Math.floor(studentCount * (1 - attendanceRate / 100)),
      actionRequired:
        "Review attendance records and contact absent students' parents",
    })
  }

  alerts.push({
    id: "alert_financial_001",
    type: "financial",
    severity: "medium",
    title: "Fee Collection Below Target",
    message:
      "Current month fee collection at 65% of target with 5 days remaining.",
    createdAt: subDays(now, 1),
    acknowledged: false,
    actionRequired: "Send payment reminders to defaulters",
  })

  return alerts.filter((alert) => !alert.expiresAt || alert.expiresAt > now)
}

async function getAttendanceAlertStatus(schoolId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalStudents, presentStudents] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.attendance.count({
      where: {
        schoolId,
        date: today,
        status: { in: ["PRESENT", "LATE"] },
      },
    }),
  ])

  return totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 100
}
