// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * MTSS Tiered Intervention Server Actions
 *
 * Server actions for managing tiered interventions aligned with MTSS framework.
 */
"use server"

import { auth } from "@/auth"
import type {
  InterventionStatus,
  InterventionType,
  UserRole,
} from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { refreshPage } from "@/lib/refresh-page"
import { schoolNameDisplay } from "@/lib/school-name-format"

import { getTeacherSectionIds, sectionScopeWhere } from "../../actions/helpers"
import { isStaffRole } from "../../authorization"
import { atRiskRows, computeStudentRisk } from "../../early-warning/queries"
import { bandTier, type AtRiskBand } from "../../early-warning/risk"
import {
  getRecommendedActions,
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
 * Get students grouped by MTSS tier.
 *
 * Same source as the students list (early-warning/queries.ts), so the three
 * tier counts add up to "All at risk" there: Tier 3 = critical (< 80%),
 * Tier 2 = high (80–90%), Tier 1 = moderate / watch (90–95%). Students
 * attending ≥ 95%, or with too few recorded days, are in no tier list.
 */
export async function getStudentsByTier(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role as UserRole | undefined

  // MTSS tier/intervention data is staff-only — a STUDENT/GUARDIAN must not be
  // able to read school-wide tier classifications or any student's history.
  if (!schoolId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const teacherSectionIds =
      role === "TEACHER" && session?.user?.id
        ? await getTeacherSectionIds(schoolId, session.user.id)
        : null
    const rows = atRiskRows(
      await computeStudentRisk(schoolId, {
        sectionWhere: sectionScopeWhere({ teacherSectionIds }),
      })
    )

    const students = await db.student.findMany({
      where: { schoolId, id: { in: rows.map((r) => r.studentId) } },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        grNumber: true,
        profilePhotoUrl: true,
        section: { select: { name: true } },
        attendanceInterventions: {
          where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "ESCALATED"] } },
          select: { id: true },
          take: 1,
        },
      },
    })
    const byId = new Map(students.map((s) => [s.id, s]))

    const tiers: Record<TierLevel, Array<Record<string, unknown>>> = {
      TIER_1: [],
      TIER_2: [],
      TIER_3: [],
    }
    for (const r of rows.sort((a, b) => a.rate - b.rate)) {
      const s = byId.get(r.studentId)
      if (!s) continue
      const tier = bandTier(r.band as AtRiskBand)
      tiers[tier].push({
        id: s.id,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        grNumber: s.grNumber,
        profilePhotoUrl: s.profilePhotoUrl,
        sectionName: s.section?.name ?? null,
        rate: r.rate,
        absenceRate: Math.round((100 - r.rate) * 10) / 10,
        totalDays: r.recordedDays,
        absentDays: r.recordedDays - r.attendedDays,
        tier,
        hasActiveIntervention: s.attendanceInterventions.length > 0,
      })
    }

    return {
      success: true,
      data: {
        tier1: {
          students: tiers.TIER_1,
          count: tiers.TIER_1.length,
          threshold: TIER_THRESHOLDS.TIER_1,
        },
        tier2: {
          students: tiers.TIER_2,
          count: tiers.TIER_2.length,
          threshold: TIER_THRESHOLDS.TIER_2,
        },
        tier3: {
          students: tiers.TIER_3,
          count: tiers.TIER_3.length,
          threshold: TIER_THRESHOLDS.TIER_3,
        },
        totalStudents: rows.length,
      },
    }
  } catch (error) {
    console.error("Error getting students by tier:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_NOT_FOUND)
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
  const role = session?.user?.role as UserRole | undefined

  if (!schoolId || !userId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
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

    // TENANT: reject a studentId from another school before the FK write.
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    })
    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

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
          select: { firstName: true, middleName: true, lastName: true },
        },
      },
    })

    refreshPage("/attendance/interventions")

    return {
      success: true,
      data: {
        id: intervention.id,
        studentName: displayName(
          intervention.student,
          await schoolNameDisplay(schoolId)
        ),
        tier,
        action,
      },
    }
  } catch (error) {
    console.error("Error creating tiered intervention:", error)
    return actionError(ACTION_ERRORS.INTERVENTION_CREATE_FAILED)
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
  const role = session?.user?.role as UserRole | undefined

  if (!schoolId || !userId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
      return actionError(ACTION_ERRORS.INTERVENTION_NOT_FOUND)
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

    refreshPage("/attendance/interventions")

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating intervention status:", error)
    return actionError(ACTION_ERRORS.INTERVENTION_UPDATE_FAILED)
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
  const role = session?.user?.role as UserRole | undefined

  // MTSS tier/intervention data is staff-only — a STUDENT/GUARDIAN must not be
  // able to read school-wide tier classifications or any student's history.
  if (!schoolId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const interventions = await db.attendanceIntervention.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { firstName: true, lastName: true },
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
    return actionError(ACTION_ERRORS.INTERVENTION_NOT_FOUND)
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
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
            firstName: true,
            middleName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
    })

    const nameDisplay = await schoolNameDisplay(schoolId)

    return {
      success: true,
      data: interventions.map((i) => ({
        id: i.id,
        student: {
          id: i.student.id,
          name: displayName(i.student, nameDisplay),
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
    return actionError(ACTION_ERRORS.INTERVENTION_NOT_FOUND)
  }
}

/**
 * Get MTSS dashboard statistics
 */
export async function getMTSSStats(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role as UserRole | undefined

  // MTSS tier/intervention data is staff-only — a STUDENT/GUARDIAN must not be
  // able to read school-wide tier classifications or any student's history.
  if (!schoolId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
    return actionError(ACTION_ERRORS.ATTENDANCE_NOT_FOUND)
  }
}
