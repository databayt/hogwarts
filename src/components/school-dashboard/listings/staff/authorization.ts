/**
 * Authorization for Staff module
 * Implements RBAC for staff (non-teaching employees) operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all staff across all schools
 * - ADMIN: Full access within their school
 * - STAFF: Can view all staff, edit own profile
 * - ACCOUNTANT: Read-only access (for payroll context)
 * - TEACHER: Read-only access
 */

import { UserRole } from "@prisma/client"

export type StaffAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface StaffContext {
  id?: string
  schoolId?: string
  userId?: string | null // Staff member's linked user account
}

/**
 * Check if user has permission to perform action on staff member
 */
export function checkStaffPermission(
  auth: AuthContext,
  action: StaffAction,
  staff?: StaffContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!staff?.schoolId) return true
    return schoolId === staff.schoolId
  }

  // STAFF can view all, edit own profile
  if (role === "STAFF") {
    // Staff can read all staff members in school
    if (action === "read") {
      if (!staff?.schoolId) return false
      return schoolId === staff.schoolId
    }

    // Staff can update own profile
    if (action === "update") {
      if (!staff?.userId) return false
      return staff.userId === userId && schoolId === staff.schoolId
    }

    // Staff cannot create, delete, or bulk action
    return false
  }

  // ACCOUNTANT can read staff (for payroll)
  if (role === "ACCOUNTANT") {
    if (action === "read") {
      if (!staff?.schoolId) return false
      return schoolId === staff.schoolId
    }
    if (action === "export") {
      if (!staff?.schoolId) return false
      return schoolId === staff.schoolId
    }
    return false
  }

  // TEACHER can read staff
  if (role === "TEACHER") {
    if (action === "read") {
      if (!staff?.schoolId) return false
      return schoolId === staff.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertStaffPermission(
  auth: AuthContext,
  action: StaffAction,
  staff?: StaffContext
): void {
  if (!checkStaffPermission(auth, action, staff)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} staff${staff?.id ? ` ${staff.id}` : ""}`
    )
  }
}

/**
 * Get auth context from session
 */
export function getAuthContext(session: any): AuthContext | null {
  if (!session?.user) return null
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId || null,
  }
}

/**
 * Check if role can create staff
 */
export function canCreateStaff(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Check if role can export staff
 */
export function canExportStaff(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "ACCOUNTANT"].includes(role)
}

/**
 * Check if role can delete staff
 */
export function canDeleteStaff(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): StaffAction[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return ["create", "read", "update", "delete", "export", "bulk_action"]
    case "STAFF":
      return ["read", "update"] // update own profile only
    case "ACCOUNTANT":
      return ["read", "export"]
    case "TEACHER":
      return ["read"]
    default:
      return []
  }
}
