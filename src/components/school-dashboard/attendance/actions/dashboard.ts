"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  isAdminRole,
  isStaffRole,
} from "@/components/school-dashboard/attendance/authorization"

import {
  loadAttendanceFollowUp,
  loadTodaysAttendanceDashboard,
  type AttendanceFollowUp,
  type TodaysAttendanceDashboard,
} from "../queries"
import type { ActionResponse } from "./core"
import { getTeacherSectionIds, sectionScopeWhere } from "./helpers"
import type { AttendanceRiskLevel } from "./interventions"

interface StudentRiskData {
  studentId: string
  studentName: string
  sectionId: string | null
  sectionName: string | null
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
  sectionId?: string
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
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const session = await auth()
    if (!session?.user?.role || !isStaffRole(session.user.role as any)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Default to current school year (last 90 days if not specified)
    const dateFrom = input?.dateFrom
      ? new Date(input.dateFrom)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const dateTo = input?.dateTo ? new Date(input.dateTo) : new Date()

    // Teacher scoping: their sections; a section filter is intersected
    // with them, never allowed to widen the scope.
    const teacherSectionIds =
      session.user.role === "TEACHER"
        ? await getTeacherSectionIds(schoolId, session.user.id!)
        : null
    const scope = sectionScopeWhere({
      teacherSectionIds,
      sectionId: input?.sectionId,
    })

    // Get all students with their attendance
    const where: Prisma.StudentWhereInput = { schoolId }
    if (scope.sectionId) where.sectionId = scope.sectionId

    const attendanceWhere: Prisma.AttendanceWhereInput = {
      date: { gte: dateFrom, lte: dateTo },
      schoolId,
      deletedAt: null,
    }
    if (scope.sectionId) attendanceWhere.sectionId = scope.sectionId

    const students = await db.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        section: { select: { id: true, name: true } },
        attendances: {
          where: attendanceWhere,
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

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        sectionId: student.section?.id ?? null,
        sectionName: student.section?.name ?? null,
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

    const session = await auth()
    if (!session?.user?.role || !isStaffRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get last 90 days of attendance
    const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        section: { select: { id: true, name: true } },
        attendances: {
          where: { date: { gte: dateFrom }, schoolId, deletedAt: null },
          orderBy: { date: "desc" },
          include: {
            section: { select: { name: true } },
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
        className: a.section?.name ?? "",
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

    return {
      success: true,
      data: {
        student: {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          sectionId: student.section?.id ?? null,
          sectionName: student.section?.name ?? null,
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
  ActionResponse<TodaysAttendanceDashboard>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.role || !isStaffRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized" }
    }

    return {
      success: true,
      data: await loadTodaysAttendanceDashboard({
        schoolId,
        userId: session.user.id!,
        role: session.user.role,
      }),
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
 * Get students needing follow-up
 */
export async function getFollowUpStudents(input?: {
  limit?: number
}): Promise<ActionResponse<AttendanceFollowUp>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.role || !isStaffRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized" }
    }

    return {
      success: true,
      data: await loadAttendanceFollowUp({
        schoolId,
        userId: session.user.id!,
        role: session.user.role,
        limit: input?.limit,
      }),
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

    // Find guardian record for the logged-in user (scoped to the tenant to
    // prevent reading a guardian record that belongs to another school).
    const guardian = await db.guardian.findFirst({
      where: { userId: session.user.id, schoolId },
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
            firstName: true,
            lastName: true,
            section: { select: { name: true } },
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

    // PERF: two batched queries across ALL children instead of two per child
    // (was an N+1: one groupBy + one findMany inside a per-child Promise.all).
    const childIds = studentGuardians.map((sg) => sg.student.id)

    const [statusGroups, absenceRows] = await Promise.all([
      db.attendance.groupBy({
        by: ["studentId", "status"],
        where: {
          schoolId,
          studentId: { in: childIds },
          date: { gte: termStart },
          deletedAt: null,
          periodId: null, // Daily attendance only
        },
        _count: true,
      }),
      db.attendance.findMany({
        where: {
          schoolId,
          studentId: { in: childIds },
          status: { in: ["ABSENT", "LATE", "EXCUSED"] },
          deletedAt: null,
          periodId: null,
          date: { gte: termStart },
        },
        include: {
          section: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
    ])

    type ChildStats = {
      totalDays: number
      present: number
      absent: number
      late: number
      excused: number
      attendanceRate: number
    }
    const statsByStudent = new Map<string, ChildStats>()
    for (const id of childIds) {
      statsByStudent.set(id, {
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0,
      })
    }
    for (const g of statusGroups) {
      const s = statsByStudent.get(g.studentId)
      if (!s) continue
      s.totalDays += g._count
      if (g.status === "PRESENT") s.present = g._count
      else if (g.status === "ABSENT") s.absent = g._count
      else if (g.status === "LATE") s.late = g._count
      else if (g.status === "EXCUSED") s.excused = g._count
    }
    for (const s of statsByStudent.values()) {
      s.attendanceRate =
        s.totalDays > 0
          ? Math.round(((s.present + s.late) / s.totalDays) * 1000) / 10
          : 100
    }

    // Recent absences (most recent 5 per child) — rows arrive date-desc.
    const absencesByStudent = new Map<
      string,
      Array<{ date: string; status: string; className: string }>
    >()
    for (const id of childIds) absencesByStudent.set(id, [])
    for (const a of absenceRows) {
      const list = absencesByStudent.get(a.studentId)
      if (list && list.length < 5) {
        list.push({
          date: a.date.toISOString().split("T")[0],
          status: a.status,
          className: a.section?.name ?? "",
        })
      }
    }

    const children = studentGuardians.map((sg) => {
      const student = sg.student
      // The child's section. Empty, not "Unassigned": a server action cannot
      // know the reader's language, and the overview hides an empty line.
      const className = student.section?.name ?? ""
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        className,
        stats: statsByStudent.get(student.id)!,
        recentAbsences: absencesByStudent.get(student.id) ?? [],
      }
    })

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
