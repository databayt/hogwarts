"use server"

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

    revalidatePath("/saas-dashboard/tenants")
    revalidatePath(`/operator/tenants/${validated.tenantId}`)

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

    revalidatePath("/saas-dashboard/tenants")
    revalidatePath(`/operator/tenants/${validated.tenantId}`)

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

    revalidatePath("/saas-dashboard/tenants")
    revalidatePath(`/operator/tenants/${validated.tenantId}`)

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

    revalidatePath("/saas-dashboard/tenants")
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
