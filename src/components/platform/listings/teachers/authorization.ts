/**
 * Authorization for Teachers module
 * Implements RBAC for teacher operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all teachers across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can view all teachers in school, edit own profile
 * - STAFF: Read-only access
 * - ACCOUNTANT: Read-only access (for payroll context)
 */

import { UserRole } from "@prisma/client"

export type TeacherAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"
  | "assign_class"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface TeacherContext {
  id?: string
  schoolId?: string
  userId?: string | null // Teacher's linked user account
}

/**
 * Check if user has permission to perform action on teacher
 */
export function checkTeacherPermission(
  auth: AuthContext,
  action: TeacherAction,
  teacher?: TeacherContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!teacher?.schoolId) return true
    return schoolId === teacher.schoolId
  }

  // TEACHER can view all, edit own profile
  if (role === "TEACHER") {
    // Teachers can read all teachers in school
    if (action === "read") {
      if (!teacher?.schoolId) return false
      return schoolId === teacher.schoolId
    }

    // Teachers can update own profile
    if (action === "update") {
      if (!teacher?.userId) return false
      return teacher.userId === userId && schoolId === teacher.schoolId
    }

    // Teachers cannot create, delete, bulk action, or assign classes
    return false
  }

  // STAFF and ACCOUNTANT can read teachers
  if (["STAFF", "ACCOUNTANT"].includes(role)) {
    if (action === "read") {
      if (!teacher?.schoolId) return false
      return schoolId === teacher.schoolId
    }
    if (action === "export") {
      if (!teacher?.schoolId) return false
      return schoolId === teacher.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertTeacherPermission(
  auth: AuthContext,
  action: TeacherAction,
  teacher?: TeacherContext
): void {
  if (!checkTeacherPermission(auth, action, teacher)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} teacher${teacher?.id ? ` ${teacher.id}` : ""}`
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
 * Check if role can create teachers
 */
export function canCreateTeacher(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Check if role can export teachers
 */
export function canExportTeachers(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "ACCOUNTANT", "STAFF"].includes(role)
}

/**
 * Check if role can delete teachers
 */
export function canDeleteTeacher(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): TeacherAction[] {
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
        "assign_class",
      ]
    case "TEACHER":
      return ["read", "update"] // update own profile only
    case "STAFF":
    case "ACCOUNTANT":
      return ["read", "export"]
    default:
      return []
  }
}
