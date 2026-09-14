// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// NOT a "use server" module on purpose: the attendance overview actions
// (actions/dashboard.ts, session) and the mobile route
// (api/mobile/attendance/today, bearer token) both read these, and a
// "use server" export would be a client-callable endpoint trusting the
// schoolId/userId it is handed. Callers authenticate and gate the role first.
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"

import { getTeacherClassIds } from "./actions/helpers"

export interface AttendanceViewer {
  schoolId: string
  userId: string
  /** A TEACHER is scoped to their own classes; other staff see the school. */
  role: string
}

export type TodaysAttendanceDashboard = {
  today: {
    date: string
    dayName: string
    /** false when SchoolWeekConfig says today is not a working day */
    isSchoolDay: boolean
  }
  stats: {
    totalStudents: number
    markedToday: number
    present: number
    absent: number
    late: number
    attendanceRate: number
    classesTotal: number
    classesMarked: number
  }
  unmarkedClasses: Array<{
    id: string
    name: string
    studentCount: number
    scheduledTime?: string
  }>
  followUpNeeded: Array<{
    studentId: string
    studentName: string
    className: string
    issue: "consecutive_absence" | "chronic" | "unexcused_pending"
    details: string
    priority: "high" | "medium" | "low"
  }>
  recentActivity: Array<{
    id: string
    studentName: string
    className: string
    status: string
    time: string
    method: string
    date: string
    /** ISO instant of the mark — `time` is a server-local en-US label. */
    markedAt: string
  }>
}

export type AttendanceFollowUp = {
  students: Array<{
    studentId: string
    studentName: string
    className: string
    issue: "consecutive_absence" | "low_attendance" | "unexcused_pending"
    severity: "critical" | "warning" | "info"
    /** Legacy preformatted string — clients should prefer count/date +
     * their own dictionary template (details is English-only). */
    details: string
    /** consecutive_absence: number of consecutive days */
    count?: number
    /** unexcused_pending: ISO date of the absence awaiting excuse review */
    date?: string
    actionUrl?: string
  }>
  summary: {
    critical: number
    warning: number
    info: number
  }
}

/**
 * Today's attendance overview: marking progress by class, the classes still
 * unmarked, 3+ day absence streaks and the last ten marks.
 */
export async function loadTodaysAttendanceDashboard(
  input: AttendanceViewer
): Promise<TodaysAttendanceDashboard> {
  const { schoolId, userId, role } = input
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]

  // Teacher scoping
  let teacherClassIds: string[] | null = null
  if (role === "TEACHER") {
    teacherClassIds = await getTeacherClassIds(schoolId, userId)
  }

  // Get classes with student counts (scoped for teachers)
  const classWhere: { schoolId: string; id?: { in: string[] } } = {
    schoolId,
  }
  if (teacherClassIds) classWhere.id = { in: teacherClassIds }

  const [classes, weekConfigs] = await Promise.all([
    db.class.findMany({
      where: classWhere,
      select: {
        id: true,
        name: true,
        _count: { select: { studentClasses: true } },
      },
    }),
    // Working-days config: the termId=null row is the school default;
    // term-specific rows override it. No config → every day counts.
    db.schoolWeekConfig.findMany({
      where: { schoolId },
      select: { termId: true, workingDays: true, updatedAt: true },
    }),
  ])

  const weekConfig =
    weekConfigs.find((c) => c.termId === null) ??
    weekConfigs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
  // workingDays uses JS getDay() convention: [0,1,2,3,4] = Sun–Thu.
  const isSchoolDay = weekConfig
    ? weekConfig.workingDays.includes(today.getDay())
    : true

  // Get today's attendance records (scoped)
  const attendanceWhere: Prisma.AttendanceWhereInput = {
    schoolId,
    date: today,
    deletedAt: null,
  }
  if (teacherClassIds) attendanceWhere.classId = { in: teacherClassIds }

  // PERF: stats only need ids/status — don't join student/class names for the
  // whole day's roster (recent activity below joins names for just 10 rows).
  const todayAttendance = await db.attendance.findMany({
    where: attendanceWhere,
    select: {
      id: true,
      classId: true,
      studentId: true,
      status: true,
      markedAt: true,
    },
    orderBy: { markedAt: "desc" },
  })

  // Calculate stats
  const markedClassIds = new Set(todayAttendance.map((a) => a.classId))
  const unmarkedClasses = classes.filter(
    (c) => !markedClassIds.has(c.id) && c._count.studentClasses > 0
  )

  const totalStudents = classes.reduce(
    (sum, c) => sum + c._count.studentClasses,
    0
  )
  const uniqueStudentsMarked = new Set(todayAttendance.map((a) => a.studentId))
    .size
  const present = todayAttendance.filter((a) => a.status === "PRESENT").length
  const absent = todayAttendance.filter((a) => a.status === "ABSENT").length
  const late = todayAttendance.filter((a) => a.status === "LATE").length

  // Get students with consecutive absences (3+ days)
  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const absenceWhere: Prisma.AttendanceWhereInput = {
    schoolId,
    status: "ABSENT",
    date: { gte: threeDaysAgo, lte: today },
    deletedAt: null,
  }
  if (teacherClassIds) absenceWhere.classId = { in: teacherClassIds }

  const recentAbsences = await db.attendance.findMany({
    where: absenceWhere,
    select: {
      studentId: true,
      date: true,
      student: { select: { firstName: true, lastName: true } },
      class: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  })

  // Group absences by student
  const studentAbsences = new Map<
    string,
    { name: string; className: string; dates: Date[] }
  >()
  for (const absence of recentAbsences) {
    const key = absence.studentId
    if (!studentAbsences.has(key)) {
      studentAbsences.set(key, {
        name: `${absence.student.firstName} ${absence.student.lastName}`,
        className: absence.class?.name ?? "",
        dates: [],
      })
    }
    studentAbsences.get(key)!.dates.push(absence.date)
  }

  // Build follow-up list
  const followUpNeeded: Array<{
    studentId: string
    studentName: string
    className: string
    issue: "consecutive_absence" | "chronic" | "unexcused_pending"
    details: string
    priority: "high" | "medium" | "low"
  }> = []

  for (const [studentId, data] of studentAbsences) {
    // Check for consecutive absences
    const sortedDates = data.dates.sort((a, b) => b.getTime() - a.getTime())
    let consecutiveCount = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const diff =
        (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
        (1000 * 60 * 60 * 24)
      if (diff <= 1) {
        consecutiveCount++
      } else {
        break
      }
    }

    if (consecutiveCount >= 3) {
      followUpNeeded.push({
        studentId,
        studentName: data.name,
        className: data.className,
        issue: "consecutive_absence",
        details: `Absent ${consecutiveCount} consecutive days`,
        priority: consecutiveCount >= 5 ? "high" : "medium",
      })
    }
  }

  // Get recent activity (last 10) — dedicated query so student/class names are
  // only joined for these 10 rows, not the whole day's attendance.
  const recentRows = await db.attendance.findMany({
    where: attendanceWhere,
    orderBy: { markedAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      markedAt: true,
      method: true,
      date: true,
      student: { select: { firstName: true, lastName: true } },
      class: { select: { name: true } },
    },
  })
  const recentActivity = recentRows.map((a) => ({
    id: a.id,
    studentName: `${a.student.firstName} ${a.student.lastName}`,
    className: a.class?.name ?? "",
    status: a.status,
    time: a.markedAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    method: a.method,
    date: a.date.toISOString(),
    markedAt: a.markedAt.toISOString(),
  }))

  return {
    today: {
      date: today.toISOString().split("T")[0],
      dayName: dayNames[today.getDay()],
      isSchoolDay,
    },
    stats: {
      totalStudents,
      markedToday: uniqueStudentsMarked,
      present,
      absent,
      late,
      // Rate counts present AND late as "attended" (a late student is still
      // present) — was present-only, which understated the rate.
      attendanceRate:
        totalStudents > 0
          ? Math.round(
              ((present + late) / Math.max(uniqueStudentsMarked, 1)) * 100
            )
          : 0,
      classesTotal: classes.filter((c) => c._count.studentClasses > 0).length,
      classesMarked: classes.filter(
        (c) => markedClassIds.has(c.id) && c._count.studentClasses > 0
      ).length,
    },
    // On a non-school day an all-classes-unmarked list is pure noise —
    // suppress it so the client can show a neutral "no school today" note.
    unmarkedClasses: isSchoolDay
      ? unmarkedClasses.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c._count.studentClasses,
        }))
      : [],
    followUpNeeded: followUpNeeded.slice(0, 5), // Top 5 priority
    recentActivity,
  }
}

/**
 * Students needing follow-up: absence streaks over the last week, then
 * excuses awaiting review. Sorted critical → warning → info.
 */
export async function loadAttendanceFollowUp(
  input: AttendanceViewer & { limit?: number }
): Promise<AttendanceFollowUp> {
  const { schoolId, userId, role } = input
  // Teacher scoping
  let teacherClassIds: string[] | null = null
  if (role === "TEACHER") {
    teacherClassIds = await getTeacherClassIds(schoolId, userId)
  }

  const limit = input.limit || 20
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results: Array<{
    studentId: string
    studentName: string
    className: string
    issue: "consecutive_absence" | "low_attendance" | "unexcused_pending"
    severity: "critical" | "warning" | "info"
    details: string
    count?: number
    date?: string
    actionUrl?: string
  }> = []

  // 1. Get students with recent absences for consecutive check
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const followUpAbsenceWhere: Prisma.AttendanceWhereInput = {
    schoolId,
    status: "ABSENT",
    date: { gte: sevenDaysAgo, lte: today },
    deletedAt: null,
  }
  if (teacherClassIds) {
    followUpAbsenceWhere.classId = { in: teacherClassIds }
  }

  const recentAbsences = await db.attendance.findMany({
    where: followUpAbsenceWhere,
    select: {
      studentId: true,
      date: true,
      student: { select: { firstName: true, lastName: true } },
      class: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  })

  // Group and find consecutive absences
  const studentAbsenceMap = new Map<
    string,
    { name: string; className: string; dates: Date[] }
  >()
  for (const absence of recentAbsences) {
    if (!studentAbsenceMap.has(absence.studentId)) {
      studentAbsenceMap.set(absence.studentId, {
        name: `${absence.student.firstName} ${absence.student.lastName}`,
        className: absence.class?.name ?? "",
        dates: [],
      })
    }
    studentAbsenceMap.get(absence.studentId)!.dates.push(absence.date)
  }

  for (const [studentId, data] of studentAbsenceMap) {
    const sortedDates = data.dates.sort((a, b) => b.getTime() - a.getTime())
    let consecutive = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays = Math.round(
        (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (diffDays <= 1) {
        consecutive++
      } else {
        break
      }
    }

    if (consecutive >= 3) {
      results.push({
        studentId,
        studentName: data.name,
        className: data.className,
        issue: "consecutive_absence",
        severity: consecutive >= 5 ? "critical" : "warning",
        details: `Absent ${consecutive} consecutive days`,
        count: consecutive,
        actionUrl: `/students/${studentId}`,
      })
    }
  }

  // 2. Get pending unexcused absences — scope to the teacher's own classes
  // too (the absence list above is scoped; this one was not, leaking students
  // outside the teacher's classes).
  const pendingExcuses = await db.attendanceExcuse.findMany({
    where: {
      schoolId,
      status: "PENDING",
      ...(teacherClassIds
        ? { attendance: { classId: { in: teacherClassIds } } }
        : {}),
    },
    select: {
      id: true,
      attendance: {
        select: {
          studentId: true,
          date: true,
          student: { select: { firstName: true, lastName: true } },
          class: { select: { name: true } },
        },
      },
    },
    take: 10,
  })

  for (const excuse of pendingExcuses) {
    results.push({
      studentId: excuse.attendance.studentId,
      studentName: `${excuse.attendance.student.firstName} ${excuse.attendance.student.lastName}`,
      className: excuse.attendance.class?.name ?? "",
      issue: "unexcused_pending",
      severity: "info",
      details: `Excuse pending review since ${formatDate(excuse.attendance.date, "ar")}`,
      date: excuse.attendance.date.toISOString(),
      // /attendance/excuses/[id] does not exist — link to the review queue.
      actionUrl: `/attendance/excuses`,
    })
  }

  // Sort by severity and limit
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const summary = {
    critical: results.filter((r) => r.severity === "critical").length,
    warning: results.filter((r) => r.severity === "warning").length,
    info: results.filter((r) => r.severity === "info").length,
  }

  return { students: results.slice(0, limit), summary }
}
