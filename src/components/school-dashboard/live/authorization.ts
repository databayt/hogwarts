// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

// ============================================================================
// Types
// ============================================================================

export type LiveClassAction =
  | "manage_live_class" // create / cancel / delete for any class
  | "start_live_class" // start own scheduled class
  | "end_live_class" // end own running class
  | "join_as_host" // teacher joining own room
  | "join_as_participant" // student joining enrolled class
  | "join_as_observer" // guardian joining child's class
  | "view_recordings" // list / play recordings
  | "delete_recording" // permanent delete (admin)
  | "manage_settings" // edit retention, max duration, etc.
  | "read_school_dashboard" // overview list visibility

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

// ============================================================================
// Role groups
// ============================================================================

export const ADMIN_ROLES: UserRole[] = ["DEVELOPER", "ADMIN"]
export const HOST_ROLES: UserRole[] = ["DEVELOPER", "ADMIN", "TEACHER"]

// ============================================================================
// Permission matrix
// ============================================================================

const PERMISSION_MATRIX: Record<LiveClassAction, UserRole[]> = {
  manage_live_class: ["DEVELOPER", "ADMIN"],
  start_live_class: ["DEVELOPER", "ADMIN", "TEACHER"],
  end_live_class: ["DEVELOPER", "ADMIN", "TEACHER"],
  join_as_host: ["DEVELOPER", "ADMIN", "TEACHER"],
  join_as_participant: ["DEVELOPER", "STUDENT"],
  join_as_observer: ["DEVELOPER", "GUARDIAN"],
  view_recordings: [
    "DEVELOPER",
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "STAFF",
  ],
  delete_recording: ["DEVELOPER", "ADMIN"],
  manage_settings: ["DEVELOPER", "ADMIN"],
  read_school_dashboard: [
    "DEVELOPER",
    "ADMIN",
    "TEACHER",
    "STAFF",
    "ACCOUNTANT",
  ],
}

// ============================================================================
// Core permission checks
// ============================================================================

export function checkLiveClassPermission(
  auth: AuthContext,
  action: LiveClassAction
): boolean {
  if (!auth.role) return false
  if (auth.role === "DEVELOPER") return true
  if (!auth.schoolId) return false
  return PERMISSION_MATRIX[action]?.includes(auth.role) ?? false
}

export function assertLiveClassPermission(
  auth: AuthContext,
  action: LiveClassAction
): void {
  if (!checkLiveClassPermission(auth, action)) {
    throw new Error(`Forbidden: cannot perform "${action}"`)
  }
}

// ============================================================================
// Convenience helpers
// ============================================================================

export const canManageLiveClasses = (role: UserRole): boolean =>
  ADMIN_ROLES.includes(role)

export const canHostLiveClass = (role: UserRole): boolean =>
  HOST_ROLES.includes(role)

export const canJoinAsStudent = (role: UserRole): boolean =>
  role === "STUDENT" || role === "DEVELOPER"

export const canJoinAsGuardian = (role: UserRole): boolean =>
  role === "GUARDIAN" || role === "DEVELOPER"
