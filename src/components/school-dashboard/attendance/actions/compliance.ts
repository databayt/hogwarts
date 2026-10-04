"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { isAdminRole } from "@/components/school-dashboard/attendance/authorization"

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
  bySection: Array<{
    sectionId: string
    sectionName: string
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
    // SECURITY: PERMISSION_MATRIX.view_compliance is DEVELOPER/ADMIN only —
    // was canViewSchoolAnalytics (which also admits TEACHER/STAFF).
    if (!isAdminRole(session.user.role as any)) {
      return {
        success: false,
        error: "Unauthorized: insufficient role for compliance data",
      }
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
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    const recentPolicyTriggers = recentTriggers.map((trigger) => ({
      id: trigger.id,
      studentName: `${trigger.student.firstName} ${trigger.student.lastName}`,
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
 * Returns data by section, at-risk students, and policy compliance stats
 */
export async function getComplianceReport(input?: {
  dateFrom?: string
  dateTo?: string
  sectionId?: string
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
    // SECURITY: matrix-aligned — view_compliance is DEVELOPER/ADMIN only.
    if (!isAdminRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized: insufficient role" }
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
      sectionId?: string
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

    if (input?.sectionId) {
      whereClause.sectionId = input.sectionId
    }

    // 1. Get attendance by section
    const attendanceBySection = await db.attendance.groupBy({
      by: ["sectionId", "status"],
      where: whereClause,
      _count: true,
    })

    // Section names and student counts
    const sectionIds = [
      ...new Set(attendanceBySection.map((a) => a.sectionId)),
    ].filter((id): id is string => id !== null)
    const sections = await db.section.findMany({
      where: { id: { in: sectionIds }, schoolId },
      select: { id: true, name: true, _count: { select: { students: true } } },
    })

    const sectionMap = new Map(sections.map((c) => [c.id, c]))

    // Calculate section statistics
    const sectionSummary = new Map<
      string,
      { total: number; present: number; absent: number }
    >()

    attendanceBySection.forEach((record) => {
      const sectionId = record.sectionId
      if (!sectionId) return
      if (!sectionSummary.has(sectionId)) {
        sectionSummary.set(sectionId, { total: 0, present: 0, absent: 0 })
      }
      const summary = sectionSummary.get(sectionId)!
      summary.total += record._count
      if (record.status === "PRESENT") {
        summary.present += record._count
      } else if (record.status === "ABSENT") {
        summary.absent += record._count
      }
    })

    const bySection = Array.from(sectionSummary.entries()).map(
      ([sectionId, stats]) => ({
        sectionId,
        sectionName: sectionMap.get(sectionId)?.name ?? "",
        totalStudents: sectionMap.get(sectionId)?._count.students ?? 0,
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
      select: { id: true, firstName: true, lastName: true },
    })

    const studentMap = new Map(
      students.map((s) => [s.id, `${s.firstName} ${s.lastName}`])
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
        bySection,
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
    if (!isAdminRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized: admin access required" }
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
