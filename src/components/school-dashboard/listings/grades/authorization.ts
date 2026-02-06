/**
 * Authorization middleware for grades/results feature
 * Implements role-based access control (RBAC) for result operations
 *
 * Pattern follows announcements module for consistency
 */

import { UserRole } from "@prisma/client"

export type ResultAction =
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

export interface ResultContext {
  id?: string
  gradedBy?: string | null
  schoolId?: string
  classId?: string
  studentId?: string
}

/**
 * Check if a user has permission to perform an action on a result
 * @param auth - User authentication context
 * @param action - Action to perform
 * @param result - Result context (optional for create)
 * @returns true if authorized, false otherwise
 */
export function checkResultPermission(
  auth: AuthContext,
  action: ResultAction,
  result?: ResultContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER role has full access
  if (role === "DEVELOPER") {
    return true
  }

  // Must have school context for all operations
  if (!schoolId) {
    return false
  }

  // ADMIN has full access within their school
  if (role === "ADMIN") {
    if (!result?.schoolId) return true // For create
    return schoolId === result.schoolId
  }

  // TEACHER can manage grades within their school
  if (role === "TEACHER") {
    // Teachers can create results
    if (action === "create") {
      return true
    }

    // Teachers can read all results in their school
    if (action === "read") {
      if (!result?.schoolId) return false
      return schoolId === result.schoolId
    }

    // Teachers can update/delete results they created
    if (action === "update" || action === "delete") {
      if (!result?.schoolId || !result?.gradedBy) return false
      return schoolId === result.schoolId && result.gradedBy === userId
    }

    // Teachers can export results in their school
    if (action === "export") {
      if (!result?.schoolId) return true
      return schoolId === result.schoolId
    }

    // Teachers cannot perform bulk actions
    if (action === "bulk_action") {
      return false
    }
  }

  // ACCOUNTANT can read and export results (for financial reporting)
  if (role === "ACCOUNTANT") {
    if (action === "read" || action === "export") {
      if (!result?.schoolId) return false
      return schoolId === result.schoolId
    }
    return false
  }

  // STAFF can read results
  if (role === "STAFF") {
    if (action === "read") {
      if (!result?.schoolId) return false
      return schoolId === result.schoolId
    }
    return false
  }

  // STUDENT can only read their own results
  if (role === "STUDENT") {
    if (action === "read") {
      // Would need student ID mapping to implement properly
      // For now, deny access - proper implementation requires linking user to student record
      return false
    }
    return false
  }

  // GUARDIAN can read their children's results
  if (role === "GUARDIAN") {
    if (action === "read") {
      // Would need guardian-student relationship to implement properly
      // For now, deny access - proper implementation requires checking guardian-student link
      return false
    }
    return false
  }

  // USER role has no access
  if (role === "USER") {
    return false
  }

  // Default: deny access
  return false
}

/**
 * Assert that user has permission, throw error if not authorized
 * @param auth - User authentication context
 * @param action - Action to perform
 * @param result - Result context
 * @throws Error if not authorized
 */
export function assertResultPermission(
  auth: AuthContext,
  action: ResultAction,
  result?: ResultContext
): void {
  if (!checkResultPermission(auth, action, result)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot perform ${action} on result${
        result?.id ? ` ${result.id}` : ""
      }`
    )
  }
}

/**
 * Get user's authorization context from session
 * @param session - NextAuth session object
 * @returns AuthContext or null if not authenticated
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
 * Check if user can create results
 * @param role - User role
 * @returns true if user can create results
 */
export function canCreateResult(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN" || role === "TEACHER"
}

/**
 * Check if user can export results
 * @param role - User role
 * @returns true if user can export results
 */
export function canExportResults(role: UserRole): boolean {
  return (
    role === "DEVELOPER" ||
    role === "ADMIN" ||
    role === "TEACHER" ||
    role === "ACCOUNTANT"
  )
}

/**
 * Check if user can perform bulk actions on results
 * @param role - User role
 * @returns true if user can perform bulk actions
 */
export function canBulkActionResults(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN"
}

/**
 * Get allowed actions for a user role
 * @param role - User role
 * @returns Array of allowed result actions
 */
export function getAllowedActions(role: UserRole): ResultAction[] {
  switch (role) {
    case "DEVELOPER":
      return ["create", "read", "update", "delete", "export", "bulk_action"]
    case "ADMIN":
      return ["create", "read", "update", "delete", "export", "bulk_action"]
    case "TEACHER":
      return ["create", "read", "update", "delete", "export"]
    case "ACCOUNTANT":
      return ["read", "export"]
    case "STAFF":
      return ["read"]
    case "STUDENT":
      return ["read"] // Limited to own results
    case "GUARDIAN":
      return ["read"] // Limited to children's results
    default:
      return []
  }
}

/**
 * Check if user can delete results
 * @param role - User role
 * @returns true if user can delete results
 */
export function canDeleteResult(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN"
}
