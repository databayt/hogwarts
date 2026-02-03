/**
 * Authorization for Students module
 * Implements RBAC for student operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all students across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can view all students in school, manage students in their classes
 * - STUDENT: Can view own profile
 * - GUARDIAN: Can view linked children
 * - STAFF: Read-only access
 * - ACCOUNTANT: Read-only access (for billing/financial context)
 */

import { UserRole } from "@prisma/client"

export type StudentAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"
  | "enroll"
  | "link_guardian"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface StudentContext {
  id?: string
  schoolId?: string
  userId?: string | null // Student's linked user account
}

/**
 * Check if user has permission to perform action on student
 */
export function checkStudentPermission(
  auth: AuthContext,
  action: StudentAction,
  student?: StudentContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!student?.schoolId) return true
    return schoolId === student.schoolId
  }

  // TEACHER can manage students
  if (role === "TEACHER") {
    // Teachers can create students
    if (action === "create") return true

    // Teachers can read all students in school
    if (action === "read") {
      if (!student?.schoolId) return false
      return schoolId === student.schoolId
    }

    // Teachers can update students in their school
    if (action === "update") {
      if (!student?.schoolId) return false
      return schoolId === student.schoolId
    }

    // Teachers can enroll students
    if (action === "enroll" || action === "link_guardian") {
      if (!student?.schoolId) return true
      return schoolId === student.schoolId
    }

    // Teachers can export students
    if (action === "export") {
      if (!student?.schoolId) return true
      return schoolId === student.schoolId
    }

    // Teachers cannot delete or bulk action
    if (action === "delete" || action === "bulk_action") {
      return false
    }
  }

  // STUDENT can only view themselves
  if (role === "STUDENT") {
    if (action === "read") {
      // Would need to check if auth user matches student user
      // For now, require exact match
      if (!student?.userId) return false
      return student.userId === userId
    }
    return false
  }

  // GUARDIAN can view linked children
  if (role === "GUARDIAN") {
    if (action === "read") {
      // Would need to check guardian-student relationship
      // Simplified: deny until proper implementation
      return false
    }
    return false
  }

  // STAFF and ACCOUNTANT can read students
  if (["STAFF", "ACCOUNTANT"].includes(role)) {
    if (action === "read") {
      if (!student?.schoolId) return false
      return schoolId === student.schoolId
    }
    if (action === "export") {
      if (!student?.schoolId) return false
      return schoolId === student.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertStudentPermission(
  auth: AuthContext,
  action: StudentAction,
  student?: StudentContext
): void {
  if (!checkStudentPermission(auth, action, student)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} student${student?.id ? ` ${student.id}` : ""}`
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
 * Check if role can create students
 */
export function canCreateStudent(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can export students
 */
export function canExportStudents(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER", "ACCOUNTANT", "STAFF"].includes(role)
}

/**
 * Check if role can delete students
 */
export function canDeleteStudent(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): StudentAction[] {
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
        "enroll",
        "link_guardian",
      ]
    case "TEACHER":
      return ["create", "read", "update", "export", "enroll", "link_guardian"]
    case "STAFF":
    case "ACCOUNTANT":
      return ["read", "export"]
    case "STUDENT":
      return ["read"]
    case "GUARDIAN":
      return ["read"]
    default:
      return []
  }
}
