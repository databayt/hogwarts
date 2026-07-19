"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"
import { guardAttendance } from "./helpers"

// ============================================================================
// POLICY ENGINE - EVALUATION
// ============================================================================

/**
 * Evaluate all active policies for the caller's school.
 * NOTE: the attendance-policies cron does NOT call this action — it has its own
 * inline, cron-secret-gated implementation. This server action exists for
 * admin-triggered re-evaluation only.
 * SECURITY: schoolId comes from guardAttendance (session + tenant), never from
 * the caller — the previous signature accepted an arbitrary schoolId with no
 * auth at all, making it an unauthenticated cross-tenant write endpoint.
 */
export async function evaluatePolicies(): Promise<
  ActionResponse<{
    studentsEvaluated: number
    triggersCreated: number
    exemptSkipped: number
  }>
> {
  try {
    const g = await guardAttendance("manage_policy")
    if (!g.ok) return g.error
    const { schoolId } = g

    // Get all active policies that have maxDailyAbsences set
    const policies = await db.attendancePolicy.findMany({
      where: {
        schoolId,
        isActive: true,
        maxDailyAbsences: { not: null },
      },
    })

    if (policies.length === 0) {
      return {
        success: true,
        data: { studentsEvaluated: 0, triggersCreated: 0, exemptSkipped: 0 },
      }
    }

    // Get current active term
    const term = await db.term.findFirst({
      where: { schoolId, isActive: true },
      orderBy: { startDate: "desc" },
    })

    if (!term) {
      return {
        success: false,
        error: "No active term found",
      }
    }

    let studentsEvaluated = 0
    let triggersCreated = 0
    let exemptSkipped = 0

    // Define tiers (absence count thresholds)
    const tiers = [
      { tier: 1, threshold: 3, action: "NOTIFICATION" },
      { tier: 2, threshold: 5, action: "LETTER" },
      { tier: 3, threshold: 10, action: "MEETING" },
      { tier: 4, threshold: 15, action: "REFERRAL" },
    ]

    // For each policy, evaluate students
    for (const policy of policies) {
      // Count absences per student in current term
      const absenceCounts = await db.attendance.groupBy({
        by: ["studentId"],
        where: {
          schoolId,
          status: "ABSENT",
          date: {
            gte: term.startDate,
            lte: term.endDate,
          },
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      })

      studentsEvaluated += absenceCounts.length

      // Check each student against tier thresholds
      for (const { studentId, _count } of absenceCounts) {
        const absenceCount = _count.id

        // Check if student is exempt from this policy
        const exemption = await db.policyExemption.findFirst({
          where: {
            schoolId,
            studentId,
            AND: [
              {
                OR: [
                  { policyId: null }, // Exempt from all policies
                  { policyId: policy.id }, // Exempt from this specific policy
                ],
              },
              {
                OR: [
                  { expiresAt: null }, // Permanent exemption
                  { expiresAt: { gt: new Date() } }, // Not expired
                ],
              },
            ],
          },
        })

        if (exemption) {
          exemptSkipped++
          continue
        }

        // Check each tier threshold
        for (const { tier, threshold, action } of tiers) {
          if (absenceCount >= threshold) {
            // Check if trigger already exists for this tier
            const existingTrigger = await db.policyTrigger.findUnique({
              where: {
                schoolId_studentId_policyId_tier: {
                  schoolId,
                  studentId,
                  policyId: policy.id,
                  tier,
                },
              },
            })

            if (!existingTrigger) {
              // Create new trigger
              await db.policyTrigger.create({
                data: {
                  schoolId,
                  studentId,
                  policyId: policy.id,
                  tier,
                  absenceCount,
                  action,
                  status: "PENDING",
                },
              })

              triggersCreated++

              // Create notifications for alert recipients
              if (policy.alertRecipients.length > 0) {
                const student = await db.student.findFirst({
                  where: { id: studentId, schoolId },
                  select: { firstName: true, lastName: true },
                })

                const studentName = student
                  ? `${student.firstName} ${student.lastName}`
                  : "طالب"

                await Promise.all(
                  policy.alertRecipients.map((recipientId) =>
                    dispatchNotification({
                      schoolId,
                      userId: recipientId,
                      type: "attendance_alert",
                      priority: tier >= 3 ? "high" : "normal",
                      title: `تنبيه سياسة الحضور: ${studentName}`,
                      body: `تجاوز ${studentName} حد الغياب (${absenceCount} غياب). الإجراء المطلوب: ${action}`,
                      metadata: {
                        studentId,
                        studentName,
                        policyId: policy.id,
                        policyName: policy.name,
                        tier,
                        absenceCount,
                        action,
                        termId: term.id,
                      },
                    })
                  )
                )
              }
            }
          }
        }
      }
    }

    revalidatePath("/attendance/policies")

    return {
      success: true,
      data: { studentsEvaluated, triggersCreated, exemptSkipped },
    }
  } catch (error) {
    console.error("[evaluatePolicies] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to evaluate policies",
    }
  }
}

// ============================================================================
// POLICY ENGINE - TRIGGERS
// ============================================================================

/**
 * Get policy triggers with optional filters
 * For admin dashboard to view and manage policy violations
 */
export async function getPolicyTriggers(input?: {
  status?: string
  studentId?: string
  policyId?: string
}): Promise<
  ActionResponse<{
    triggers: Array<{
      id: string
      tier: number
      absenceCount: number
      action: string
      status: string
      notes: string | null
      createdAt: Date
      student: {
        firstName: string
        lastName: string
      }
    }>
  }>
> {
  try {
    // SECURITY: policy triggers expose student PII + enforcement actions and
    // were reachable with only a subdomain header. Require an analytics-capable
    // staff role.
    const g = await guardAttendance("view_analytics")
    if (!g.ok) return g.error
    const { schoolId } = g

    const triggers = await db.policyTrigger.findMany({
      where: {
        schoolId,
        status: input?.status,
        studentId: input?.studentId,
        policyId: input?.policyId,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return {
      success: true,
      data: { triggers },
    }
  } catch (error) {
    console.error("[getPolicyTriggers] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get policy triggers",
    }
  }
}

// ============================================================================
// POLICY ENGINE - EXEMPTIONS
// ============================================================================

const exemptionSchema = z.object({
  studentId: z.string().min(1, "Student ID required"),
  policyId: z.string().optional().nullable(),
  reason: z.string().min(1, "Reason required"),
  expiresAt: z.string().optional().nullable(),
})

/**
 * Create a policy exemption for a student
 * Allows admin to exempt students from automatic policy enforcement
 */
export async function createPolicyExemption(
  input: z.infer<typeof exemptionSchema>
): Promise<ActionResponse<{ exemption: { id: string } }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Validate role (ADMIN or DEVELOPER only)
    if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
      return { success: false, error: "Insufficient permissions" }
    }

    const validated = exemptionSchema.parse(input)

    const exemption = await db.policyExemption.create({
      data: {
        schoolId,
        studentId: validated.studentId,
        policyId: validated.policyId || null,
        reason: validated.reason,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        createdBy: session.user.id,
      },
    })

    revalidatePath("/attendance/policies")

    return {
      success: true,
      data: { exemption: { id: exemption.id } },
    }
  } catch (error) {
    console.error("[createPolicyExemption] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create exemption",
    }
  }
}

// ============================================================================
// POLICY ENGINE - TRIGGER MANAGEMENT
// ============================================================================

/**
 * Dismiss/resolve a policy trigger
 * Marks trigger as completed or dismissed by admin
 */
export async function dismissPolicyTrigger(
  triggerId: string
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Validate role (ADMIN or DEVELOPER only)
    if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Verify trigger exists and belongs to this school
    const trigger = await db.policyTrigger.findFirst({
      where: {
        id: triggerId,
        schoolId,
      },
    })

    if (!trigger) {
      return { success: false, error: "Trigger not found" }
    }

    if (trigger.status === "DISMISSED" || trigger.status === "COMPLETED") {
      return { success: false, error: "Trigger already resolved" }
    }

    await db.policyTrigger.update({
      where: { id: triggerId },
      data: {
        status: "DISMISSED",
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
      },
    })

    revalidatePath("/attendance/policies")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[dismissPolicyTrigger] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to dismiss trigger",
    }
  }
}

// ============================================================================
// SCHOOL-WIDE ATTENDANCE SETTINGS (backed by the default AttendancePolicy row)
// ============================================================================

/** The school-wide default policy row managed by /attendance/settings. */
const DEFAULT_POLICY_NAME = "Default"

const PICKABLE_METHODS = [
  "MANUAL",
  "QR_CODE",
  "BARCODE",
  "GEOFENCE",
  "KIOSK",
  "BULK_UPLOAD",
  "RFID",
  "NFC",
  "BLUETOOTH",
  "FINGERPRINT",
  "FACE_RECOGNITION",
] as const

const attendanceSettingsSchema = z.object({
  lateThreshold: z.number().int().min(5).max(60),
  absentThreshold: z.number().int().min(15).max(120),
  graceperiod: z.number().int().min(0).max(60),
  requireCheckOut: z.boolean(),
  methods: z.array(z.enum(PICKABLE_METHODS)).min(1),
  maxDailyAbsences: z.number().int().min(1).max(50).nullable(),
})

export type AttendanceSettings = z.infer<typeof attendanceSettingsSchema>

const SETTINGS_DEFAULTS: AttendanceSettings = {
  lateThreshold: 15,
  absentThreshold: 30,
  graceperiod: 15,
  requireCheckOut: false,
  methods: ["MANUAL", "QR_CODE", "BARCODE", "GEOFENCE", "KIOSK", "BULK_UPLOAD"],
  maxDailyAbsences: null,
}

async function findDefaultPolicy(schoolId: string) {
  return (
    (await db.attendancePolicy.findFirst({
      where: { schoolId, name: DEFAULT_POLICY_NAME, appliesTo: { has: "ALL" } },
    })) ??
    (await db.attendancePolicy.findFirst({
      where: { schoolId, appliesTo: { has: "ALL" } },
      orderBy: { priority: "desc" },
    }))
  )
}

/**
 * Read the school-wide attendance settings (default policy row).
 * Returns built-in defaults when no policy row exists yet.
 */
export async function getAttendanceSettings(): Promise<
  ActionResponse<AttendanceSettings & { configured: boolean }>
> {
  try {
    const g = await guardAttendance("manage_settings")
    if (!g.ok) return g.error

    const policy = await findDefaultPolicy(g.schoolId)
    if (!policy) {
      return {
        success: true,
        data: { ...SETTINGS_DEFAULTS, configured: false },
      }
    }

    const methods = policy.methods.filter(
      (m): m is AttendanceSettings["methods"][number] =>
        (PICKABLE_METHODS as readonly string[]).includes(m)
    )
    return {
      success: true,
      data: {
        lateThreshold: policy.lateThreshold,
        absentThreshold: policy.absentThreshold,
        graceperiod: policy.graceperiod,
        requireCheckOut: policy.requireCheckOut,
        methods: methods.length > 0 ? methods : SETTINGS_DEFAULTS.methods,
        maxDailyAbsences: policy.maxDailyAbsences,
        configured: true,
      },
    }
  } catch (error) {
    console.error("[getAttendanceSettings] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load settings",
    }
  }
}

/**
 * Persist the school-wide attendance settings onto the default
 * AttendancePolicy row (created on first save). ADMIN/DEVELOPER only.
 */
export async function updateAttendanceSettings(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const g = await guardAttendance("manage_settings")
    if (!g.ok) return g.error
    const { schoolId } = g

    const parsed = attendanceSettingsSchema.parse(input)

    const existing = await findDefaultPolicy(schoolId)
    const data = {
      lateThreshold: parsed.lateThreshold,
      absentThreshold: parsed.absentThreshold,
      graceperiod: parsed.graceperiod,
      requireCheckOut: parsed.requireCheckOut,
      methods: parsed.methods,
      maxDailyAbsences: parsed.maxDailyAbsences,
      isActive: true,
    }

    let id: string
    if (existing) {
      // Tenant-scoped write (bare-PK update would bypass schoolId).
      await db.attendancePolicy.updateMany({
        where: { id: existing.id, schoolId },
        data,
      })
      id = existing.id
    } else {
      const created = await db.attendancePolicy.create({
        data: {
          ...data,
          schoolId,
          name: DEFAULT_POLICY_NAME,
          description: "School-wide attendance settings",
          appliesTo: ["ALL"],
          priority: 0,
          // Required Time column; marking flows don't read it yet — a
          // sensible fixed default until per-policy start times get UI.
          startTime: new Date("1970-01-01T07:30:00.000Z"),
        },
        select: { id: true },
      })
      id = created.id
    }

    revalidatePath("/attendance/settings")
    return { success: true, data: { id } }
  } catch (error) {
    console.error("[updateAttendanceSettings] Error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: "VALIDATION_ERROR" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save settings",
    }
  }
}
