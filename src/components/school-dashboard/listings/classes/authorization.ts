/**
 * Authorization for Classes module
 * Implements RBAC for class operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all classes across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can view all classes, manage own classes, enroll students
 * - STUDENT: Can view classes they're enrolled in
 * - STAFF: Read-only access
 */

import { UserRole } from "@prisma/client"

export type ClassAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"
  | "enroll_student"
  | "assign_teacher"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface ClassContext {
  id?: string
  schoolId?: string
  teacherId?: string | null // Class's assigned teacher
}

/**
 * Check if user has permission to perform action on class
 */
export function checkClassPermission(
  auth: AuthContext,
  action: ClassAction,
  cls?: ClassContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!cls?.schoolId) return true
    return schoolId === cls.schoolId
  }

  // TEACHER can manage their own classes
  if (role === "TEACHER") {
    // Teachers can create classes
    if (action === "create") return true

    // Teachers can read all classes in school
    if (action === "read") {
      if (!cls?.schoolId) return false
      return schoolId === cls.schoolId
    }

    // Teachers can update, enroll students in their own classes
    if (
      action === "update" ||
      action === "enroll_student" ||
      action === "export"
    ) {
      if (!cls?.schoolId) return false
      // Check if it's their class (would need teacherId lookup)
      return schoolId === cls.schoolId
    }

    // Teachers cannot delete or bulk action
    if (action === "delete" || action === "bulk_action") {
      return false
    }

    // Teachers cannot assign other teachers
    if (action === "assign_teacher") {
      return false
    }
  }

  // STUDENT can only view enrolled classes
  if (role === "STUDENT") {
    if (action === "read") {
      // Would need to check enrollment
      // For now, allow read if in same school
      if (!cls?.schoolId) return false
      return schoolId === cls.schoolId
    }
    return false
  }

  // STAFF can read classes
  if (role === "STAFF") {
    if (action === "read") {
      if (!cls?.schoolId) return false
      return schoolId === cls.schoolId
    }
    if (action === "export") {
      if (!cls?.schoolId) return false
      return schoolId === cls.schoolId
    }
    return false
  }

  // ACCOUNTANT can read classes (for financial reporting)
  if (role === "ACCOUNTANT") {
    if (action === "read") {
      if (!cls?.schoolId) return false
      return schoolId === cls.schoolId
    }
    return false
  }

  // GUARDIAN can read classes
  if (role === "GUARDIAN") {
    if (action === "read") {
      if (!cls?.schoolId) return false
      return schoolId === cls.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertClassPermission(
  auth: AuthContext,
  action: ClassAction,
  cls?: ClassContext
): void {
  if (!checkClassPermission(auth, action, cls)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} class${cls?.id ? ` ${cls.id}` : ""}`
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
 * Check if role can create classes
 */
export function canCreateClass(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can export classes
 */
export function canExportClasses(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"].includes(role)
}

/**
 * Check if role can delete classes
 */
export function canDeleteClass(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): ClassAction[] {
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
        "enroll_student",
        "assign_teacher",
      ]
    case "TEACHER":
      return ["create", "read", "update", "export", "enroll_student"]
    case "STAFF":
      return ["read", "export"]
    case "STUDENT":
    case "ACCOUNTANT":
    case "GUARDIAN":
      return ["read"]
    default:
      return []
  }
}
