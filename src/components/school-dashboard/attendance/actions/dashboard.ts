"use server"

import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"
import type { AttendanceRiskLevel } from "./interventions"

export type { AttendanceRiskLevel }

interface StudentRiskData {
  studentId: string
  studentName: string
  classId: string | null
  className: string | null
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
  riskLevel: AttendanceRiskLevel
  trend: "improving" | "stable" | "declining"
  consecutiveAbsences: number
  lastAttendance: string | null
}

// ==================== Helpers ====================

function calculateRiskLevel(rate: number): AttendanceRiskLevel {
  if (rate >= 95) return "SATISFACTORY"
  if (rate >= 90) return "AT_RISK"
  if (rate >= 80) return "MODERATELY_CHRONIC"
  return "SEVERELY_CHRONIC"
}

// ==================== Early Warning Functions ====================

/**
 * Get students by risk level for early warning system
 */
export async function getStudentsByRiskLevel(input?: {
  classId?: string
  riskLevel?: AttendanceRiskLevel
  dateFrom?: string
  dateTo?: string
  limit?: number
}): Promise<
  ActionResponse<{
    students: StudentRiskData[]
    summary: {
      satisfactory: number
      atRisk: number
      moderatelyChronic: number
      severelyChronic: number
      total: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Default to current school year (last 90 days if not specified)
    const dateFrom = input?.dateFrom
      ? new Date(input.dateFrom)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const dateTo = input?.dateTo ? new Date(input.dateTo) : new Date()

    // Get all students with their attendance
    const where: Prisma.StudentWhereInput = { schoolId }
    if (input?.classId) {
      where.studentClasses = { some: { classId: input.classId } }
    }

    const students = await db.student.findMany({
      where,
      select: {
        id: true,
        givenName: true,
        surname: true,
        studentClasses: {
          take: 1,
          include: { class: { select: { id: true, name: true } } },
        },
        attendances: {
          where: {
            date: { gte: dateFrom, lte: dateTo },
            schoolId,
          },
          orderBy: { date: "desc" },
          select: { status: true, date: true },
        },
      },
    })

    const riskData: StudentRiskData[] = students.map((student) => {
      const attendances = student.attendances
      const totalDays = attendances.length
      const presentDays = attendances.filter(
        (a) => a.status === "PRESENT"
      ).length
      const lateDays = attendances.filter((a) => a.status === "LATE").length
      const absentDays = attendances.filter((a) => a.status === "ABSENT").length
      const excusedDays = attendances.filter(
        (a) => a.status === "EXCUSED" || a.status === "SICK"
      ).length

      // Late counts as present for rate calculation
      const attendanceRate =
        totalDays > 0
          ? Math.round(((presentDays + lateDays) / totalDays) * 100)
          : 100
      const riskLevel = calculateRiskLevel(attendanceRate)

      // Calculate trend (compare last 30 days vs previous 30 days)
      const midpoint = Math.floor(attendances.length / 2)
      const recentAttendances = attendances.slice(0, midpoint)
      const olderAttendances = attendances.slice(midpoint)

      const recentRate =
        recentAttendances.length > 0
          ? (recentAttendances.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length /
              recentAttendances.length) *
            100
          : 100
      const olderRate =
        olderAttendances.length > 0
          ? (olderAttendances.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length /
              olderAttendances.length) *
            100
          : 100

      let trend: "improving" | "stable" | "declining" = "stable"
      if (recentRate - olderRate > 5) trend = "improving"
      else if (olderRate - recentRate > 5) trend = "declining"

      // Count consecutive absences from most recent
      let consecutiveAbsences = 0
      for (const a of attendances) {
        if (a.status === "ABSENT") consecutiveAbsences++
        else break
      }

      const primaryClass = student.studentClasses[0]?.class

      return {
        studentId: student.id,
        studentName: `${student.givenName} ${student.surname}`,
        classId: primaryClass?.id || null,
        className: primaryClass?.name || null,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendanceRate,
        riskLevel,
        trend,
        consecutiveAbsences,
        lastAttendance: attendances[0]?.date.toISOString() || null,
      }
    })

    // Filter by risk level if specified
    let filteredData = riskData
    if (input?.riskLevel) {
      filteredData = riskData.filter((s) => s.riskLevel === input.riskLevel)
    }

    // Sort by attendance rate (lowest first) and limit
    filteredData.sort((a, b) => a.attendanceRate - b.attendanceRate)
    if (input?.limit) {
      filteredData = filteredData.slice(0, input.limit)
    }

    // Calculate summary
    const summary = {
      satisfactory: riskData.filter((s) => s.riskLevel === "SATISFACTORY")
        .length,
      atRisk: riskData.filter((s) => s.riskLevel === "AT_RISK").length,
      moderatelyChronic: riskData.filter(
        (s) => s.riskLevel === "MODERATELY_CHRONIC"
      ).length,
      severelyChronic: riskData.filter(
        (s) => s.riskLevel === "SEVERELY_CHRONIC"
      ).length,
      total: riskData.length,
    }

    return { success: true, data: { students: filteredData, summary } }
  } catch (error) {
    console.error("[getStudentsByRiskLevel] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get students by risk level",
    }
  }
}

/**
 * Get detailed early warning data for a specific student
 */
export async function getStudentEarlyWarningDetails(studentId: string): Promise<
  ActionResponse<{
    student: StudentRiskData
    weeklyTrends: Array<{ week: string; rate: number; absences: number }>
    recentAbsences: Array<{
      date: string
      className: string
      hasExcuse: boolean
    }>
    alerts: Array<{
      type: string
      message: string
      severity: "low" | "medium" | "high"
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Get last 90 days of attendance
    const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        id: true,
        givenName: true,
        surname: true,
        studentClasses: {
          take: 1,
          include: { class: { select: { id: true, name: true } } },
        },
        attendances: {
          where: { date: { gte: dateFrom }, schoolId },
          orderBy: { date: "desc" },
          include: {
            class: { select: { name: true } },
            excuse: { select: { status: true } },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const attendances = student.attendances
    const totalDays = attendances.length
    const presentDays = attendances.filter((a) => a.status === "PRESENT").length
    const lateDays = attendances.filter((a) => a.status === "LATE").length
    const absentDays = attendances.filter((a) => a.status === "ABSENT").length
    const excusedDays = attendances.filter(
      (a) => a.status === "EXCUSED" || a.status === "SICK"
    ).length
    const attendanceRate =
      totalDays > 0
        ? Math.round(((presentDays + lateDays) / totalDays) * 100)
        : 100

    // Calculate weekly trends
    const weeklyData: Record<
      string,
      { total: number; present: number; absent: number }
    > = {}
    attendances.forEach((a) => {
      const weekStart = new Date(a.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split("T")[0]

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, present: 0, absent: 0 }
      }
      weeklyData[weekKey].total++
      if (a.status === "PRESENT" || a.status === "LATE")
        weeklyData[weekKey].present++
      if (a.status === "ABSENT") weeklyData[weekKey].absent++
    })

    const weeklyTrends = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        rate:
          data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
        absences: data.absent,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Get recent absences
    const recentAbsences = attendances
      .filter((a) => a.status === "ABSENT")
      .slice(0, 10)
      .map((a) => ({
        date: a.date.toISOString(),
        className: a.class.name,
        hasExcuse: !!a.excuse && a.excuse.status === "APPROVED",
      }))

    // Generate alerts
    const alerts: Array<{
      type: string
      message: string
      severity: "low" | "medium" | "high"
    }> = []

    // Calculate consecutive absences
    let consecutiveAbsences = 0
    for (const a of attendances) {
      if (a.status === "ABSENT") consecutiveAbsences++
      else break
    }

    if (consecutiveAbsences >= 5) {
      alerts.push({
        type: "consecutive_absences",
        message: `Student has ${consecutiveAbsences} consecutive absences`,
        severity: "high",
      })
    } else if (consecutiveAbsences >= 3) {
      alerts.push({
        type: "consecutive_absences",
        message: `Student has ${consecutiveAbsences} consecutive absences`,
        severity: "medium",
      })
    }

    if (attendanceRate < 80) {
      alerts.push({
        type: "severely_chronic",
        message: "Student is severely chronically absent (<80% attendance)",
        severity: "high",
      })
    } else if (attendanceRate < 90) {
      alerts.push({
        type: "moderately_chronic",
        message:
          "Student is moderately chronically absent (80-89.9% attendance)",
        severity: "medium",
      })
    } else if (attendanceRate < 95) {
      alerts.push({
        type: "at_risk",
        message:
          "Student is at risk of chronic absenteeism (90-94.9% attendance)",
        severity: "low",
      })
    }

    // Check trend
    const midpoint = Math.floor(attendances.length / 2)
    const recentAtt = attendances.slice(0, midpoint)
    const olderAtt = attendances.slice(midpoint)
    const recentRate =
      recentAtt.length > 0
        ? (recentAtt.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE"
          ).length /
            recentAtt.length) *
          100
        : 100
    const olderRate =
      olderAtt.length > 0
        ? (olderAtt.filter((a) => a.status === "PRESENT" || a.status === "LATE")
            .length /
            olderAtt.length) *
          100
        : 100

    let trend: "improving" | "stable" | "declining" = "stable"
    if (recentRate - olderRate > 5) trend = "improving"
    else if (olderRate - recentRate > 5) {
      trend = "declining"
      alerts.push({
        type: "declining_trend",
        message: "Attendance is declining compared to previous period",
        severity: "medium",
      })
    }

    const primaryClass = student.studentClasses[0]?.class

    return {
      success: true,
      data: {
        student: {
          studentId: student.id,
          studentName: `${student.givenName} ${student.surname}`,
          classId: primaryClass?.id || null,
          className: primaryClass?.name || null,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendanceRate,
          riskLevel: calculateRiskLevel(attendanceRate),
          trend,
          consecutiveAbsences,
          lastAttendance: attendances[0]?.date.toISOString() || null,
        },
        weeklyTrends,
        recentAbsences,
        alerts,
      },
    }
  } catch (error) {
    console.error("[getStudentEarlyWarningDetails] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get student early warning details",
    }
  }
}

// ==================== Dashboard Functions ====================

/**
 * Get today's comprehensive dashboard data
 */
export async function getTodaysDashboard(): Promise<
  ActionResponse<{
    today: {
      date: string
      dayName: string
    }
    stats: {
      totalStudents: number
      markedToday: number
      present: number
      absent: number
      late: number
      attendanceRate: number
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
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

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

    // Get all classes with student counts
    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        _count: { select: { studentClasses: true } },
      },
    })

    // Get today's attendance records
    const todayAttendance = await db.attendance.findMany({
      where: {
        schoolId,
        date: today,
      },
      select: {
        id: true,
        classId: true,
        studentId: true,
        status: true,
        markedAt: true,
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
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
    const uniqueStudentsMarked = new Set(
      todayAttendance.map((a) => a.studentId)
    ).size
    const present = todayAttendance.filter((a) => a.status === "PRESENT").length
    const absent = todayAttendance.filter((a) => a.status === "ABSENT").length
    const late = todayAttendance.filter((a) => a.status === "LATE").length

    // Get students with consecutive absences (3+ days)
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentAbsences = await db.attendance.findMany({
      where: {
        schoolId,
        status: "ABSENT",
        date: { gte: threeDaysAgo, lte: today },
      },
      select: {
        studentId: true,
        date: true,
        student: { select: { givenName: true, surname: true } },
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
          name: `${absence.student.givenName} ${absence.student.surname}`,
          className: absence.class.name,
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

    // Get recent activity (last 10)
    const recentActivity = todayAttendance.slice(0, 10).map((a) => ({
      id: a.id,
      studentName: `${a.student.givenName} ${a.student.surname}`,
      className: a.class.name,
      status: a.status,
      time: a.markedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))

    return {
      success: true,
      data: {
        today: {
          date: today.toISOString().split("T")[0],
          dayName: dayNames[today.getDay()],
        },
        stats: {
          totalStudents,
          markedToday: uniqueStudentsMarked,
          present,
          absent,
          late,
          attendanceRate:
            totalStudents > 0
              ? Math.round((present / Math.max(uniqueStudentsMarked, 1)) * 100)
              : 0,
        },
        unmarkedClasses: unmarkedClasses.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c._count.studentClasses,
        })),
        followUpNeeded: followUpNeeded.slice(0, 5), // Top 5 priority
        recentActivity,
      },
    }
  } catch (error) {
    console.error("[getTodaysDashboard] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get today's dashboard",
    }
  }
}

/**
 * Get teacher's classes for today
 */
export async function getTeacherClassesToday(): Promise<
  ActionResponse<{
    classes: Array<{
      id: string
      name: string
      studentCount: number
      period?: string
      time?: string
      isMarked: boolean
      markedCount: number
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get teacher's assigned classes (Teacher has direct relation to Class via teacherId)
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id, schoolId },
      select: {
        id: true,
        classes: {
          select: {
            id: true,
            name: true,
            _count: { select: { studentClasses: true } },
          },
        },
      },
    })

    if (!teacher) {
      // If not a teacher, get all classes (admin view)
      const allClasses = await db.class.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          _count: { select: { studentClasses: true } },
        },
      })

      // Get today's attendance counts per class
      const attendanceCounts = await db.attendance.groupBy({
        by: ["classId"],
        where: { schoolId, date: today },
        _count: true,
      })

      const countsMap = new Map(
        attendanceCounts.map((a) => [a.classId, a._count])
      )

      return {
        success: true,
        data: {
          classes: allClasses.map((c) => ({
            id: c.id,
            name: c.name,
            studentCount: c._count.studentClasses,
            isMarked: (countsMap.get(c.id) || 0) > 0,
            markedCount: countsMap.get(c.id) || 0,
          })),
        },
      }
    }

    // Get classes directly from teacher
    const teacherClasses = teacher.classes

    // Get today's attendance counts per class
    const classIds = teacherClasses.map((c) => c.id)
    const attendanceCounts = await db.attendance.groupBy({
      by: ["classId"],
      where: { schoolId, date: today, classId: { in: classIds } },
      _count: true,
    })

    const countsMap = new Map(
      attendanceCounts.map((a) => [a.classId, a._count])
    )

    return {
      success: true,
      data: {
        classes: teacherClasses.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c._count.studentClasses,
          isMarked: (countsMap.get(c.id) || 0) > 0,
          markedCount: countsMap.get(c.id) || 0,
        })),
      },
    }
  } catch (error) {
    console.error("[getTeacherClassesToday] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher classes",
    }
  }
}

/**
 * Get students needing follow-up
 */
export async function getFollowUpStudents(input?: { limit?: number }): Promise<
  ActionResponse<{
    students: Array<{
      studentId: string
      studentName: string
      className: string
      issue: "consecutive_absence" | "low_attendance" | "unexcused_pending"
      severity: "critical" | "warning" | "info"
      details: string
      actionUrl?: string
    }>
    summary: {
      critical: number
      warning: number
      info: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const limit = input?.limit || 20
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results: Array<{
      studentId: string
      studentName: string
      className: string
      issue: "consecutive_absence" | "low_attendance" | "unexcused_pending"
      severity: "critical" | "warning" | "info"
      details: string
      actionUrl?: string
    }> = []

    // 1. Get students with recent absences for consecutive check
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentAbsences = await db.attendance.findMany({
      where: {
        schoolId,
        status: "ABSENT",
        date: { gte: sevenDaysAgo, lte: today },
      },
      select: {
        studentId: true,
        date: true,
        student: { select: { givenName: true, surname: true } },
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
          name: `${absence.student.givenName} ${absence.student.surname}`,
          className: absence.class.name,
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
          actionUrl: `/students/${studentId}`,
        })
      }
    }

    // 2. Get pending unexcused absences
    const pendingExcuses = await db.attendanceExcuse.findMany({
      where: {
        schoolId,
        status: "PENDING",
      },
      select: {
        id: true,
        attendance: {
          select: {
            studentId: true,
            date: true,
            student: { select: { givenName: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      take: 10,
    })

    for (const excuse of pendingExcuses) {
      results.push({
        studentId: excuse.attendance.studentId,
        studentName: `${excuse.attendance.student.givenName} ${excuse.attendance.student.surname}`,
        className: excuse.attendance.class.name,
        issue: "unexcused_pending",
        severity: "info",
        details: `Excuse pending review since ${excuse.attendance.date.toLocaleDateString()}`,
        actionUrl: `/attendance/excuses/${excuse.id}`,
      })
    }

    // Sort by severity and limit
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    results.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )

    const summary = {
      critical: results.filter((r) => r.severity === "critical").length,
      warning: results.filter((r) => r.severity === "warning").length,
      info: results.filter((r) => r.severity === "info").length,
    }

    return {
      success: true,
      data: {
        students: results.slice(0, limit),
        summary,
      },
    }
  } catch (error) {
    console.error("[getFollowUpStudents] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get follow-up students",
    }
  }
}

/**
 * Get unmarked classes based on today's timetable
 */
export async function getUnmarkedClasses(): Promise<
  ActionResponse<{
    unmarkedClasses: Array<{
      classId: string
      className: string
      periodName: string
      teacherId: string
      teacherName: string
      scheduledTime: string
    }>
    totalClasses: number
    markedClasses: number
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get today's date and day of week
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday

    // Get active term
    const activeTerm = await db.term.findFirst({
      where: { schoolId, isActive: true },
    })

    if (!activeTerm) {
      return {
        success: true,
        data: {
          unmarkedClasses: [],
          totalClasses: 0,
          markedClasses: 0,
        },
      }
    }

    // Get today's timetable entries for the active term
    const timetableEntries = await db.timetable.findMany({
      where: {
        schoolId,
        termId: activeTerm.id,
        dayOfWeek,
      },
      include: {
        period: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
          },
        },
      },
    })

    // Get today's attendance records that have a periodId
    const todayAttendanceRecords = await db.attendance.findMany({
      where: {
        schoolId,
        date: today,
        periodId: { not: null },
      },
      select: {
        periodId: true,
        classId: true,
      },
    })

    // Create a Set of marked period-class combinations
    const markedPeriodClasses = new Set(
      todayAttendanceRecords.map((a) => `${a.periodId}-${a.classId}`)
    )

    // Find unmarked classes
    const unmarkedClasses = timetableEntries
      .filter((entry) => {
        const key = `${entry.periodId}-${entry.classId}`
        return !markedPeriodClasses.has(key)
      })
      .map((entry) => ({
        classId: entry.class.id,
        className: entry.class.name,
        periodName: entry.period.name,
        teacherId: entry.teacher.id,
        teacherName: `${entry.teacher.givenName} ${entry.teacher.surname}`,
        scheduledTime: `${entry.period.startTime} - ${entry.period.endTime}`,
      }))

    return {
      success: true,
      data: {
        unmarkedClasses,
        totalClasses: timetableEntries.length,
        markedClasses: timetableEntries.length - unmarkedClasses.length,
      },
    }
  } catch (error) {
    console.error("[getUnmarkedClasses] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get unmarked classes",
    }
  }
}

/**
 * Get parent-facing attendance summary for their children
 * Returns attendance stats for each child linked to the guardian
 */
export async function getParentAttendanceSummary(): Promise<
  ActionResponse<{
    children: Array<{
      studentId: string
      studentName: string
      className: string
      stats: {
        totalDays: number
        present: number
        absent: number
        late: number
        excused: number
        attendanceRate: number
      }
      recentAbsences: Array<{
        date: string
        status: string
        className: string
      }>
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Find guardian record for the logged-in user
    const guardian = await db.guardian.findUnique({
      where: { userId: session.user.id },
    })

    if (!guardian) {
      return { success: false, error: "Guardian record not found" }
    }

    // Get the guardian's children via StudentGuardian
    const studentGuardians = await db.studentGuardian.findMany({
      where: { guardianId: guardian.id, schoolId },
      include: {
        student: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            studentClasses: {
              include: {
                class: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
      },
    })

    if (studentGuardians.length === 0) {
      return {
        success: true,
        data: { children: [] },
      }
    }

    // Get the active term for date range
    const activeTerm = await db.term.findFirst({
      where: { schoolId, isActive: true },
    })

    const termStart =
      activeTerm?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Build attendance summary for each child
    const children = await Promise.all(
      studentGuardians.map(async (sg) => {
        const student = sg.student

        // Get class name from first enrolled class
        const className = student.studentClasses[0]?.class.name || "Unassigned"

        // Count attendance by status
        const statusCounts = await db.attendance.groupBy({
          by: ["status"],
          where: {
            schoolId,
            studentId: student.id,
            date: { gte: termStart },
            deletedAt: null,
            periodId: null, // Daily attendance only
          },
          _count: true,
        })

        const stats = {
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
        }

        for (const sc of statusCounts) {
          stats.totalDays += sc._count
          if (sc.status === "PRESENT") stats.present = sc._count
          if (sc.status === "ABSENT") stats.absent = sc._count
          if (sc.status === "LATE") stats.late = sc._count
          if (sc.status === "EXCUSED") stats.excused = sc._count
        }

        stats.attendanceRate =
          stats.totalDays > 0
            ? Math.round(
                ((stats.present + stats.late) / stats.totalDays) * 1000
              ) / 10
            : 100

        // Get recent absences (last 5)
        const recentAbsences = await db.attendance.findMany({
          where: {
            schoolId,
            studentId: student.id,
            status: { in: ["ABSENT", "LATE", "EXCUSED"] },
            deletedAt: null,
            periodId: null,
          },
          include: {
            class: { select: { name: true } },
          },
          orderBy: { date: "desc" },
          take: 5,
        })

        return {
          studentId: student.id,
          studentName: `${student.givenName} ${student.surname}`,
          className,
          stats,
          recentAbsences: recentAbsences.map((a) => ({
            date: a.date.toISOString().split("T")[0],
            status: a.status,
            className: a.class.name,
          })),
        }
      })
    )

    return {
      success: true,
      data: { children },
    }
  } catch (error) {
    console.error("[getParentAttendanceSummary] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get parent attendance summary",
    }
  }
}
