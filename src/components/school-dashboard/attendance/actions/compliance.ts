"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceDashboard {
  attendanceRate: number
  chronicAbsentees: number
  recentPolicyTriggers: Array<{
    id: string
    studentName: string
    tier: number
    absenceCount: number
    action: string
    status: string
    createdAt: Date
  }>
  pendingActions: number
}

interface ComplianceReport {
  byClass: Array<{
    classId: string
    className: string
    totalStudents: number
    attendanceRate: number
    absentCount: number
  }>
  atRiskStudents: Array<{
    studentId: string
    studentName: string
    totalAbsences: number
    attendanceRate: number
    lastAbsence: Date | null
  }>
  policyCompliance: {
    totalTriggers: number
    pendingTriggers: number
    resolvedTriggers: number
  }
}

interface ScheduledReport {
  id: string
  name: string
  description: string | null
  type: string
  frequency: string
  recipients: string[]
  isActive: boolean
  lastRunAt: Date | null
  nextRunAt: Date | null
}

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

/**
 * Get compliance overview for the school
 * Returns attendance rate, chronic absentees, recent policy triggers, and pending actions
 */
export async function getComplianceDashboard(): Promise<
  ActionResponse<ComplianceDashboard>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // 1. Get active term
    const term = await db.term.findFirst({
      where: { schoolId, isActive: true },
    })

    if (!term) {
      return {
        success: false,
        error: "No active term found. Please activate a term first.",
      }
    }

    // 2. Get attendance statistics for current term
    const attendanceRecords = await db.attendance.groupBy({
      by: ["status"],
      where: {
        schoolId,
        date: { gte: term.startDate },
        deletedAt: null,
        periodId: null, // Only daily attendance
      },
      _count: true,
    })

    // Calculate overall attendance rate
    const totalRecords = attendanceRecords.reduce(
      (sum, record) => sum + record._count,
      0
    )
    const presentRecords =
      attendanceRecords.find((r) => r.status === "PRESENT")?._count || 0
    const attendanceRate =
      totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0

    // 3. Get chronic absentees (students with >10% absence rate)
    const absencesByStudent = await db.attendance.groupBy({
      by: ["studentId"],
      where: {
        schoolId,
        status: "ABSENT",
        date: { gte: term.startDate },
        deletedAt: null,
        periodId: null,
      },
      _count: true,
    })

    // Get total attendance records per student to calculate percentage
    const studentIds = absencesByStudent.map((a) => a.studentId)
    const totalByStudent = await db.attendance.groupBy({
      by: ["studentId"],
      where: {
        schoolId,
        studentId: { in: studentIds },
        date: { gte: term.startDate },
        deletedAt: null,
        periodId: null,
      },
      _count: true,
    })

    const totalMap = new Map(totalByStudent.map((t) => [t.studentId, t._count]))

    // Count students with >10% absence rate
    const chronicAbsentees = absencesByStudent.filter((a) => {
      const total = totalMap.get(a.studentId) || 0
      const absenceRate = total > 0 ? (a._count / total) * 100 : 0
      return absenceRate > 10
    }).length

    // 4. Get recent policy triggers with student names
    const recentTriggers = await db.policyTrigger.findMany({
      where: { schoolId },
      include: {
        student: {
          select: { givenName: true, surname: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    const recentPolicyTriggers = recentTriggers.map((trigger) => ({
      id: trigger.id,
      studentName: `${trigger.student.givenName} ${trigger.student.surname}`,
      tier: trigger.tier,
      absenceCount: trigger.absenceCount,
      action: trigger.action,
      status: trigger.status,
      createdAt: trigger.createdAt,
    }))

    // 5. Get pending actions count
    const pendingActions = await db.policyTrigger.count({
      where: { schoolId, status: "PENDING" },
    })

    return {
      success: true,
      data: {
        attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
        chronicAbsentees,
        recentPolicyTriggers,
        pendingActions,
      },
    }
  } catch (error) {
    console.error("[getComplianceDashboard] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get compliance dashboard",
    }
  }
}

// ============================================================================
// COMPLIANCE REPORT
// ============================================================================

/**
 * Get detailed compliance report with optional filters
 * Returns data by class, at-risk students, and policy compliance stats
 */
export async function getComplianceReport(input?: {
  dateFrom?: string
  dateTo?: string
  classId?: string
}): Promise<ActionResponse<ComplianceReport>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (input?.dateFrom) {
      dateFilter.gte = new Date(input.dateFrom)
    }
    if (input?.dateTo) {
      dateFilter.lte = new Date(input.dateTo)
    }

    // If no date range, use active term
    if (!input?.dateFrom && !input?.dateTo) {
      const term = await db.term.findFirst({
        where: { schoolId, isActive: true },
      })
      if (term) {
        dateFilter.gte = term.startDate
      }
    }

    const whereClause: {
      schoolId: string
      date?: { gte?: Date; lte?: Date }
      classId?: string
      deletedAt: null
      periodId: null
    } = {
      schoolId,
      deletedAt: null,
      periodId: null,
    }

    if (Object.keys(dateFilter).length > 0) {
      whereClause.date = dateFilter
    }

    if (input?.classId) {
      whereClause.classId = input.classId
    }

    // 1. Get attendance by class
    const attendanceByClass = await db.attendance.groupBy({
      by: ["classId", "status"],
      where: whereClause,
      _count: true,
    })

    // Get class names
    const classIds = [...new Set(attendanceByClass.map((a) => a.classId))]
    const classes = await db.class.findMany({
      where: { id: { in: classIds }, schoolId },
      select: { id: true, name: true },
    })

    const classMap = new Map(classes.map((c) => [c.id, c.name]))

    // Get student counts per class
    const studentCounts = await db.studentClass.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds }, schoolId },
      _count: { studentId: true },
    })

    const studentCountMap = new Map(
      studentCounts.map((s) => [s.classId, s._count.studentId])
    )

    // Calculate class statistics
    const classSummary = new Map<
      string,
      { total: number; present: number; absent: number }
    >()

    attendanceByClass.forEach((record) => {
      const classId = record.classId
      if (!classSummary.has(classId)) {
        classSummary.set(classId, { total: 0, present: 0, absent: 0 })
      }
      const summary = classSummary.get(classId)!
      summary.total += record._count
      if (record.status === "PRESENT") {
        summary.present += record._count
      } else if (record.status === "ABSENT") {
        summary.absent += record._count
      }
    })

    const byClass = Array.from(classSummary.entries()).map(
      ([classId, stats]) => ({
        classId,
        className: classMap.get(classId) || "Unknown Class",
        totalStudents: studentCountMap.get(classId) || 0,
        attendanceRate:
          stats.total > 0
            ? Math.round((stats.present / stats.total) * 1000) / 10
            : 0,
        absentCount: stats.absent,
      })
    )

    // 2. Get at-risk students (>10 absences in period)
    const absencesByStudent = await db.attendance.groupBy({
      by: ["studentId"],
      where: {
        ...whereClause,
        status: "ABSENT",
      },
      _count: true,
      having: {
        studentId: { _count: { gt: 10 } },
      },
    })

    const atRiskStudentIds = absencesByStudent.map((a) => a.studentId)
    const students = await db.student.findMany({
      where: { id: { in: atRiskStudentIds }, schoolId },
      select: { id: true, givenName: true, surname: true },
    })

    const studentMap = new Map(
      students.map((s) => [s.id, `${s.givenName} ${s.surname}`])
    )

    // Get total attendance per at-risk student
    const totalByStudent = await db.attendance.groupBy({
      by: ["studentId"],
      where: {
        ...whereClause,
        studentId: { in: atRiskStudentIds },
      },
      _count: true,
    })

    const totalMap = new Map(totalByStudent.map((t) => [t.studentId, t._count]))

    // Get last absence date for each student
    const lastAbsences = await db.attendance.groupBy({
      by: ["studentId"],
      where: {
        ...whereClause,
        status: "ABSENT",
        studentId: { in: atRiskStudentIds },
      },
      _max: { date: true },
    })

    const lastAbsenceMap = new Map(
      lastAbsences.map((l) => [l.studentId, l._max.date])
    )

    const atRiskStudents = absencesByStudent.map((a) => {
      const total = totalMap.get(a.studentId) || 0
      const attendanceRate =
        total > 0 ? Math.round(((total - a._count) / total) * 1000) / 10 : 0

      return {
        studentId: a.studentId,
        studentName: studentMap.get(a.studentId) || "Unknown Student",
        totalAbsences: a._count,
        attendanceRate,
        lastAbsence: lastAbsenceMap.get(a.studentId) || null,
      }
    })

    // 3. Get policy compliance statistics
    const policyTriggers = await db.policyTrigger.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: true,
    })

    const totalTriggers = policyTriggers.reduce((sum, t) => sum + t._count, 0)
    const pendingTriggers =
      policyTriggers.find((t) => t.status === "PENDING")?._count || 0
    const resolvedTriggers =
      policyTriggers.find((t) => t.status === "COMPLETED")?._count || 0

    return {
      success: true,
      data: {
        byClass,
        atRiskStudents,
        policyCompliance: {
          totalTriggers,
          pendingTriggers,
          resolvedTriggers,
        },
      },
    }
  } catch (error) {
    console.error("[getComplianceReport] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get compliance report",
    }
  }
}

// ============================================================================
// SCHEDULED REPORTS
// ============================================================================

/**
 * Get list of configured report schedules
 */
export async function getScheduledReports(): Promise<
  ActionResponse<{ reports: ScheduledReport[] }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const reports = await db.attendanceReport.findMany({
      where: { schoolId, isActive: true },
      orderBy: { nextRunAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        frequency: true,
        recipients: true,
        isActive: true,
        lastRunAt: true,
        nextRunAt: true,
      },
    })

    return {
      success: true,
      data: { reports },
    }
  } catch (error) {
    console.error("[getScheduledReports] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get scheduled reports",
    }
  }
}
