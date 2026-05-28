"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import {
  ComplianceProvider,
  ConnectorMode,
  Prisma,
  type UserRole,
} from "@prisma/client"

import { logAudit } from "@/lib/audit-log"
import { ComplianceAudit } from "@/lib/compliance/audit-actions"
import { encryptSecret } from "@/lib/compliance/encryption"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { checkCompliancePermission } from "./authorization"
import {
  createSharedGroupSchema,
  retrySubmissionSchema,
  updateComplianceConfigSchema,
} from "./validation"

export interface ActionSuccess<T = void> {
  success: true
  data?: T
}
export interface ActionError {
  success: false
  errorCode: string
  details?: unknown
}
export type ActionResponse<T = void> = ActionSuccess<T> | ActionError

function fail(errorCode: string, details?: unknown): ActionError {
  return { success: false, errorCode, details }
}

// ============================================================================
// Update / upsert per-school compliance config
// ============================================================================

export async function updateComplianceConfig(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return fail("NOT_AUTHENTICATED")
  const { schoolId } = await getTenantContext()
  if (!schoolId) return fail("MISSING_SCHOOL_CONTEXT")
  if (
    !checkCompliancePermission(
      {
        userId: session.user.id,
        role: session.user.role as UserRole,
        schoolId,
      },
      "manage_config"
    )
  ) {
    return fail("FORBIDDEN")
  }

  const parsed = updateComplianceConfigSchema.safeParse(input)
  if (!parsed.success) return fail("VALIDATION_FAILED", parsed.error.issues)

  const data = parsed.data

  const previous = await db.schoolComplianceConfig.findUnique({
    where: {
      schoolId_provider: { schoolId, provider: data.provider },
    },
  })

  const row = await db.schoolComplianceConfig.upsert({
    where: {
      schoolId_provider: { schoolId, provider: data.provider },
    },
    create: {
      schoolId,
      provider: data.provider,
      enabled: data.enabled,
      mode: data.mode,
      submissionTimeUtc: data.submissionTimeUtc,
      parentContactSlaMinutes: data.parentContactSlaMinutes,
      notifyAdminOnFailure: data.notifyAdminOnFailure,
      sharedGroupId: data.sharedGroupId ?? null,
      providerConfig:
        (data.providerConfig as Prisma.InputJsonValue | undefined) ?? undefined,
    },
    update: {
      enabled: data.enabled,
      mode: data.mode,
      submissionTimeUtc: data.submissionTimeUtc,
      parentContactSlaMinutes: data.parentContactSlaMinutes,
      notifyAdminOnFailure: data.notifyAdminOnFailure,
      sharedGroupId: data.sharedGroupId ?? null,
      providerConfig:
        (data.providerConfig as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  })

  // Audit: enable/disable + mode change
  if (!previous && data.enabled) {
    await logAudit({
      action: ComplianceAudit.CONFIG_ENABLED,
      entityType: "SchoolComplianceConfig",
      entityId: row.id,
      newValue: { provider: data.provider, mode: data.mode },
    })
  } else if (previous && previous.enabled !== data.enabled) {
    await logAudit({
      action: data.enabled
        ? ComplianceAudit.CONFIG_ENABLED
        : ComplianceAudit.CONFIG_DISABLED,
      entityType: "SchoolComplianceConfig",
      entityId: row.id,
      previousValue: { enabled: previous.enabled },
      newValue: { enabled: data.enabled },
    })
  }
  if (previous && previous.mode !== data.mode) {
    await logAudit({
      action: ComplianceAudit.CONFIG_MODE_CHANGED,
      entityType: "SchoolComplianceConfig",
      entityId: row.id,
      previousValue: { mode: previous.mode },
      newValue: { mode: data.mode },
    })
  }

  revalidatePath("/s/[subdomain]/(school-dashboard)/compliance", "page")
  return { success: true, data: { id: row.id } }
}

// ============================================================================
// Retry a failed/rejected submission (creates a new attempt row)
// ============================================================================

export async function retryComplianceSubmission(
  input: unknown
): Promise<ActionResponse<{ submissionId: string; attemptNumber: number }>> {
  const session = await auth()
  if (!session?.user?.id) return fail("NOT_AUTHENTICATED")
  const { schoolId } = await getTenantContext()
  if (!schoolId) return fail("MISSING_SCHOOL_CONTEXT")
  if (
    !checkCompliancePermission(
      {
        userId: session.user.id,
        role: session.user.role as UserRole,
        schoolId,
      },
      "retry_submission"
    )
  ) {
    return fail("FORBIDDEN")
  }

  const parsed = retrySubmissionSchema.safeParse(input)
  if (!parsed.success) return fail("VALIDATION_FAILED", parsed.error.issues)

  const prior = await db.complianceSubmission.findUnique({
    where: { id: parsed.data.submissionId },
  })
  if (!prior || prior.schoolId !== schoolId) {
    return fail("CONFIG_NOT_FOUND")
  }

  const config = await db.schoolComplianceConfig.findUnique({
    where: {
      schoolId_provider: { schoolId, provider: prior.provider },
    },
  })
  if (!config || !config.enabled) return fail("CONFIG_NOT_FOUND")

  // Find max attemptNumber for this date/provider to compute next attempt
  const latest = await db.complianceSubmission.findFirst({
    where: {
      schoolId,
      provider: prior.provider,
      submissionDate: prior.submissionDate,
    },
    orderBy: { attemptNumber: "desc" },
    select: { attemptNumber: true },
  })
  const nextAttempt = (latest?.attemptNumber ?? prior.attemptNumber) + 1

  const created = await db.complianceSubmission.create({
    data: {
      schoolId,
      provider: prior.provider,
      submissionDate: prior.submissionDate,
      attemptNumber: nextAttempt,
      mode: config.mode,
      status: "QUEUED",
      supersededById: prior.id,
    },
  })

  await logAudit({
    action: ComplianceAudit.SUBMISSION_QUEUED,
    entityType: "ComplianceSubmission",
    entityId: created.id,
    metadata: {
      reason: "manual_retry",
      priorSubmissionId: prior.id,
      attemptNumber: nextAttempt,
    },
  })

  revalidatePath("/s/[subdomain]/(school-dashboard)/compliance", "page")
  return {
    success: true,
    data: { submissionId: created.id, attemptNumber: nextAttempt },
  }
}

// ============================================================================
// DEVELOPER-only: create a shared credential group
// ============================================================================

export async function createSharedCredentialGroup(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return fail("NOT_AUTHENTICATED")
  // No school context required — DEVELOPER acts cross-tenant
  if (session.user.role !== "DEVELOPER") return fail("FORBIDDEN")

  const parsed = createSharedGroupSchema.safeParse(input)
  if (!parsed.success) return fail("VALIDATION_FAILED", parsed.error.issues)

  let envelope
  try {
    envelope = encryptSecret(parsed.data.secretJson)
  } catch (error) {
    return fail("ENCRYPTION_KEY_MISSING", {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  const row = await db.sharedComplianceCredentialGroup.create({
    data: {
      name: parsed.data.name,
      provider: parsed.data.provider,
      encryptedSecret: envelope.ciphertext,
      keyVersion: envelope.keyVersion,
    },
  })

  await logAudit({
    action: ComplianceAudit.CREDENTIAL_CREATED,
    entityType: "SharedComplianceCredentialGroup",
    entityId: row.id,
    metadata: { name: parsed.data.name, provider: parsed.data.provider },
    schoolId: null, // cross-tenant
  })

  return { success: true, data: { id: row.id } }
}
