"use server"

/**
 * Authorization Helpers - Role-Based Access Control
 *
 * Provides helper functions for checking user permissions in server actions.
 *
 * KEY PATTERN:
 * These helpers THROW errors instead of returning null/false.
 * This is intentional - server actions should fail loudly when permissions are denied.
 * Callers should wrap in try-catch and return appropriate error responses.
 *
 * GOTCHA: Must stay in sync with src/routes.ts roleRoutes matrix.
 * If routes.ts changes allowed roles, these helpers need updating too.
 *
 * USAGE:
 * ```typescript
 * "use server"
 * export async function adminAction() {
 *   try {
 *     const { schoolId } = await requireAdminRole()
 *     // ... admin-only logic
 *   } catch (error) {
 *     if (error instanceof AuthorizationError) {
 *       return { success: false, message: "Insufficient permissions" }
 *     }
 *     throw error
 *   }
 * }
 * ```
 */

import { getTenantContext } from "@/lib/tenant-context"
import { type Role } from "@/routes"

/**
 * Authorization error for insufficient permissions
 * Thrown (not returned) to fail server actions loudly
 */
export class AuthorizationError extends Error {
  constructor(
    message: string = "Insufficient permissions",
    public requiredRoles?: Role[],
    public currentRole?: Role
  ) {
    super(message)
    this.name = "AuthorizationError"
  }
}

/**
 * School not found error
 */
export class SchoolNotFoundError extends Error {
  constructor(message: string = "School not found") {
    super(message)
    this.name = "SchoolNotFoundError"
  }
}

/**
 * Result type for authorization checks
 */
export type AuthContext = {
  schoolId: string
  role: Role
}

/**
 * Require admin or developer role for an action.
 * Returns the auth context with schoolId and role.
 *
 * @throws SchoolNotFoundError if no school context
 * @throws AuthorizationError if user lacks ADMIN or DEVELOPER role
 *
 * @example
 * ```ts
 * export async function createItem(formData: FormData) {
 *   try {
 *     const { schoolId } = await requireAdminRole()
 *     // ... action logic
 *   } catch (error) {
 *     if (error instanceof SchoolNotFoundError) {
 *       return { success: false, message: "School not found" }
 *     }
 *     if (error instanceof AuthorizationError) {
 *       return { success: false, message: "Insufficient permissions" }
 *     }
 *     throw error
 *   }
 * }
 * ```
 */
export async function requireAdminRole(): Promise<AuthContext> {
  const { schoolId, role } = await getTenantContext()

  if (!schoolId) {
    throw new SchoolNotFoundError()
  }

  if (role !== "DEVELOPER" && role !== "ADMIN") {
    throw new AuthorizationError()
  }

  return { schoolId, role }
}

/**
 * Require specific roles for an action.
 *
 * @param allowedRoles - Array of roles that are allowed
 * @throws SchoolNotFoundError if no school context
 * @throws AuthorizationError if user's role is not in allowedRoles
 */
export async function requireRoles(allowedRoles: Role[]): Promise<AuthContext> {
  const { schoolId, role } = await getTenantContext()

  if (!schoolId) {
    throw new SchoolNotFoundError()
  }

  const userRole = role as Role
  if (!role || !allowedRoles.includes(userRole)) {
    throw new AuthorizationError(
      `Requires one of: ${allowedRoles.join(", ")}`,
      allowedRoles,
      userRole
    )
  }

  return { schoolId, role: userRole }
}

/**
 * Require a single specific role for an action.
 * Convenience wrapper around requireRoles for single role checks.
 *
 * @param allowedRole - The role that is allowed
 * @throws SchoolNotFoundError if no school context
 * @throws AuthorizationError if user's role doesn't match
 */
export async function requireRole(allowedRole: Role): Promise<AuthContext> {
  return requireRoles([allowedRole])
}

/**
 * Alias for requireRoles - more descriptive name.
 * Use when any of the provided roles is sufficient.
 */
export const requireAnyRole = requireRoles

/**
 * Check if user has admin or developer role without throwing.
 * Returns null if not authorized or no school context.
 */
export async function checkAdminRole(): Promise<AuthContext | null> {
  try {
    return await requireAdminRole()
  } catch {
    return null
  }
}

/**
 * Handle common auth errors and return an ActionResult-compatible response.
 * Use this in catch blocks for server actions.
 *
 * @example
 * ```ts
 * catch (error) {
 *   const authError = handleAuthError(error)
 *   if (authError) return authError
 *   // Handle other errors...
 * }
 * ```
 */
export function handleAuthError(error: unknown): { success: false; message: string } | null {
  if (error instanceof SchoolNotFoundError) {
    return { success: false, message: "School not found" }
  }
  if (error instanceof AuthorizationError) {
    return { success: false, message: error.message || "Insufficient permissions" }
  }
  return null
}

// ============================================================================
// Common Role Group Helpers (aligned with routes.ts roleRoutes matrix)
// ============================================================================

/**
 * Require finance access (all authenticated users).
 * Role-specific views/actions are handled at UI/action level.
 * Use for finance, fees, billing, invoice, banking, salary routes.
 */
export async function requireFinanceRole(): Promise<AuthContext> {
  return requireRoles(["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"])
}

/**
 * Require academic management access (admin, teacher, or developer role).
 * Use for subjects, classes, lessons, exams, grades, assignments routes.
 */
export async function requireTeacherRole(): Promise<AuthContext> {
  return requireRoles(["ADMIN", "TEACHER", "DEVELOPER"])
}

/**
 * Require staff access (admin, teacher, staff, or developer role).
 * Use for student, parent, attendance management routes.
 */
export async function requireStaffRole(): Promise<AuthContext> {
  return requireRoles(["ADMIN", "TEACHER", "STAFF", "DEVELOPER"])
}

/**
 * Check if user has one of the allowed roles without throwing.
 * Returns null if not authorized or no school context.
 */
export async function checkRoles(allowedRoles: Role[]): Promise<AuthContext | null> {
  try {
    return await requireRoles(allowedRoles)
  } catch {
    return null
  }
}

// Re-export Role type for convenience
export type { Role } from "@/routes"
