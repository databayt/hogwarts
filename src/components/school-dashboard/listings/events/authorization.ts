/**
 * Authorization for Events module
 * Implements RBAC for event operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all events across all schools
 * - ADMIN: Full access within their school
 * - TEACHER: Can create and manage their own events
 * - STAFF: Can create and manage events
 * - STUDENT: Can view public events
 * - GUARDIAN: Can view public events
 */

import { UserRole } from "@prisma/client"

export type EventAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"
  | "register"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface EventContext {
  id?: string
  schoolId?: string
  isPublic?: boolean
  organizer?: string | null
}

/**
 * Check if user has permission to perform action on event
 */
export function checkEventPermission(
  auth: AuthContext,
  action: EventAction,
  event?: EventContext
): boolean {
  const { role, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!event?.schoolId) return true
    return schoolId === event.schoolId
  }

  // TEACHER and STAFF can manage events
  if (["TEACHER", "STAFF"].includes(role)) {
    // Can create events
    if (action === "create") return true

    // Can read all events in school
    if (action === "read") {
      if (!event?.schoolId) return false
      return schoolId === event.schoolId
    }

    // Can update/delete only their own events (organizer check)
    if (action === "update" || action === "delete") {
      if (!event?.schoolId) return false
      if (schoolId !== event.schoolId) return false
      // If organizer info available, check ownership
      if (event.organizer) {
        return event.organizer === auth.userId
      }
      return true // Allow if no organizer tracking
    }

    // Can export events
    if (action === "export") {
      if (!event?.schoolId) return false
      return schoolId === event.schoolId
    }

    // Can register for events
    if (action === "register") {
      if (!event?.schoolId) return false
      return schoolId === event.schoolId
    }

    // Cannot bulk action
    if (action === "bulk_action") {
      return false
    }
  }

  // STUDENT can view and register for public events
  if (role === "STUDENT") {
    if (action === "read") {
      if (!event?.schoolId) return false
      // Can view all events in their school
      return schoolId === event.schoolId
    }
    if (action === "register") {
      if (!event?.schoolId) return false
      return schoolId === event.schoolId
    }
    return false
  }

  // GUARDIAN can view public events
  if (role === "GUARDIAN") {
    if (action === "read") {
      if (!event?.schoolId) return false
      // Only public events
      if (event.isPublic === false) return false
      return schoolId === event.schoolId
    }
    return false
  }

  // ACCOUNTANT can read events (for budgeting/financial planning)
  if (role === "ACCOUNTANT") {
    if (action === "read") {
      if (!event?.schoolId) return false
      return schoolId === event.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertEventPermission(
  auth: AuthContext,
  action: EventAction,
  event?: EventContext
): void {
  if (!checkEventPermission(auth, action, event)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot ${action} event${event?.id ? ` ${event.id}` : ""}`
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
 * Check if role can create events
 */
export function canCreateEvent(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"].includes(role)
}

/**
 * Check if role can export events
 */
export function canExportEvents(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"].includes(role)
}

/**
 * Check if role can delete events
 */
export function canDeleteEvent(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"].includes(role)
}

/**
 * Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): EventAction[] {
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
        "register",
      ]
    case "TEACHER":
    case "STAFF":
      return ["create", "read", "update", "delete", "export", "register"]
    case "STUDENT":
      return ["read", "register"]
    case "GUARDIAN":
    case "ACCOUNTANT":
      return ["read"]
    default:
      return []
  }
}
