"use server"

import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type {
  InterventionStatus as InterventionStatusVal,
  InterventionType as InterventionTypeVal,
} from "../validation"
import type { ActionResponse } from "./core"

// ============================================================================
// HELPER TYPES & FUNCTIONS
// ============================================================================

export type AttendanceRiskLevel =
  | "SATISFACTORY"
  | "AT_RISK"
  | "MODERATELY_CHRONIC"
  | "SEVERELY_CHRONIC"

function calculateRiskLevel(rate: number): AttendanceRiskLevel {
  if (rate >= 95) return "SATISFACTORY"
  if (rate >= 90) return "AT_RISK"
  if (rate >= 80) return "MODERATELY_CHRONIC"
  return "SEVERELY_CHRONIC"
}

// ============================================================================
// INTERVENTION TRACKING ACTIONS
// ============================================================================

/**
 * Create a new intervention for a student
 */
export async function createIntervention(input: {
  studentId: string
  type: InterventionTypeVal
  title: string
  description: string
  priority?: number
  scheduledDate?: string
  assignedTo?: string
  tags?: string[]
}): Promise<ActionResponse<{ interventionId: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can create interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can create interventions",
      }
    }

    // Verify student exists
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const intervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId: input.studentId,
        type: input.type,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 2,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : null,
        assignedTo: input.assignedTo,
        initiatedBy: session.user.id,
        tags: input.tags ?? [],
        status: "SCHEDULED",
      },
    })

    return { success: true, data: { interventionId: intervention.id } }
  } catch (error) {
    console.error("[createIntervention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create intervention",
    }
  }
}

/**
 * Update an existing intervention (status, outcome, etc.)
 */
export async function updateIntervention(input: {
  interventionId: string
  status?: InterventionStatusVal
  outcome?: string
  completedDate?: string
  followUpDate?: string
  parentNotified?: boolean
  contactMethod?: string
  contactResult?: string
  assignedTo?: string
  priority?: number
}): Promise<ActionResponse<{ updated: boolean }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can update interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can update interventions",
      }
    }

    // Verify intervention exists and belongs to this school
    const existing = await db.attendanceIntervention.findFirst({
      where: { id: input.interventionId, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Intervention not found" }
    }

    await db.attendanceIntervention.update({
      where: { id: input.interventionId },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.outcome && { outcome: input.outcome }),
        ...(input.completedDate && {
          completedDate: new Date(input.completedDate),
        }),
        ...(input.followUpDate && {
          followUpDate: new Date(input.followUpDate),
        }),
        ...(input.parentNotified !== undefined && {
          parentNotified: input.parentNotified,
        }),
        ...(input.contactMethod && { contactMethod: input.contactMethod }),
        ...(input.contactResult && { contactResult: input.contactResult }),
        ...(input.assignedTo && { assignedTo: input.assignedTo }),
        ...(input.priority && { priority: input.priority }),
      },
    })

    return { success: true, data: { updated: true } }
  } catch (error) {
    console.error("[updateIntervention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update intervention",
    }
  }
}

/**
 * Escalate an intervention to a higher level
 */
export async function escalateIntervention(input: {
  interventionId: string
  newType: InterventionTypeVal
  title: string
  description: string
  assignedTo?: string
}): Promise<ActionResponse<{ newInterventionId: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can escalate interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can escalate interventions",
      }
    }

    // Get the existing intervention
    const existing = await db.attendanceIntervention.findFirst({
      where: { id: input.interventionId, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Intervention not found" }
    }

    // Update old intervention to ESCALATED status
    await db.attendanceIntervention.update({
      where: { id: input.interventionId },
      data: {
        status: "ESCALATED",
        completedDate: new Date(),
      },
    })

    // Create new escalated intervention
    const newIntervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId: existing.studentId,
        type: input.newType,
        title: input.title,
        description: input.description,
        priority: Math.min(existing.priority + 1, 4), // Increase priority, max 4
        assignedTo: input.assignedTo,
        initiatedBy: session.user.id,
        escalatedFrom: existing.id,
        status: "SCHEDULED",
        tags: existing.tags,
      },
    })

    return { success: true, data: { newInterventionId: newIntervention.id } }
  } catch (error) {
    console.error("[escalateIntervention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to escalate intervention",
    }
  }
}

/**
 * Get interventions for a specific student
 */
export async function getStudentInterventions(studentId: string): Promise<
  ActionResponse<{
    interventions: Array<{
      id: string
      type: string
      title: string
      description: string
      status: string
      priority: number
      scheduledDate: string | null
      completedDate: string | null
      followUpDate: string | null
      initiatedBy: string
      initiatorName: string | null
      assignedTo: string | null
      assigneeName: string | null
      parentNotified: boolean
      outcome: string | null
      createdAt: string
    }>
    summary: {
      total: number
      scheduled: number
      inProgress: number
      completed: number
      escalated: number
    }
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

    // Only staff can view interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can view interventions",
      }
    }

    // Verify student exists
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const interventions = await db.attendanceIntervention.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: "desc" },
    })

    // Get user names for initiators and assignees
    const userIds = [
      ...new Set([
        ...interventions.map((i) => i.initiatedBy),
        ...interventions
          .filter((i) => i.assignedTo)
          .map((i) => i.assignedTo as string),
      ]),
    ]

    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true },
    })

    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    // Calculate summary
    const summary = {
      total: interventions.length,
      scheduled: interventions.filter((i) => i.status === "SCHEDULED").length,
      inProgress: interventions.filter((i) => i.status === "IN_PROGRESS")
        .length,
      completed: interventions.filter((i) => i.status === "COMPLETED").length,
      escalated: interventions.filter((i) => i.status === "ESCALATED").length,
    }

    return {
      success: true,
      data: {
        interventions: interventions.map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          description: i.description,
          status: i.status,
          priority: i.priority,
          scheduledDate: i.scheduledDate?.toISOString() || null,
          completedDate: i.completedDate?.toISOString() || null,
          followUpDate: i.followUpDate?.toISOString() || null,
          initiatedBy: i.initiatedBy,
          initiatorName: userMap.get(i.initiatedBy) || null,
          assignedTo: i.assignedTo,
          assigneeName: i.assignedTo ? userMap.get(i.assignedTo) || null : null,
          parentNotified: i.parentNotified,
          outcome: i.outcome,
          createdAt: i.createdAt.toISOString(),
        })),
        summary,
      },
    }
  } catch (error) {
    console.error("[getStudentInterventions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get student interventions",
    }
  }
}

/**
 * Get all pending/active interventions for dashboard
 */
export async function getActiveInterventions(input?: {
  assignedTo?: string
  status?: InterventionStatusVal
  limit?: number
}): Promise<
  ActionResponse<{
    interventions: Array<{
      id: string
      studentId: string
      studentName: string
      className: string | null
      type: string
      title: string
      status: string
      priority: number
      scheduledDate: string | null
      assigneeName: string | null
      riskLevel: AttendanceRiskLevel
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

    // Only staff can view interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can view interventions",
      }
    }

    const where: Prisma.AttendanceInterventionWhereInput = {
      schoolId,
      status: input?.status || { in: ["SCHEDULED", "IN_PROGRESS"] },
      ...(input?.assignedTo && { assignedTo: input.assignedTo }),
    }

    const interventions = await db.attendanceIntervention.findMany({
      where,
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
            attendances: {
              where: {
                date: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                },
              },
              select: { status: true },
            },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { scheduledDate: "asc" }],
      take: input?.limit ?? 50,
    })

    // Get assignee names
    const assigneeIds = [
      ...new Set(
        interventions
          .filter((i) => i.assignedTo)
          .map((i) => i.assignedTo as string)
      ),
    ]
    const users = await db.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        interventions: interventions.map((intervention) => {
          // Calculate risk level from attendance
          const totalDays = intervention.student.attendances.length
          const presentDays = intervention.student.attendances.filter(
            (a: { status: string }) =>
              a.status === "PRESENT" || a.status === "LATE"
          ).length
          const rate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100
          const riskLevel = calculateRiskLevel(rate)

          return {
            id: intervention.id,
            studentId: intervention.studentId,
            studentName: `${intervention.student.givenName} ${intervention.student.surname}`,
            className:
              intervention.student.studentClasses[0]?.class.name || null,
            type: intervention.type,
            title: intervention.title,
            status: intervention.status,
            priority: intervention.priority,
            scheduledDate: intervention.scheduledDate?.toISOString() || null,
            assigneeName: intervention.assignedTo
              ? userMap.get(intervention.assignedTo) || null
              : null,
            riskLevel,
          }
        }),
      },
    }
  } catch (error) {
    console.error("[getActiveInterventions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get active interventions",
    }
  }
}

/**
 * Get all interventions with filtering and pagination
 */
export async function getAllInterventions(input?: {
  status?: InterventionStatusVal | InterventionStatusVal[]
  type?: InterventionTypeVal
  studentId?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}): Promise<
  ActionResponse<{
    interventions: Array<{
      id: string
      studentId: string
      studentName: string
      className: string | null
      type: string
      title: string
      description: string | null
      status: string
      priority: number
      scheduledDate: string | null
      completedDate: string | null
      assigneeName: string | null
      outcome: string | null
      createdAt: string
      riskLevel: AttendanceRiskLevel
    }>
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
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

    // Only staff can view interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF" &&
      session.user.role !== "DEVELOPER"
    ) {
      return {
        success: false,
        error: "Only staff members can view interventions",
      }
    }

    const page = input?.page ?? 1
    const limit = input?.limit ?? 20
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.AttendanceInterventionWhereInput = {
      schoolId,
      ...(input?.status && {
        status: Array.isArray(input.status)
          ? { in: input.status }
          : input.status,
      }),
      ...(input?.type && { type: input.type }),
      ...(input?.studentId && { studentId: input.studentId }),
      ...(input?.assignedTo && { assignedTo: input.assignedTo }),
      ...(input?.dateFrom && {
        createdAt: { gte: new Date(input.dateFrom) },
      }),
      ...(input?.dateTo && {
        createdAt: { lte: new Date(input.dateTo) },
      }),
      ...(input?.search && {
        OR: [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          {
            student: {
              OR: [
                { givenName: { contains: input.search, mode: "insensitive" } },
                { surname: { contains: input.search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    }

    // Get total count for pagination
    const total = await db.attendanceIntervention.count({ where })

    const interventions = await db.attendanceIntervention.findMany({
      where,
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
            attendances: {
              where: {
                date: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
              },
              select: { status: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    })

    // Get assignee names
    const assigneeIds = [
      ...new Set(
        interventions
          .filter((i) => i.assignedTo)
          .map((i) => i.assignedTo as string)
      ),
    ]
    const users = await db.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        interventions: interventions.map((intervention) => {
          // Calculate risk level from attendance
          const totalDays = intervention.student.attendances.length
          const presentDays = intervention.student.attendances.filter(
            (a: { status: string }) =>
              a.status === "PRESENT" || a.status === "LATE"
          ).length
          const rate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100
          const riskLevel = calculateRiskLevel(rate)

          return {
            id: intervention.id,
            studentId: intervention.studentId,
            studentName: `${intervention.student.givenName} ${intervention.student.surname}`,
            className:
              intervention.student.studentClasses[0]?.class.name || null,
            type: intervention.type,
            title: intervention.title,
            description: intervention.description,
            status: intervention.status,
            priority: intervention.priority,
            scheduledDate: intervention.scheduledDate?.toISOString() || null,
            completedDate: intervention.completedDate?.toISOString() || null,
            assigneeName: intervention.assignedTo
              ? userMap.get(intervention.assignedTo) || null
              : null,
            outcome: intervention.outcome,
            createdAt: intervention.createdAt.toISOString(),
            riskLevel,
          }
        }),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("[getAllInterventions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get interventions",
    }
  }
}

/**
 * Get intervention statistics for reporting
 */
export async function getInterventionStats(): Promise<
  ActionResponse<{
    byType: Array<{ type: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
    byMonth: Array<{ month: string; created: number; completed: number }>
    successRate: number
    averageDaysToComplete: number
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

    // Only admins can view stats
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can view intervention statistics",
      }
    }

    // Get all interventions for this school
    const interventions = await db.attendanceIntervention.findMany({
      where: { schoolId },
      select: {
        type: true,
        status: true,
        createdAt: true,
        completedDate: true,
      },
    })

    // Group by type
    const byType = Object.entries(
      interventions.reduce(
        (acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    ).map(([type, count]) => ({ type, count }))

    // Group by status
    const byStatus = Object.entries(
      interventions.reduce(
        (acc, i) => {
          acc[i.status] = (acc[i.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    ).map(([status, count]) => ({ status, count }))

    // Group by month (last 12 months)
    const now = new Date()
    const byMonth: Array<{
      month: string
      created: number
      completed: number
    }> = []

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthKey = monthDate.toISOString().slice(0, 7) // YYYY-MM

      const created = interventions.filter((int) => {
        const d = new Date(int.createdAt)
        return d >= monthDate && d <= monthEnd
      }).length

      const completed = interventions.filter((int) => {
        if (!int.completedDate) return false
        const d = new Date(int.completedDate)
        return d >= monthDate && d <= monthEnd
      }).length

      byMonth.push({ month: monthKey, created, completed })
    }

    // Calculate success rate (completed vs total excluding scheduled)
    const nonScheduled = interventions.filter((i) => i.status !== "SCHEDULED")
    const completed = interventions.filter((i) => i.status === "COMPLETED")
    const successRate =
      nonScheduled.length > 0
        ? (completed.length / nonScheduled.length) * 100
        : 0

    // Calculate average days to complete
    const completedWithDates = interventions.filter((i) => i.completedDate)
    let totalDays = 0
    completedWithDates.forEach((i) => {
      if (i.completedDate) {
        const days = Math.floor(
          (new Date(i.completedDate).getTime() -
            new Date(i.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        totalDays += days
      }
    })
    const averageDaysToComplete =
      completedWithDates.length > 0 ? totalDays / completedWithDates.length : 0

    return {
      success: true,
      data: {
        byType,
        byStatus,
        byMonth,
        successRate: Math.round(successRate * 10) / 10,
        averageDaysToComplete: Math.round(averageDaysToComplete * 10) / 10,
      },
    }
  } catch (error) {
    console.error("[getInterventionStats] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get intervention statistics",
    }
  }
}

/**
 * Get staff members who can be assigned interventions
 */
export async function getInterventionAssignees(): Promise<
  ActionResponse<{
    assignees: Array<{
      id: string
      name: string
      role: string
      activeInterventions: number
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

    // Get all staff users for this school
    const staffUsers = await db.user.findMany({
      where: {
        schoolId,
        role: { in: ["ADMIN", "TEACHER", "STAFF"] },
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    // Get count of active interventions per assignee
    const activeCounts = await db.attendanceIntervention.groupBy({
      by: ["assignedTo"],
      where: {
        schoolId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        assignedTo: { not: null },
      },
      _count: true,
    })

    const countMap = new Map(activeCounts.map((c) => [c.assignedTo, c._count]))

    return {
      success: true,
      data: {
        assignees: staffUsers.map((u) => ({
          id: u.id,
          name: u.username || u.email || "Unknown",
          role: u.role,
          activeInterventions: countMap.get(u.id) || 0,
        })),
      },
    }
  } catch (error) {
    console.error("[getInterventionAssignees] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get assignees",
    }
  }
}
