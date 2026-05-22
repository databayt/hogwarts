// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

// ============================================================================
// Types
// ============================================================================

export type TransportationAction =
  | "manage_vehicle"
  | "manage_route"
  | "manage_stop"
  | "manage_driver"
  | "manage_assignment"
  | "manage_settings"
  | "manage_trip"
  | "record_boarding"
  | "read_school"
  | "read_own"
  | "view_fees"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

// ============================================================================
// Role groups
// ============================================================================

export const ADMIN_ROLES: UserRole[] = ["DEVELOPER", "ADMIN"]
export const STAFF_ROLES: UserRole[] = ["DEVELOPER", "ADMIN", "STAFF"]
export const READ_SCHOOL_ROLES: UserRole[] = ["DEVELOPER", "ADMIN", "STAFF"]

// ============================================================================
// Permission matrix
// ============================================================================

const PERMISSION_MATRIX: Record<TransportationAction, UserRole[]> = {
  manage_vehicle: ["DEVELOPER", "ADMIN"],
  manage_route: ["DEVELOPER", "ADMIN"],
  manage_stop: ["DEVELOPER", "ADMIN"],
  manage_driver: ["DEVELOPER", "ADMIN"],
  manage_assignment: ["DEVELOPER", "ADMIN", "STAFF"],
  manage_settings: ["DEVELOPER", "ADMIN"],
  manage_trip: ["DEVELOPER", "ADMIN", "STAFF"],
  record_boarding: ["DEVELOPER", "ADMIN", "STAFF", "TEACHER"],
  read_school: ["DEVELOPER", "ADMIN", "STAFF"],
  read_own: ["DEVELOPER", "ADMIN", "STAFF", "TEACHER", "STUDENT", "GUARDIAN"],
  view_fees: ["DEVELOPER", "ADMIN", "ACCOUNTANT"],
}

// ============================================================================
// Core permission checks
// ============================================================================

export function checkTransportationPermission(
  auth: AuthContext,
  action: TransportationAction
): boolean {
  if (!auth.role) return false

  // DEVELOPER has full access
  if (auth.role === "DEVELOPER") return true

  // Must have school context for non-DEVELOPER roles
  if (!auth.schoolId) return false

  return PERMISSION_MATRIX[action]?.includes(auth.role) ?? false
}

export function assertTransportationPermission(
  auth: AuthContext,
  action: TransportationAction
): void {
  if (!checkTransportationPermission(auth, action)) {
    throw new Error(`Forbidden: cannot perform "${action}"`)
  }
}

// ============================================================================
// Convenience helpers (mirror attendance pattern)
// ============================================================================

export const canManageVehicles = (role: UserRole): boolean =>
  ADMIN_ROLES.includes(role)

export const canManageRoutes = (role: UserRole): boolean =>
  ADMIN_ROLES.includes(role)

export const canManageDrivers = (role: UserRole): boolean =>
  ADMIN_ROLES.includes(role)

export const canManageAssignments = (role: UserRole): boolean =>
  STAFF_ROLES.includes(role)

export const canReadAllAssignments = (role: UserRole): boolean =>
  READ_SCHOOL_ROLES.includes(role)

export const canViewFees = (role: UserRole): boolean =>
  ["DEVELOPER", "ADMIN", "ACCOUNTANT"].includes(role)

export const canManageTrips = (role: UserRole): boolean =>
  STAFF_ROLES.includes(role)

export const canRecordBoarding = (role: UserRole): boolean =>
  ["DEVELOPER", "ADMIN", "STAFF", "TEACHER"].includes(role)
