/**
 * Authorization middleware for announcements feature
 * Implements role-based access control (RBAC) for announcement operations
 */

import { UserRole } from "@prisma/client"

export type AnnouncementAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "bulk_action"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface AnnouncementContext {
  id?: string
  createdBy?: string | null
  schoolId?: string
  scope?: "school" | "class" | "role"
}

/**
 * Check if a user has permission to perform an action on an announcement
 * @param auth - User authentication context
 * @param action - Action to perform
 * @param announcement - Announcement context (optional for create)
 * @returns true if authorized, false otherwise
 */
export function checkAnnouncementPermission(
  auth: AuthContext,
  action: AnnouncementAction,
  announcement?: AnnouncementContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER role has full access
  if (role === "DEVELOPER") {
    return true
  }

  // All authenticated users can read announcements in their school
  if (action === "read") {
    if (!schoolId || !announcement?.schoolId) return false
    return schoolId === announcement.schoolId
  }

  // ADMIN has full access within their school
  if (role === "ADMIN") {
    if (!schoolId || !announcement?.schoolId) return true // For create
    return schoolId === announcement.schoolId
  }

  // TEACHER can create and manage their own announcements
  if (role === "TEACHER") {
    if (action === "create") {
      // Teachers can only create CLASS-scoped announcements
      return announcement?.scope === "class"
    }

    if (action === "update" || action === "delete" || action === "publish") {
      // Teachers can only edit/delete their own announcements
      if (!announcement?.createdBy) return false
      return (
        announcement.createdBy === userId && schoolId === announcement.schoolId
      )
    }

    // Teachers cannot perform bulk actions
    if (action === "bulk_action") {
      return false
    }
  }

  // ACCOUNTANT and STAFF can read (handled above) but not modify
  if (role === "ACCOUNTANT" || role === "STAFF") {
    return false // Read already handled, deny all other actions
  }

  // STUDENT, GUARDIAN, and USER roles are read-only (handled above)
  if (role === "STUDENT" || role === "GUARDIAN" || role === "USER") {
    return false // Read already handled, deny all other actions
  }

  // Default: deny access
  return false
}

/**
 * Assert that user has permission, throw error if not authorized
 * @param auth - User authentication context
 * @param action - Action to perform
 * @param announcement - Announcement context
 * @throws Error if not authorized
 */
export function assertAnnouncementPermission(
  auth: AuthContext,
  action: AnnouncementAction,
  announcement?: AnnouncementContext
): void {
  if (!checkAnnouncementPermission(auth, action, announcement)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot perform ${action} on announcement${
        announcement?.id ? ` ${announcement.id}` : ""
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
 * Check if user can create school-wide announcements
 * @param role - User role
 * @returns true if user can create school-wide announcements
 */
export function canCreateSchoolAnnouncement(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN"
}

/**
 * Check if user can create class-scoped announcements
 * @param role - User role
 * @returns true if user can create class-scoped announcements
 */
export function canCreateClassAnnouncement(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN" || role === "TEACHER"
}

/**
 * Check if user can create role-scoped announcements
 * @param role - User role
 * @returns true if user can create role-scoped announcements
 */
export function canCreateRoleAnnouncement(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN"
}

/**
 * Get allowed scopes for a user role
 * @param role - User role
 * @returns Array of allowed announcement scopes
 */
export function getAllowedScopes(
  role: UserRole
): ("school" | "class" | "role")[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return ["school", "class", "role"]
    case "TEACHER":
      return ["class"]
    default:
      return []
  }
}

/**
 * Validate that announcement scope matches user's permissions
 * @param auth - User authentication context
 * @param scope - Announcement scope
 * @throws Error if scope is not allowed
 */
export function validateAnnouncementScope(
  auth: AuthContext,
  scope: "school" | "class" | "role"
): void {
  const allowedScopes = getAllowedScopes(auth.role)

  if (!allowedScopes.includes(scope)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot create ${scope}-scoped announcements`
    )
  }
}
