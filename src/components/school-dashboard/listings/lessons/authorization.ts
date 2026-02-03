/**
 * Authorization for Lessons module
 * Implements RBAC for lesson operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all lessons across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can manage lessons for their classes
 * - STUDENT: Can view lessons for enrolled classes
 * - STAFF: Read-only access
 */

import { UserRole } from "@prisma/client"

export type LessonAction =
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

export interface LessonContext {
  id?: string
  schoolId?: string
  classId?: string
  teacherId?: string | null // Class teacher's ID
}

/**
 * Check if user has permission to perform action on lesson
 */
export function checkLessonPermission(
  auth: AuthContext,
  action: LessonAction,
  lesson?: LessonContext
): boolean {
  const { role, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!lesson?.schoolId) return true
    return schoolId === lesson.schoolId
  }

  // TEACHER can manage lessons for their classes
  if (role === "TEACHER") {
    // Teachers can create lessons
    if (action === "create") return true

    // Teachers can read all lessons in school
    if (action === "read") {
      if (!lesson?.schoolId) return false
      return schoolId === lesson.schoolId
    }

    // Teachers can update/delete lessons for their classes
    if (action === "update" || action === "delete") {
      if (!lesson?.schoolId) return false
      // For now, allow if in same school (would need teacherId check)
      return schoolId === lesson.schoolId
    }

    // Teachers can export lessons
    if (action === "export") {
      if (!lesson?.schoolId) return false
      return schoolId === lesson.schoolId
    }

    // Teachers cannot bulk action
    if (action === "bulk_action") {
      return false
    }
  }

  // STUDENT can view lessons
  if (role === "STUDENT") {
    if (action === "read") {
      if (!lesson?.schoolId) return false
      return schoolId === lesson.schoolId
    }
    return false
  }

  // STAFF can read lessons
  if (role === "STAFF") {
    if (action === "read") {
      if (!lesson?.schoolId) return false
      return schoolId === lesson.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertLessonPermission(
  auth: AuthContext,
  action: LessonAction,
  lesson?: LessonContext
): void {
  if (!checkLessonPermission(auth, action, lesson)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} lesson${lesson?.id ? ` ${lesson.id}` : ""}`
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
 * Check if role can create lessons
 */
export function canCreateLesson(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can export lessons
 */
export function canExportLessons(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Check if role can delete lessons
 */
export function canDeleteLesson(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): LessonAction[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return ["create", "read", "update", "delete", "export", "bulk_action"]
    case "TEACHER":
      return ["create", "read", "update", "delete", "export"]
    case "STUDENT":
    case "STAFF":
      return ["read"]
    default:
      return []
  }
}
