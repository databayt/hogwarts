/**
 * Absence Intention Server Actions
 *
 * Server actions for managing pre-absence notifications.
 * Allows students/parents to notify school about planned absences in advance.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  filterIntentionsSchema,
  reviewIntentionSchema,
  submitIntentionSchema,
  type FilterIntentionsInput,
  type ReviewIntentionInput,
  type SubmitIntentionInput,
} from "./validation"

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Calculate number of school days between two dates
 * Excludes weekends (configurable per school later)
 */
function calculateSchoolDays(dateFrom: Date, dateTo: Date): number {
  let count = 0
  const current = new Date(dateFrom)

  while (current <= dateTo) {
    const dayOfWeek = current.getDay()
    // Skip weekends (0 = Sunday, 6 = Saturday)
    // Note: This could be made configurable per school
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

/**
 * Submit a new absence intention
 * Can be submitted by student (if allowed) or guardian
 */
export async function submitAbsenceIntention(
  input: SubmitIntentionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validated = submitIntentionSchema.parse(input)

    // Verify student belongs to school
    const student = await db.student.findFirst({
      where: { id: validated.studentId, schoolId },
      select: { id: true, givenName: true, surname: true },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // Check for overlapping intentions
    const existingIntention = await db.absenceIntention.findFirst({
      where: {
        schoolId,
        studentId: validated.studentId,
        status: { not: "REJECTED" },
        OR: [
          {
            AND: [
              { dateFrom: { lte: validated.dateTo } },
              { dateTo: { gte: validated.dateFrom } },
            ],
          },
        ],
      },
    })

    if (existingIntention) {
      return {
        success: false,
        error: "An absence intention already exists for overlapping dates",
      }
    }

    // Calculate school days
    const daysCount = calculateSchoolDays(validated.dateFrom, validated.dateTo)

    // Create the intention
    const intention = await db.absenceIntention.create({
      data: {
        schoolId,
        studentId: validated.studentId,
        dateFrom: validated.dateFrom,
        dateTo: validated.dateTo,
        reason: validated.reason,
        description: validated.description,
        attachments: validated.attachments || [],
        notifyTeachers: validated.notifyTeachers ?? true,
        notifyGuardians: validated.notifyGuardians ?? true,
        daysCount,
        submittedBy: session.user.id,
        status: "PENDING",
      },
    })

    // Fire-and-forget: Notify relevant parties
    notifyIntentionSubmission(schoolId, intention.id).catch(console.error)

    revalidatePath("/attendance/intentions")

    return { success: true, data: { id: intention.id } }
  } catch (error) {
    console.error("[submitAbsenceIntention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit intention",
    }
  }
}

/**
 * Review an absence intention (approve or reject)
 * Can only be done by teachers or admins
 */
export async function reviewAbsenceIntention(
  input: ReviewIntentionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check user has review permissions (teacher, admin, developer)
    const allowedRoles = ["TEACHER", "ADMIN", "DEVELOPER"]
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validate input
    const validated = reviewIntentionSchema.parse(input)

    // Find the intention
    const intention = await db.absenceIntention.findFirst({
      where: { id: validated.intentionId, schoolId },
      include: {
        student: {
          select: { givenName: true, surname: true },
        },
      },
    })

    if (!intention) {
      return { success: false, error: "Intention not found" }
    }

    if (intention.status !== "PENDING") {
      return { success: false, error: "Intention has already been reviewed" }
    }

    // Update the intention
    const updated = await db.absenceIntention.update({
      where: { id: validated.intentionId },
      data: {
        status: validated.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: validated.reviewNotes,
      },
    })

    // Fire-and-forget: Notify about the decision
    notifyIntentionDecision(schoolId, updated.id, validated.status).catch(
      console.error
    )

    revalidatePath("/attendance/intentions")

    return { success: true, data: { id: updated.id } }
  } catch (error) {
    console.error("[reviewAbsenceIntention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to review intention",
    }
  }
}

/**
 * Get absence intentions with filtering
 */
export async function getAbsenceIntentions(
  input?: FilterIntentionsInput
): Promise<
  ActionResponse<{
    intentions: Array<{
      id: string
      studentId: string
      studentName: string
      dateFrom: Date
      dateTo: Date
      daysCount: number
      reason: string
      description: string | null
      status: string
      submittedAt: Date
      reviewedAt: Date | null
      reviewNotes: string | null
    }>
    total: number
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Build where clause
    const where: Prisma.AbsenceIntentionWhereInput = { schoolId }

    if (input) {
      const validated = filterIntentionsSchema.parse(input)

      if (validated.status && validated.status !== "ALL") {
        where.status = validated.status
      }
      if (validated.studentId) {
        where.studentId = validated.studentId
      }
      if (validated.reason) {
        where.reason = validated.reason
      }
      if (validated.dateFrom) {
        where.dateFrom = { gte: validated.dateFrom }
      }
      if (validated.dateTo) {
        where.dateTo = { lte: validated.dateTo }
      }
    }

    const [intentions, total] = await Promise.all([
      db.absenceIntention.findMany({
        where,
        include: {
          student: {
            select: { givenName: true, surname: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.absenceIntention.count({ where }),
    ])

    return {
      success: true,
      data: {
        intentions: intentions.map((i) => ({
          id: i.id,
          studentId: i.studentId,
          studentName: `${i.student.givenName} ${i.student.surname}`,
          dateFrom: i.dateFrom,
          dateTo: i.dateTo,
          daysCount: i.daysCount,
          reason: i.reason,
          description: i.description,
          status: i.status,
          submittedAt: i.createdAt,
          reviewedAt: i.reviewedAt,
          reviewNotes: i.reviewNotes,
        })),
        total,
      },
    }
  } catch (error) {
    console.error("[getAbsenceIntentions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get intentions",
    }
  }
}

/**
 * Get pending intentions count (for dashboard badges)
 */
export async function getPendingIntentionsCount(): Promise<
  ActionResponse<{ count: number }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const count = await db.absenceIntention.count({
      where: { schoolId, status: "PENDING" },
    })

    return { success: true, data: { count } }
  } catch (error) {
    console.error("[getPendingIntentionsCount] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get count",
    }
  }
}

/**
 * Get intentions for a specific student (for parent/student view)
 */
export async function getStudentIntentions(studentId: string): Promise<
  ActionResponse<{
    intentions: Array<{
      id: string
      dateFrom: Date
      dateTo: Date
      daysCount: number
      reason: string
      description: string | null
      status: string
      submittedAt: Date
      reviewedAt: Date | null
      reviewNotes: string | null
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const intentions = await db.absenceIntention.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return {
      success: true,
      data: {
        intentions: intentions.map((i) => ({
          id: i.id,
          dateFrom: i.dateFrom,
          dateTo: i.dateTo,
          daysCount: i.daysCount,
          reason: i.reason,
          description: i.description,
          status: i.status,
          submittedAt: i.createdAt,
          reviewedAt: i.reviewedAt,
          reviewNotes: i.reviewNotes,
        })),
      },
    }
  } catch (error) {
    console.error("[getStudentIntentions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get intentions",
    }
  }
}

/**
 * Cancel an intention (by submitter, only if still pending)
 */
export async function cancelAbsenceIntention(
  intentionId: string
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Find the intention
    const intention = await db.absenceIntention.findFirst({
      where: { id: intentionId, schoolId },
    })

    if (!intention) {
      return { success: false, error: "Intention not found" }
    }

    // Only the submitter can cancel, and only if still pending
    if (intention.submittedBy !== session.user.id) {
      return {
        success: false,
        error: "Only the submitter can cancel this intention",
      }
    }

    if (intention.status !== "PENDING") {
      return {
        success: false,
        error: "Only pending intentions can be cancelled",
      }
    }

    // Delete the intention
    await db.absenceIntention.delete({
      where: { id: intentionId },
    })

    revalidatePath("/attendance/intentions")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[cancelAbsenceIntention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to cancel intention",
    }
  }
}

// ============================================================================
// NOTIFICATION HELPERS (Fire-and-forget)
// ============================================================================

/**
 * Notify relevant parties about a new intention submission
 */
async function notifyIntentionSubmission(
  schoolId: string,
  intentionId: string
): Promise<void> {
  try {
    const intention = await db.absenceIntention.findUnique({
      where: { id: intentionId },
      include: {
        student: {
          select: {
            givenName: true,
            surname: true,
            studentClasses: {
              include: {
                class: {
                  include: {
                    teacher: { select: { userId: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!intention) return

    const studentName = `${intention.student.givenName} ${intention.student.surname}`
    const dateFrom = intention.dateFrom.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const dateTo = intention.dateTo.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const dateRange =
      intention.daysCount === 1 ? dateFrom : `${dateFrom} - ${dateTo}`

    // Notify homeroom teachers if enabled
    if (intention.notifyTeachers) {
      const teacherUserIds = intention.student.studentClasses
        .map((sc) => sc.class.teacher?.userId)
        .filter((id): id is string => !!id)

      for (const userId of new Set(teacherUserIds)) {
        await db.notification.create({
          data: {
            schoolId,
            userId,
            type: "absence_intention",
            priority: "normal",
            title: `Absence Intention: ${studentName}`,
            body: `${studentName} has submitted an absence intention for ${dateRange} (${intention.daysCount} day${intention.daysCount > 1 ? "s" : ""}). Reason: ${intention.reason}`,
            metadata: {
              intentionId,
              studentName,
              dateFrom: intention.dateFrom.toISOString(),
              dateTo: intention.dateTo.toISOString(),
              reason: intention.reason,
            },
            channels: ["in_app"],
          },
        })
      }
    }
  } catch (error) {
    console.error("[notifyIntentionSubmission] Error:", error)
  }
}

/**
 * Notify submitter about intention decision
 */
async function notifyIntentionDecision(
  schoolId: string,
  intentionId: string,
  status: "APPROVED" | "REJECTED"
): Promise<void> {
  try {
    const intention = await db.absenceIntention.findUnique({
      where: { id: intentionId },
      include: {
        student: { select: { givenName: true, surname: true } },
      },
    })

    if (!intention) return

    const studentName = `${intention.student.givenName} ${intention.student.surname}`
    const dateFrom = intention.dateFrom.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const dateTo = intention.dateTo.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const dateRange =
      intention.daysCount === 1 ? dateFrom : `${dateFrom} - ${dateTo}`

    const statusText = status === "APPROVED" ? "approved" : "rejected"

    await db.notification.create({
      data: {
        schoolId,
        userId: intention.submittedBy,
        type: "absence_intention_decision",
        priority: status === "APPROVED" ? "low" : "normal",
        title: `Absence Intention ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        body: `Your absence intention for ${studentName} (${dateRange}) has been ${statusText}.${intention.reviewNotes ? ` Note: ${intention.reviewNotes}` : ""}`,
        metadata: {
          intentionId,
          studentName,
          status,
          reviewNotes: intention.reviewNotes,
        },
        channels: ["in_app", "email"],
      },
    })
  } catch (error) {
    console.error("[notifyIntentionDecision] Error:", error)
  }
}
