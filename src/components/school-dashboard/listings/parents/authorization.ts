/**
 * Authorization for Parents (Guardians) module
 * Implements RBAC for parent/guardian operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all parents across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can view parents of students in their classes
 * - GUARDIAN: Can view and edit own profile, view linked children
 * - STAFF: Read-only access
 */

import { UserRole } from "@prisma/client"

export type ParentAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"
  | "link_student"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface ParentContext {
  id?: string
  schoolId?: string
  userId?: string | null // Parent's linked user account
}

/**
 * Check if user has permission to perform action on parent
 */
export function checkParentPermission(
  auth: AuthContext,
  action: ParentAction,
  parent?: ParentContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!parent?.schoolId) return true
    return schoolId === parent.schoolId
  }

  // TEACHER can view and link parents
  if (role === "TEACHER") {
    // Teachers can create parents (for enrollment)
    if (action === "create") return true

    // Teachers can read all parents in school
    if (action === "read") {
      if (!parent?.schoolId) return false
      return schoolId === parent.schoolId
    }

    // Teachers can link parents to students
    if (action === "link_student") {
      if (!parent?.schoolId) return true
      return schoolId === parent.schoolId
    }

    // Teachers cannot update, delete, or bulk action
    return false
  }

  // GUARDIAN can view and edit own profile
  if (role === "GUARDIAN") {
    if (action === "read" || action === "update") {
      if (!parent?.userId) return false
      return parent.userId === userId
    }
    return false
  }

  // STAFF can read parents
  if (role === "STAFF") {
    if (action === "read") {
      if (!parent?.schoolId) return false
      return schoolId === parent.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertParentPermission(
  auth: AuthContext,
  action: ParentAction,
  parent?: ParentContext
): void {
  if (!checkParentPermission(auth, action, parent)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} parent${parent?.id ? ` ${parent.id}` : ""}`
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
 * Check if role can create parents
 */
export function canCreateParent(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can export parents
 */
export function canExportParents(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Check if role can delete parents
 */
export function canDeleteParent(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): ParentAction[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return [
        "create",
        "read",
        "update",
        "delete",
        "export",
        "bulk_action",
        "link_student",
      ]
    case "TEACHER":
      return ["create", "read", "link_student"]
    case "GUARDIAN":
      return ["read", "update"] // own profile only
    case "STAFF":
      return ["read"]
    default:
      return []
  }
}
