/**
 * Authorization for Assignments module
 * Implements RBAC for assignment operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all assignments across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can manage assignments for their classes
 * - STUDENT: Can view and submit assignments for enrolled classes
 * - GUARDIAN: Can view assignments (read-only)
 */

import { UserRole } from "@prisma/client"

export type AssignmentAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"
  | "submit"
  | "grade"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface AssignmentContext {
  id?: string
  schoolId?: string
  classId?: string
  teacherId?: string | null // Class teacher's ID
}

/**
 * Check if user has permission to perform action on assignment
 */
export function checkAssignmentPermission(
  auth: AuthContext,
  action: AssignmentAction,
  assignment?: AssignmentContext
): boolean {
  const { role, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!assignment?.schoolId) return true
    return schoolId === assignment.schoolId
  }

  // TEACHER can manage assignments for their classes
  if (role === "TEACHER") {
    // Teachers can create assignments
    if (action === "create") return true

    // Teachers can read all assignments in school
    if (action === "read") {
      if (!assignment?.schoolId) return false
      return schoolId === assignment.schoolId
    }

    // Teachers can update/delete/grade assignments for their classes
    if (
      action === "update" ||
      action === "delete" ||
      action === "grade" ||
      action === "export"
    ) {
      if (!assignment?.schoolId) return false
      if (schoolId !== assignment.schoolId) return false
      // If teacherId available, check ownership
      if (assignment.teacherId) {
        return assignment.teacherId === auth.userId
      }
      return true // Allow if no teacher tracking
    }

    // Teachers cannot bulk action
    if (action === "bulk_action") {
      return false
    }

    // Teachers cannot submit (students only)
    if (action === "submit") {
      return false
    }
  }

  // STUDENT can view and submit assignments
  if (role === "STUDENT") {
    if (action === "read") {
      if (!assignment?.schoolId) return false
      return schoolId === assignment.schoolId
    }
    if (action === "submit") {
      if (!assignment?.schoolId) return false
      return schoolId === assignment.schoolId
    }
    return false
  }

  // GUARDIAN can view assignments (read-only)
  if (role === "GUARDIAN") {
    if (action === "read") {
      if (!assignment?.schoolId) return false
      return schoolId === assignment.schoolId
    }
    return false
  }

  // STAFF can read assignments
  if (role === "STAFF") {
    if (action === "read") {
      if (!assignment?.schoolId) return false
      return schoolId === assignment.schoolId
    }
    return false
  }

  // ACCOUNTANT can read assignments
  if (role === "ACCOUNTANT") {
    if (action === "read") {
      if (!assignment?.schoolId) return false
      return schoolId === assignment.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertAssignmentPermission(
  auth: AuthContext,
  action: AssignmentAction,
  assignment?: AssignmentContext
): void {
  if (!checkAssignmentPermission(auth, action, assignment)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} assignment${assignment?.id ? ` ${assignment.id}` : ""}`
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
 * Check if role can create assignments
 */
export function canCreateAssignment(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can export assignments
 */
export function canExportAssignments(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can delete assignments
 */
export function canDeleteAssignment(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can grade assignments
 */
export function canGradeAssignment(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): AssignmentAction[] {
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
        "submit",
        "grade",
      ]
    case "TEACHER":
      return ["create", "read", "update", "delete", "export", "grade"]
    case "STUDENT":
      return ["read", "submit"]
    case "GUARDIAN":
    case "STAFF":
    case "ACCOUNTANT":
      return ["read"]
    default:
      return []
  }
}
