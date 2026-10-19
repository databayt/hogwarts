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
import { teacherAssignmentsWhere } from "@/components/school-dashboard/listings/assignments/queries"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  slotInstantsOn,
} from "@/components/school-dashboard/live/day-window"
import { attachLiveClasses } from "@/components/school-dashboard/timetable/live-class-join"

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
const LIVE_JOIN_LEAD_MS = 10 * 60_000

type TodaySlot = {
  id: string
  termId: string
  sectionId: string | null
  subjectId: string | null
  period: { startTime: Date; endTime: Date } | null
}

/**
 * The class happening now or next, by the SCHOOL's clock — and its live room
 * when it has one. `nextClass` used to be the day's FIRST slot (no time
 * filter, and the server's `getDay()`), so at 11:00 the card still said
 * period 1. `live` is set only when a real session exists today and the
 * period is running or within ten minutes of starting.
 */
async function currentOrNextSlot<T extends TodaySlot>(
  schoolId: string,
  tz: string,
  now: Date,
  slots: T[]
): Promise<{ slot: T; live: { sessionId: string } | null } | null> {
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

  let live: { sessionId: string } | null = null
  if (pick.at!.scheduledStart.getTime() - LIVE_JOIN_LEAD_MS <= now.getTime()) {
    const [attached] = await attachLiveClasses(
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
    )
    if (attached?.liveClass?.sessionId) {
      live = { sessionId: attached.liveClass.sessionId }
    }
  }
  return { slot: pick.slot, live }
}

async function schoolTimezone(schoolId: string): Promise<string> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  return school?.timezone || DEFAULT_SCHOOL_TZ
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

  // The class happening now or next, by the school's clock.
  const now = new Date()
  const tz = await schoolTimezone(schoolId)
  const todaySlots = !student.sectionId
    ? []
    : await db.timetable.findMany({
        where: {
          schoolId,
          dayOfWeek: schoolDayOfWeek(tz, now),
          weekOffset: 0,
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
  const next = await currentOrNextSlot(schoolId, tz, now, todaySlots)
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
          liveSessionId: next?.live?.sessionId ?? null,
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
  const tz = await schoolTimezone(schoolId)
  const dayOfWeek = schoolDayOfWeek(tz, now)

  // Get today's classes
  const todaysClasses = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek,
      weekOffset: 0,
      teacherId: teacher.id,
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

  const next = await currentOrNextSlot(schoolId, tz, now, todaysClasses)
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
          liveSessionId: next?.live?.sessionId ?? null,
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
        },
      },
    },
  })

  if (studentGuardians.length === 0) return null
  const nameDisplay = await schoolNameDisplay(schoolId)

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

      const [pendingAssignments, overdueAssignments] = await Promise.all([
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
      ])

      return {
        id: sg.student.id,
        name: displayName(sg.student, nameDisplay),
        pendingAssignments,
        overdueAssignments,
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
