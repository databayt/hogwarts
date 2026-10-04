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
import { studentAudienceWhere } from "@/lib/teaching-audience"
import { getStudentScopes, getTeacherPairs } from "@/lib/teaching-scope"
import { teacherAssignmentsWhere } from "@/components/school-dashboard/listings/assignments/queries"

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

  // Get next class
  const dayOfWeek = today.getDay()
  const nextClass = !student.sectionId
    ? null
    : await db.timetable.findFirst({
        where: {
          schoolId,
          dayOfWeek,
          weekOffset: 0,
          sectionId: student.sectionId,
        },
        include: {
          subject: { select: { name: true } },
          classroom: { select: { roomName: true } },
          period: { select: { startTime: true } },
        },
        orderBy: { period: { startTime: "asc" } },
      })

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
  const dayOfWeek = today.getDay()

  // Get today's classes
  const todaysClasses = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek,
      weekOffset: 0,
      teacherId: teacher.id,
    },
    include: {
      section: {
        select: { name: true, _count: { select: { students: true } } },
      },
      subject: { select: { name: true } },
      classroom: { select: { roomName: true } },
      period: { select: { startTime: true } },
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

  const nextClass = todaysClasses[0]

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
          lastName: true,
        },
      },
    },
  })

  if (studentGuardians.length === 0) return null

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
        name: `${sg.student.firstName} ${sg.student.lastName}`.trim(),
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
