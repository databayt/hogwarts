/**
 * Authorization for Subjects module
 * Implements RBAC for subject operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all subjects across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Read-only access
 * - STUDENT: Read-only access
 * - STAFF: Read-only access
 */

import { UserRole } from "@prisma/client"

export type SubjectAction =
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

export interface SubjectContext {
  id?: string
  schoolId?: string
}

/**
 * Check if user has permission to perform action on subject
 */
export function checkSubjectPermission(
  auth: AuthContext,
  action: SubjectAction,
  subject?: SubjectContext
): boolean {
  const { role, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!subject?.schoolId) return true
    return schoolId === subject.schoolId
  }

  // TEACHER, STUDENT, STAFF can read subjects
  if (["TEACHER", "STUDENT", "STAFF"].includes(role)) {
    if (action === "read") {
      if (!subject?.schoolId) return false
      return schoolId === subject.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertSubjectPermission(
  auth: AuthContext,
  action: SubjectAction,
  subject?: SubjectContext
): void {
  if (!checkSubjectPermission(auth, action, subject)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} subject${subject?.id ? ` ${subject.id}` : ""}`
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
 * Check if role can create subjects
 */
export function canCreateSubject(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Check if role can export subjects
 */
export function canExportSubjects(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Check if role can delete subjects
 */
export function canDeleteSubject(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): SubjectAction[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return ["create", "read", "update", "delete", "export", "bulk_action"]
    case "TEACHER":
    case "STUDENT":
    case "STAFF":
      return ["read"]
    default:
      return []
  }
}
