/**
 * MTSS Tiered Intervention Server Actions
 *
 * Server actions for managing tiered interventions aligned with MTSS framework.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { InterventionStatus, InterventionType } from "@prisma/client"

import { db } from "@/lib/db"

import {
  getRecommendedActions,
  getTierFromAbsenceRate,
  TIER_THRESHOLDS,
  type CreateTieredInterventionInput,
  type TierLevel,
  type UpdateInterventionStatusInput,
} from "./validation"

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

// Map tier actions to intervention types
const actionToInterventionType: Record<string, InterventionType> = {
  WELCOME_MESSAGE: "OTHER",
  POSITIVE_RECOGNITION: "INCENTIVE_PROGRAM",
  ATTENDANCE_INCENTIVE: "INCENTIVE_PROGRAM",
  CLASS_COMPETITION: "INCENTIVE_PROGRAM",
  PERFECT_ATTENDANCE_CERTIFICATE: "INCENTIVE_PROGRAM",
  PARENT_PHONE_CALL: "PARENT_PHONE_CALL",
  PARENT_EMAIL: "PARENT_EMAIL",
  COUNSELOR_CHECK_IN: "COUNSELOR_REFERRAL",
  ACADEMIC_SUPPORT_REFERRAL: "ACADEMIC_SUPPORT",
  ATTENDANCE_LETTER_1: "OTHER",
  MENTOR_ASSIGNMENT: "MENTORSHIP_ASSIGNMENT",
  PARENT_CONFERENCE_REQUEST: "PARENT_MEETING",
  HOME_VISIT_SCHEDULED: "HOME_VISIT",
  SOCIAL_WORKER_REFERRAL: "SOCIAL_WORKER_REFERRAL",
  ATTENDANCE_CONTRACT: "ATTENDANCE_CONTRACT",
  ATTENDANCE_LETTER_2: "OTHER",
  ATTENDANCE_LETTER_3: "OTHER",
  TRUANCY_REFERRAL: "TRUANCY_REFERRAL",
  ADMINISTRATOR_MEETING: "ADMINISTRATOR_MEETING",
  COMMUNITY_RESOURCE_CONNECTION: "COMMUNITY_RESOURCE",
  LEGAL_NOTICE: "TRUANCY_REFERRAL",
}

/**
 * Get students grouped by MTSS tier
 */
export async function getStudentsByTier(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get date range for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Calculate school days in month (simplified - should use school calendar)
    const schoolDays = Math.floor(
      ((endOfMonth.getTime() - startOfMonth.getTime()) /
        (1000 * 60 * 60 * 24 * 7)) *
        5
    )

    // Get all active students with their attendance
    const students = await db.student.findMany({
      where: {
        schoolId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        givenName: true,
        surname: true,
        grNumber: true,
        profilePhotoUrl: true,
        studentYearLevels: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { yearLevel: true },
        },
        attendances: {
          where: {
            date: { gte: startOfMonth, lte: endOfMonth },
            deletedAt: null,
          },
          select: { status: true },
        },
        attendanceInterventions: {
          where: { status: { not: "COMPLETED" } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    // Group students by tier
    const tier1: typeof students = []
    const tier2: typeof students = []
    const tier3: typeof students = []

    for (const student of students) {
      const totalRecords = student.attendances.length
      const absentCount = student.attendances.filter(
        (a) => a.status === "ABSENT"
      ).length

      const absenceRate =
        totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0
      const tier = getTierFromAbsenceRate(absenceRate)

      // Add calculated fields
      const enrichedStudent = {
        ...student,
        absenceRate: Math.round(absenceRate * 10) / 10,
        totalDays: totalRecords,
        absentDays: absentCount,
        tier,
        hasActiveIntervention: student.attendanceInterventions.length > 0,
      }

      switch (tier) {
        case "TIER_1":
          tier1.push(enrichedStudent as (typeof students)[0])
          break
        case "TIER_2":
          tier2.push(enrichedStudent as (typeof students)[0])
          break
        case "TIER_3":
          tier3.push(enrichedStudent as (typeof students)[0])
          break
      }
    }

    return {
      success: true,
      data: {
        tier1: {
          students: tier1,
          count: tier1.length,
          threshold: TIER_THRESHOLDS.TIER_1,
        },
        tier2: {
          students: tier2,
          count: tier2.length,
          threshold: TIER_THRESHOLDS.TIER_2,
        },
        tier3: {
          students: tier3,
          count: tier3.length,
          threshold: TIER_THRESHOLDS.TIER_3,
        },
        totalStudents: students.length,
        schoolDays,
      },
    }
  } catch (error) {
    console.error("Error getting students by tier:", error)
    return { success: false, error: "Failed to get students by tier" }
  }
}

/**
 * Create a tiered intervention
 */
export async function createTieredIntervention(
  input: CreateTieredInterventionInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const {
      studentId,
      tier,
      action,
      title,
      description,
      scheduledDate,
      assignedTo,
      priority,
      parentNotify,
    } = input

    // Map action to intervention type
    const interventionType =
      actionToInterventionType[action] || ("OTHER" as InterventionType)

    // Create intervention
    const intervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId,
        type: interventionType,
        title,
        description: description || `${tier} intervention: ${action}`,
        status: scheduledDate ? "SCHEDULED" : "IN_PROGRESS",
        priority,
        scheduledDate,
        initiatedBy: userId,
        assignedTo,
        parentNotified: parentNotify,
        tags: [tier, action],
      },
      include: {
        student: {
          select: { givenName: true, surname: true },
        },
      },
    })

    revalidatePath("/attendance/interventions")

    return {
      success: true,
      data: {
        id: intervention.id,
        studentName: `${intervention.student.givenName} ${intervention.student.surname}`,
        tier,
        action,
      },
    }
  } catch (error) {
    console.error("Error creating tiered intervention:", error)
    return { success: false, error: "Failed to create intervention" }
  }
}

/**
 * Update intervention status
 */
export async function updateInterventionStatus(
  input: UpdateInterventionStatusInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const {
      interventionId,
      status,
      outcome,
      followUpDate,
      escalateToTier,
      escalationReason,
    } = input

    // Get existing intervention
    const existing = await db.attendanceIntervention.findFirst({
      where: { id: interventionId, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Intervention not found" }
    }

    // Update intervention
    const updated = await db.attendanceIntervention.update({
      where: { id: interventionId },
      data: {
        status: status as InterventionStatus,
        outcome,
        completedDate: status === "COMPLETED" ? new Date() : undefined,
        followUpDate,
      },
    })

    // If escalating, create new intervention at higher tier
    if (status === "ESCALATED" && escalateToTier) {
      const recommendedActions = getRecommendedActions(escalateToTier)
      const firstAction = recommendedActions[0]

      await db.attendanceIntervention.create({
        data: {
          schoolId,
          studentId: existing.studentId,
          type: actionToInterventionType[firstAction] || "OTHER",
          title: `Escalated: ${escalateToTier} intervention`,
          description: `Escalated from previous intervention. Reason: ${escalationReason || "Threshold exceeded"}`,
          status: "SCHEDULED",
          priority: escalateToTier === "TIER_3" ? 4 : 3,
          initiatedBy: userId,
          escalatedFrom: interventionId,
          tags: [escalateToTier, firstAction, "ESCALATED"],
        },
      })
    }

    revalidatePath("/attendance/interventions")

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating intervention status:", error)
    return { success: false, error: "Failed to update intervention" }
  }
}

/**
 * Get intervention history for a student
 */
export async function getStudentInterventionHistory(
  studentId: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const interventions = await db.attendanceIntervention.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { givenName: true, surname: true },
        },
      },
    })

    return {
      success: true,
      data: interventions.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        status: i.status,
        priority: i.priority,
        scheduledDate: i.scheduledDate,
        completedDate: i.completedDate,
        outcome: i.outcome,
        tier: i.tags.find((t) => t.startsWith("TIER_")),
        action: i.tags.find((t) => !t.startsWith("TIER_") && t !== "ESCALATED"),
        isEscalated: i.tags.includes("ESCALATED"),
        createdAt: i.createdAt,
      })),
    }
  } catch (error) {
    console.error("Error getting student intervention history:", error)
    return { success: false, error: "Failed to get intervention history" }
  }
}

/**
 * Get pending interventions for assigned user
 */
export async function getMyPendingInterventions(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const interventions = await db.attendanceIntervention.findMany({
      where: {
        schoolId,
        assignedTo: userId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      orderBy: [{ priority: "desc" }, { scheduledDate: "asc" }],
      include: {
        student: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            profilePhotoUrl: true,
          },
        },
      },
    })

    return {
      success: true,
      data: interventions.map((i) => ({
        id: i.id,
        student: {
          id: i.student.id,
          name: `${i.student.givenName} ${i.student.surname}`,
          photoUrl: i.student.profilePhotoUrl,
        },
        type: i.type,
        title: i.title,
        status: i.status,
        priority: i.priority,
        scheduledDate: i.scheduledDate,
        tier: i.tags.find((t) => t.startsWith("TIER_")),
        isOverdue: i.scheduledDate && new Date(i.scheduledDate) < new Date(),
      })),
    }
  } catch (error) {
    console.error("Error getting pending interventions:", error)
    return { success: false, error: "Failed to get pending interventions" }
  }
}

/**
 * Get MTSS dashboard statistics
 */
export async function getMTSSStats(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get intervention counts by status
    const [scheduled, inProgress, completed, escalated] = await Promise.all([
      db.attendanceIntervention.count({
        where: { schoolId, status: "SCHEDULED" },
      }),
      db.attendanceIntervention.count({
        where: { schoolId, status: "IN_PROGRESS" },
      }),
      db.attendanceIntervention.count({
        where: {
          schoolId,
          status: "COMPLETED",
          completedDate: { gte: startOfMonth },
        },
      }),
      db.attendanceIntervention.count({
        where: {
          schoolId,
          status: "ESCALATED",
          updatedAt: { gte: startOfMonth },
        },
      }),
    ])

    // Get overdue count
    const overdue = await db.attendanceIntervention.count({
      where: {
        schoolId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledDate: { lt: now },
      },
    })

    return {
      success: true,
      data: {
        pending: scheduled + inProgress,
        scheduled,
        inProgress,
        completedThisMonth: completed,
        escalatedThisMonth: escalated,
        overdue,
      },
    }
  } catch (error) {
    console.error("Error getting MTSS stats:", error)
    return { success: false, error: "Failed to get MTSS stats" }
  }
}
