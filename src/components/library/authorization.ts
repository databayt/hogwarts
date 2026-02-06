/**
 * Authorization for Library module
 * Implements RBAC for library operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all library operations across all schools
 * - ADMIN: Full access within their school
 * - TEACHER/STUDENT/GUARDIAN: Read + borrow + return
 * - STAFF/ACCOUNTANT: Read-only access
 */

import { UserRole } from "@prisma/client"

export type LibraryAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "borrow"
  | "return"
  | "admin"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface BookContext {
  id?: string
  schoolId?: string
}

/**
 * Check if user has permission to perform action on library resource
 */
export function checkLibraryPermission(
  auth: AuthContext,
  action: LibraryAction,
  book?: BookContext
): boolean {
  const { role, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // Verify book belongs to same school if provided
  if (book?.schoolId && schoolId !== book.schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") return true

  // TEACHER, STUDENT, GUARDIAN can read + borrow + return
  if (["TEACHER", "STUDENT", "GUARDIAN"].includes(role)) {
    return ["read", "borrow", "return"].includes(action)
  }

  // STAFF, ACCOUNTANT can only read
  if (["STAFF", "ACCOUNTANT"].includes(role)) {
    return action === "read"
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertLibraryPermission(
  auth: AuthContext,
  action: LibraryAction,
  book?: BookContext
): void {
  if (!checkLibraryPermission(auth, action, book)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} library resource${book?.id ? ` ${book.id}` : ""}`
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
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): LibraryAction[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return ["create", "read", "update", "delete", "borrow", "return", "admin"]
    case "TEACHER":
    case "STUDENT":
    case "GUARDIAN":
      return ["read", "borrow", "return"]
    case "STAFF":
    case "ACCOUNTANT":
      return ["read"]
    default:
      return []
  }
}
