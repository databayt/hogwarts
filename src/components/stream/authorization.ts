/**
 * Authorization middleware for Stream LMS
 * Implements role-based access control (RBAC) with ownership checks
 */

import { UserRole } from "@prisma/client"

export type StreamAction = "create" | "read" | "update" | "delete" | "enroll"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface CourseContext {
  id?: string
  userId?: string // Course creator
  schoolId?: string
}

/**
 * Check if a user has permission to perform an action on a Stream course
 *
 * Permission matrix:
 * | Role       | Create | Read Published | Update Own | Update Any | Delete Own | Delete Any | Enroll |
 * |------------|--------|---------------|------------|------------|------------|------------|--------|
 * | DEVELOPER  | Y      | Y             | Y          | Y          | Y          | Y          | Y      |
 * | ADMIN      | Y      | Y             | Y          | Y          | Y          | Y          | Y      |
 * | TEACHER    | Y      | Y             | Y          | N          | Y          | N          | Y      |
 * | STUDENT    | N      | Y             | N          | N          | N          | N          | Y      |
 * | GUARDIAN   | N      | Y             | N          | N          | N          | N          | Y      |
 * | Others     | N      | Y             | N          | N          | N          | N          | N      |
 */
export function checkStreamPermission(
  auth: AuthContext,
  action: StreamAction,
  course?: CourseContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") {
    return true
  }

  // Must have school context for non-DEVELOPER roles
  if (!schoolId) {
    return false
  }

  // School scope check: course must belong to same school
  if (course?.schoolId && schoolId !== course.schoolId) {
    return false
  }

  // Read: all authenticated users within their school
  if (action === "read") {
    return true
  }

  // Enroll: ADMIN, TEACHER, STUDENT, GUARDIAN
  if (action === "enroll") {
    return ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN"].includes(role)
  }

  // ADMIN has full access within their school
  if (role === "ADMIN") {
    return true
  }

  // TEACHER: create, update own, delete own
  if (role === "TEACHER") {
    if (action === "create") {
      return true
    }

    if (action === "update" || action === "delete") {
      // Must be course owner
      if (!course?.userId) return false
      return course.userId === userId
    }
  }

  // All other roles: deny
  return false
}

/**
 * Assert that user has permission, throw error if not authorized
 */
export function assertStreamPermission(
  auth: AuthContext,
  action: StreamAction,
  course?: CourseContext
): void {
  if (!checkStreamPermission(auth, action, course)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot perform ${action} on stream course${
        course?.id ? ` ${course.id}` : ""
      }`
    )
  }
}

/**
 * Get user's authorization context from session
 */
export function getAuthContext(session: any): AuthContext | null {
  if (!session?.user) return null

  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId || null,
  }
}
