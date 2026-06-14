// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timetable Permission System - Server-Side Functions
 * Server-only permission guards and context functions
 */

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Import what we need from config
import {
  canConfigureSettings,
  canExportTimetable,
  canManageConflicts,
  canModifyTimetable,
  canViewTimetable,
  getAccessLevel,
  hasPermission,
  PERMISSION_MATRIX,
  type TimetableAction,
  type TimetableRole,
} from "./permissions-config"

// Re-export all client-safe utilities
export * from "./permissions-config"

// ============================================================================
// Server-Side Permission Guards
// ============================================================================

/**
 * Require a specific permission or throw an error
 * Use this in server actions
 */
export async function requirePermission(
  action: TimetableAction
): Promise<void> {
  const session = await auth()
  // Distinguish "not signed in" from "signed in but unauthorized" so callers
  // (and the client error mapping) can react correctly to each.
  if (!session?.user?.id) throw new Error("NOT_AUTHENTICATED")
  const role = session.user.role as TimetableRole | undefined

  if (!hasPermission(role, action)) {
    throw new Error(`Permission denied: ${action} requires higher privileges`)
  }
}

/**
 * Require admin access or throw an error
 */
export async function requireAdminAccess(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("NOT_AUTHENTICATED")
  const role = session.user.role as TimetableRole | undefined

  if (!canModifyTimetable(role)) {
    throw new Error("Permission denied: Admin access required")
  }
}

/**
 * Require at least read access or throw an error
 */
export async function requireReadAccess(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("NOT_AUTHENTICATED")
  const role = session.user.role as TimetableRole | undefined

  if (!canViewTimetable(role)) {
    throw new Error(
      "Permission denied: You do not have access to view timetable"
    )
  }
}

/**
 * Get the current user's permissions context
 */
export async function getPermissionContext() {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  const role = session?.user?.role as TimetableRole | undefined
  const userId = session?.user?.id
  const email = session?.user?.email

  return {
    userId,
    email,
    schoolId,
    role,
    accessLevel: getAccessLevel(role),
    permissions: role ? PERMISSION_MATRIX[role] : [],
    canView: canViewTimetable(role),
    canModify: canModifyTimetable(role),
    canExport: canExportTimetable(role),
    canManageConflicts: canManageConflicts(role),
    canConfigureSettings: canConfigureSettings(role),
  }
}

// ============================================================================
// Data Filtering Functions
// ============================================================================

/**
 * Minimal shape a timetable row needs for role-based visibility filtering.
 * Typed (not `any`) so a rename of these fields in the Prisma model surfaces
 * as a compile error here instead of silently breaking the filter.
 */
export interface TimetableRowMinimal {
  teacherId?: string | null
  classId?: string | null
  sectionId?: string | null
}

/**
 * Filter timetable data based on user role
 * Used to restrict what data a user can see
 */
export async function filterTimetableByRole<T extends TimetableRowMinimal>(
  timetableData: T[],
  options?: {
    teacherId?: string
    studentId?: string
    classId?: string
    childIds?: string[]
  }
): Promise<T[]> {
  const { role } = await getPermissionContext()

  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
    case "ACCOUNTANT":
    case "STAFF":
      // Can see all timetable data
      return timetableData

    case "TEACHER":
      // Can see all, but UI might highlight their own
      if (options?.teacherId) {
        // Filter to show only teacher's classes
        return timetableData.filter(
          (item) => item.teacherId === options.teacherId
        )
      }
      return timetableData

    case "STUDENT":
      // Can only see their class timetable
      if (options?.classId) {
        return timetableData.filter((item) => item.classId === options.classId)
      }
      return []

    case "GUARDIAN":
      // Can only see their children's timetables
      // childIds are student IDs — resolve to class IDs via StudentClass
      if (options?.childIds && options.childIds.length > 0) {
        const { schoolId } = await getPermissionContext()
        // Never run the cross-family query without a tenant filter — a null
        // schoolId would match StudentClass rows across ALL schools.
        if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")
        const enrollments = await db.studentClass.findMany({
          where: {
            studentId: { in: options.childIds },
            schoolId,
          },
          select: { classId: true },
        })
        const childClassIds = new Set(enrollments.map((e) => e.classId))
        return timetableData.filter(
          (item) => item.classId != null && childClassIds.has(item.classId)
        )
      }
      return []

    default:
      // No access
      return []
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log timetable actions for audit trail
 */
export async function logTimetableAction(
  action: TimetableAction,
  details: {
    entityId?: string
    entityType?:
      | "slot"
      | "config"
      | "conflict"
      | "bulk"
      | "term"
      | "teacher_constraint"
      | "room_constraint"
      | "template"
      | "template_application"
      | "period"
      | "scheduleException"
      | "scheduleConfig"
      | "generation"
      | "import"
      | "teacherAbsence"
      | "substitution"
    changes?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
) {
  const { userId, email, schoolId, role } = await getPermissionContext()

  const auditLog = {
    timestamp: new Date().toISOString(),
    userId,
    email,
    schoolId,
    role,
    action,
    ...details,
  }

  // Structured audit line, emitted in ALL environments so production keeps a
  // trail via the platform log drain (Vercel). A dedicated audit table is the
  // tracked follow-up (see ISSUE.md); until then this console sink is the only
  // record, so it must not be gated behind NODE_ENV.
  console.info("[TIMETABLE_AUDIT]", JSON.stringify(auditLog))

  return auditLog
}

// Note: the previous withPermission / withAdminAccess / withAudit higher-order
// wrappers were removed — they were unused dead code and relied on unsafe
// `(...args: any[]) => any` + `as T` casts. Server actions call requireAdmin
// Access() / requirePermission() / logTimetableAction() directly instead.
