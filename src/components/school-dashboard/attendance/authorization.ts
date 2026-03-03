// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

// ============================================================================
// Types
// ============================================================================

export type AttendanceAction =
  | "mark"
  | "read_own"
  | "read_class"
  | "read_school"
  | "delete"
  | "restore"
  | "bulk_upload"
  | "export"
  | "view_analytics"
  | "view_compliance"
  | "manage_settings"
  | "manage_policy"
  | "manage_intervention"
  | "manage_excuse"
  | "submit_excuse"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

// ============================================================================
// Role groups
// ============================================================================

export const ADMIN_ROLES: UserRole[] = ["DEVELOPER", "ADMIN"]
export const STAFF_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
]
export const MARKING_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
]
export const ANALYTICS_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
]

// ============================================================================
// Permission matrix
// ============================================================================

const PERMISSION_MATRIX: Record<AttendanceAction, UserRole[]> = {
  mark: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
  read_own: ["DEVELOPER", "ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "STAFF"],
  read_class: ["DEVELOPER", "ADMIN", "TEACHER"],
  read_school: ["DEVELOPER", "ADMIN", "STAFF"],
  delete: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
  restore: ["DEVELOPER", "ADMIN"],
  bulk_upload: ["DEVELOPER", "ADMIN", "TEACHER"],
  export: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
  view_analytics: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
  view_compliance: ["DEVELOPER", "ADMIN"],
  manage_settings: ["DEVELOPER", "ADMIN"],
  manage_policy: ["DEVELOPER", "ADMIN"],
  manage_intervention: ["DEVELOPER", "ADMIN"],
  manage_excuse: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
  submit_excuse: ["DEVELOPER", "ADMIN", "GUARDIAN"],
}

// ============================================================================
// Core permission checks
// ============================================================================

export function checkAttendancePermission(
  auth: AuthContext,
  action: AttendanceAction
): boolean {
  if (!auth.role) return false

  // DEVELOPER has full access
  if (auth.role === "DEVELOPER") return true

  // Must have school context for non-DEVELOPER roles
  if (!auth.schoolId) return false

  return PERMISSION_MATRIX[action]?.includes(auth.role) ?? false
}

export function assertAttendancePermission(
  auth: AuthContext,
  action: AttendanceAction
): void {
  if (!checkAttendancePermission(auth, action)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot perform '${action}' on attendance`
    )
  }
}

// ============================================================================
// Convenience helpers (pure functions, no DB calls)
// ============================================================================

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role)
}

export function canMarkAttendance(role: UserRole): boolean {
  return MARKING_ROLES.includes(role)
}

export function canViewSchoolAnalytics(role: UserRole): boolean {
  return ANALYTICS_ROLES.includes(role)
}

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function getAuthContext(
  session: {
    user?: { id?: string; role?: string; schoolId?: string | null }
  } | null
): AuthContext | null {
  if (!session?.user?.id || !session.user.role) return null
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId || null,
  }
}
