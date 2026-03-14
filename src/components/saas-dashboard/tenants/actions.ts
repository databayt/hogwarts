"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { School } from "@prisma/client"
import { z } from "zod"

import { setupCatalogForSchool } from "@/lib/catalog-setup"
import { db } from "@/lib/db"
import {
  logOperatorAudit,
  requireNotImpersonating,
  requireOperator,
} from "@/components/saas-dashboard/lib/operator-auth"

import { getTenants as getTenantsQuery, type GetTenantsInput } from "./queries"

// ============= Type Definitions =============

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error }

// ============= Validation Schemas =============

const toggleActiveSchema = z.object({
  tenantId: z.string().min(1),
  reason: z.string().optional(),
})

const changePlanSchema = z.object({
  tenantId: z.string().min(1),
  planType: z.enum(["TRIAL", "BASIC", "PREMIUM", "ENTERPRISE"]),
  reason: z.string().optional(),
})

const endTrialSchema = z.object({
  tenantId: z.string().min(1),
  reason: z.string().optional(),
})

const impersonationSchema = z.object({
  tenantId: z.string().min(1),
  reason: z.string().optional(),
})

// ============= Tenant Actions =============

/**
 * Toggle tenant active status
 */
export async function tenantToggleActive(input: {
  tenantId: string
  reason?: string
}): Promise<ActionResult<School>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = toggleActiveSchema.parse(input)

    // Get current status
    const school = await db.school.findUnique({
      where: { id: validated.tenantId },
    })

    if (!school) {
      return {
        success: false,
        error: new Error("School not found"),
      }
    }

    // Toggle the status
    const updatedSchool = await db.school.update({
      where: { id: validated.tenantId },
      data: {
        isActive: !school.isActive,
        updatedAt: new Date(),
      },
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: validated.tenantId,
      action: updatedSchool.isActive
        ? "TENANT_ACTIVATED"
        : "TENANT_DEACTIVATED",
      reason: validated.reason,
    })

    revalidatePath("/tenants")

    return { success: true, data: updatedSchool }
  } catch (error) {
    console.error("Failed to toggle tenant active status:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to toggle tenant status"),
    }
  }
}

/**
 * Change tenant subscription plan
 */
export async function tenantChangePlan(input: {
  tenantId: string
  planType: string
  reason?: string
}): Promise<ActionResult<School>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = changePlanSchema.parse(input)

    // Update school plan
    const school = await db.school.update({
      where: { id: validated.tenantId },
      data: {
        planType: validated.planType,
        updatedAt: new Date(),
      },
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: validated.tenantId,
      action: `TENANT_PLAN_CHANGED_TO_${validated.planType}`,
      reason: validated.reason,
    })

    revalidatePath("/tenants")

    return { success: true, data: school }
  } catch (error) {
    console.error("Failed to change tenant plan:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to change tenant plan"),
    }
  }
}

/**
 * End tenant trial period
 */
export async function tenantEndTrial(input: {
  tenantId: string
  reason?: string
}): Promise<ActionResult<School>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = endTrialSchema.parse(input)

    const school = await db.school.update({
      where: { id: validated.tenantId },
      data: {
        planType: "BASIC",
        updatedAt: new Date(),
      },
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: validated.tenantId,
      action: "TENANT_TRIAL_ENDED",
      reason: validated.reason,
    })

    revalidatePath("/tenants")

    return { success: true, data: school }
  } catch (error) {
    console.error("Failed to end tenant trial:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to end trial"),
    }
  }
}

/**
 * Start impersonation session for a tenant
 */
export async function tenantStartImpersonation(input: {
  tenantId: string
  reason?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = impersonationSchema.parse(input)

    // Verify school exists
    const school = await db.school.findUnique({
      where: { id: validated.tenantId },
    })

    if (!school) {
      return {
        success: false,
        error: new Error("School not found"),
      }
    }

    // Set impersonation cookie
    const cookieStore = await cookies()
    cookieStore.set("impersonate_schoolId", validated.tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: validated.tenantId,
      action: "IMPERSONATION_STARTED",
      reason: validated.reason,
    })

    revalidatePath("/")

    return { success: true, data: { success: true } }
  } catch (error) {
    console.error("Failed to start impersonation:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to start impersonation"),
    }
  }
}

/**
 * Stop current impersonation session
 */
export async function tenantStopImpersonation(input?: {
  reason?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const operator = await requireOperator()

    // Get current impersonation school ID before clearing
    const cookieStore = await cookies()
    const schoolId = cookieStore.get("impersonate_schoolId")?.value

    // Clear impersonation cookie
    cookieStore.delete("impersonate_schoolId")

    if (schoolId) {
      await logOperatorAudit({
        userId: operator.userId,
        schoolId,
        action: "IMPERSONATION_STOPPED",
        reason: input?.reason,
      })
    }

    revalidatePath("/")

    return { success: true, data: { success: true } }
  } catch (error) {
    console.error("Failed to stop impersonation:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to stop impersonation"),
    }
  }
}

/**
 * Get tenants with pagination (can be called from client)
 * This is a wrapper around the getTenants query that can be used in client components
 */
export async function fetchTenants(input: GetTenantsInput) {
  try {
    await requireOperator()
    const result = await getTenantsQuery(input)
    return result
  } catch (error) {
    console.error("Failed to fetch tenants:", error)
    return {
      data: [],
      total: 0,
    }
  }
}

/**
 * Setup catalog for a school tenant (academic structure + subject selections).
 * Only triggers for schools that have no AcademicLevels yet.
 */
export async function tenantSetupCatalog(input: { tenantId: string }): Promise<
  ActionResult<{
    levels: number
    grades: number
    streams: number
    selections: number
  }>
> {
  try {
    await requireOperator()

    const school = await db.school.findUnique({
      where: { id: input.tenantId },
      select: { id: true, name: true },
    })

    if (!school) {
      return { success: false, error: new Error("School not found") }
    }

    const result = await setupCatalogForSchool(input.tenantId, {
      skipIfExists: true,
    })

    if (result.skipped) {
      return {
        success: false,
        error: new Error(
          "message" in result ? result.message : "Catalog already configured"
        ),
      }
    }

    revalidatePath("/tenants")
    // After the skipped guard, result has levels/grades/streams/selections
    const { levels, grades, streams, selections } = result as {
      skipped: false
      levels: number
      grades: number
      streams: number
      selections: number
    }
    return {
      success: true,
      data: { levels, grades, streams, selections },
    }
  } catch (error) {
    console.error("Failed to setup catalog:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to setup catalog"),
    }
  }
}

// ============= Deletion Schema =============

const deleteSchema = z.object({
  tenantId: z.string().min(1),
  confirmName: z.string().min(1),
  reason: z.string().min(1, "Reason is required for deletion"),
})

/**
 * Delete a school tenant and all its data.
 *
 * Safety:
 * - Demo school hardcoded protection
 * - Type school name to confirm
 * - Required reason for audit trail
 * - DEVELOPER role only (requireOperator)
 * - Not during impersonation
 * - Atomic transaction (all-or-nothing)
 * - Users survive (schoolId nulled, not deleted)
 */
export async function tenantDelete(input: {
  tenantId: string
  confirmName: string
  reason: string
}): Promise<
  ActionResult<{
    deletedName: string
    domain: string
    stats: {
      users: number
      students: number
      teachers: number
      classes: number
    }
  }>
> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = deleteSchema.parse(input)

    // Fetch school with counts
    const school = await db.school.findUnique({
      where: { id: validated.tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            classes: true,
          },
        },
      },
    })

    if (!school) {
      return { success: false, error: new Error("School not found") }
    }

    // Guard: demo school protection
    if (school.domain === "demo") {
      return {
        success: false,
        error: new Error("Cannot delete the demo school"),
      }
    }

    // Guard: name confirmation
    if (validated.confirmName !== school.name) {
      return {
        success: false,
        error: new Error("School name does not match"),
      }
    }

    // Count affected users before deletion
    const userCount = await db.user.count({
      where: { schoolId: school.id },
    })

    const schoolId = school.id
    const stats = {
      users: userCount,
      students: school._count.students,
      teachers: school._count.teachers,
      classes: school._count.classes,
    }

    // ========================================================
    // ATOMIC TRANSACTION: Ordered deletion
    // ========================================================
    // Phase A: Detach users (survive deletion)
    // Phase B: Clear RESTRICT FK chains (leaf-first)
    // Phase C: Delete School (CASCADE handles remaining)
    // ========================================================
    await db.$transaction(
      async (tx) => {
        // Phase A: Detach users from school
        await tx.user.updateMany({
          where: { schoolId },
          data: { schoolId: null, role: "USER" },
        })

        // Phase B: Clear RESTRICT FK chains between school-owned models
        // These must be deleted in dependency order (leaves first) because
        // PostgreSQL CASCADE cannot resolve RESTRICT cross-references.

        // B1: Timetable chain (deepest leaves first)
        await tx.substitutionRecord.deleteMany({ where: { schoolId } })
        await tx.teacherAbsence.deleteMany({ where: { schoolId } })
        await tx.templateApplication.deleteMany({ where: { schoolId } })
        await tx.timetableTemplate.deleteMany({ where: { schoolId } })
        await tx.scheduleException.deleteMany({ where: { schoolId } })
        await tx.teacherConstraint.deleteMany({ where: { schoolId } })
        await tx.teacherUnavailableBlock.deleteMany({ where: { schoolId } })
        await tx.roomConstraint.deleteMany({ where: { schoolId } })
        await tx.schoolWeekConfig.deleteMany({ where: { schoolId } })
        await tx.timetable.deleteMany({ where: { schoolId } })

        // B2: Class chain
        await tx.studentClass.deleteMany({ where: { schoolId } })
        await tx.classTeacher.deleteMany({ where: { schoolId } })
        await tx.class.deleteMany({ where: { schoolId } })

        // B3: Finance fee chain (explicit RESTRICT)
        await tx.refund.deleteMany({ where: { schoolId } })
        await tx.payment.deleteMany({ where: { schoolId } })
        await tx.feeAssignment.deleteMany({ where: { schoolId } })
        await tx.feeStructure.deleteMany({ where: { schoolId } })

        // B4: Finance accounting chain
        await tx.expenseReceipt.deleteMany({ where: { schoolId } })
        await tx.salarySlip.deleteMany({ where: { schoolId } })
        await tx.payrollRun.deleteMany({ where: { schoolId } })
        await tx.walletTransaction.deleteMany({ where: { schoolId } })
        await tx.userInvoice.deleteMany({ where: { schoolId } })
        await tx.expense.deleteMany({ where: { schoolId } })
        await tx.budgetAllocation.deleteMany({ where: { schoolId } })
        await tx.ledgerEntry.deleteMany({ where: { schoolId } })
        await tx.accountBalance.deleteMany({ where: { schoolId } })
        await tx.expenseCategory.deleteMany({ where: { schoolId } })
        await tx.chartOfAccount.deleteMany({ where: { schoolId } })
        await tx.journalEntry.deleteMany({ where: { schoolId } })
        await tx.budget.deleteMany({ where: { schoolId } })
        await tx.financialReport.deleteMany({ where: { schoolId } })
        await tx.salaryStructure.deleteMany({ where: { schoolId } })
        await tx.fiscalYear.deleteMany({ where: { schoolId } })

        // B5: Banking chain
        await tx.bankReconciliation.deleteMany({ where: { schoolId } })
        await tx.transfer.deleteMany({ where: { schoolId } })
        await tx.bankAccount.deleteMany({ where: { schoolId } })

        // B6: Student structure chain
        await tx.studentGuardian.deleteMany({ where: { schoolId } })
        await tx.studentYearLevel.deleteMany({ where: { schoolId } })
        await tx.studentBatch.deleteMany({ where: { schoolId } })
        await tx.batch.deleteMany({ where: { schoolId } })

        // B7: QBank/Quiz chain
        await tx.quizGameQuestion.deleteMany({ where: { schoolId } })
        await tx.questionAnalytics.deleteMany({ where: { schoolId } })
        await tx.questionBank.deleteMany({ where: { schoolId } })
        await tx.sourceMaterial.deleteMany({ where: { schoolId } })
        await tx.generationJob.deleteMany({ where: { schoolId } })

        // B8: Stream chain
        await tx.streamCourse.deleteMany({ where: { schoolId } })
        await tx.streamCategory.deleteMany({ where: { schoolId } })

        // B9: Subscription chain (reference global SubscriptionTier)
        await tx.appliedDiscount.deleteMany({ where: { schoolId } })
        await tx.discount.deleteMany({ where: { schoolId } })
        await tx.subscription.deleteMany({ where: { schoolId } })

        // B10: Announcement config (RESTRICT → AnnouncementTemplate)
        await tx.announcementConfig.deleteMany({ where: { schoolId } })

        // B11: Classroom chain
        await tx.classroom.deleteMany({ where: { schoolId } })
        await tx.section.deleteMany({ where: { schoolId } })
        await tx.classroomType.deleteMany({ where: { schoolId } })

        // B12: Subject/Department chain
        await tx.subject.deleteMany({ where: { schoolId } })
        await tx.department.deleteMany({ where: { schoolId } })

        // B13: Academic structure dependencies
        await tx.guardianType.deleteMany({ where: { schoolId } })
        await tx.yearLevel.deleteMany({ where: { schoolId } })
        await tx.schoolYear.deleteMany({ where: { schoolId } })

        // B14: Person models (RESTRICT cross-refs: Guardian→Teacher, etc.)
        await tx.guardian.deleteMany({ where: { schoolId } })
        await tx.student.deleteMany({ where: { schoolId } })
        await tx.teacher.deleteMany({ where: { schoolId } })
        await tx.staffMember.deleteMany({ where: { schoolId } })

        // Phase C: Delete School — CASCADE handles all remaining models
        await tx.school.delete({ where: { id: schoolId } })
      },
      { timeout: 60000 }
    )

    // Audit log (outside transaction — school is already deleted)
    await logOperatorAudit({
      userId: operator.userId,
      schoolId: null,
      action: "TENANT_DELETED",
      reason: `Deleted "${school.name}" (${school.domain}). Reason: ${validated.reason}. Affected: ${stats.users} users, ${stats.students} students, ${stats.teachers} teachers, ${stats.classes} classes.`,
    })

    revalidatePath("/tenants")

    return {
      success: true,
      data: {
        deletedName: school.name,
        domain: school.domain,
        stats,
      },
    }
  } catch (error) {
    console.error("Failed to delete tenant:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to delete school"),
    }
  }
}

/**
 * Get catalog status for a tenant (levels, grades count).
 */
export async function tenantGetCatalogStatus(tenantId: string): Promise<{
  configured: boolean
  levels: number
  grades: number
}> {
  try {
    await requireOperator()

    const [levels, grades] = await Promise.all([
      db.academicLevel.count({ where: { schoolId: tenantId } }),
      db.academicGrade.count({ where: { schoolId: tenantId } }),
    ])

    return { configured: levels > 0, levels, grades }
  } catch {
    return { configured: false, levels: 0, grades: 0 }
  }
}
