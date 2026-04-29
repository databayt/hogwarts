// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PageNavItem } from "@/components/atom/page-nav"

import type { Role } from "./types"

/**
 * UI-level permission flags consumed by client components (toolbars, columns).
 * Mirrors role policy from src/lib/rbac/policies/*. Server still enforces
 * via CASL `requireCan`; this exists so the UI does not lie about what the
 * user can do.
 */
export interface UIPermissions {
  showAddButton: boolean
  showImportButton: boolean
  showExportButton: boolean
  showBulkActions: boolean
  showEditAction: boolean
  showDeleteAction: boolean
  showArchiveAction: boolean
  showRestoreAction: boolean
  showToggleStatus: boolean
  readOnlyMode: boolean
}

export const NO_UI_PERMISSIONS: UIPermissions = {
  showAddButton: false,
  showImportButton: false,
  showExportButton: false,
  showBulkActions: false,
  showEditAction: false,
  showDeleteAction: false,
  showArchiveAction: false,
  showRestoreAction: false,
  showToggleStatus: false,
  readOnlyMode: true,
}

export const FULL_UI_PERMISSIONS: UIPermissions = {
  showAddButton: true,
  showImportButton: true,
  showExportButton: true,
  showBulkActions: true,
  showEditAction: true,
  showDeleteAction: true,
  showArchiveAction: true,
  showRestoreAction: true,
  showToggleStatus: true,
  readOnlyMode: false,
}

export const READ_ONLY_UI_PERMISSIONS: UIPermissions = {
  ...NO_UI_PERMISSIONS,
  showExportButton: true,
}

/** AND two permission sets — every flag must be true in both. */
export function intersectPermissions(
  a: UIPermissions,
  b: UIPermissions
): UIPermissions {
  return {
    showAddButton: a.showAddButton && b.showAddButton,
    showImportButton: a.showImportButton && b.showImportButton,
    showExportButton: a.showExportButton && b.showExportButton,
    showBulkActions: a.showBulkActions && b.showBulkActions,
    showEditAction: a.showEditAction && b.showEditAction,
    showDeleteAction: a.showDeleteAction && b.showDeleteAction,
    showArchiveAction: a.showArchiveAction && b.showArchiveAction,
    showRestoreAction: a.showRestoreAction && b.showRestoreAction,
    showToggleStatus: a.showToggleStatus && b.showToggleStatus,
    readOnlyMode: a.readOnlyMode || b.readOnlyMode,
  }
}

/**
 * Common role buckets reused across feature permission modules.
 * Defined here so a single change cascades everywhere.
 */
export const ADMIN_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN"] as const
export const STAFF_WRITE_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
] as const
export const ACADEMIC_WRITE_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
] as const
export const FINANCE_WRITE_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "ACCOUNTANT",
] as const

export function isRoleIn(
  role: Role | null | undefined,
  bucket: readonly Role[]
): role is Role {
  return Boolean(role) && bucket.includes(role as Role)
}

/**
 * Each feature exposes a module conforming to this contract so layouts and
 * tables can wire role-aware UI without re-importing CASL on the client.
 *
 * Reference implementations:
 *  - src/components/school-dashboard/exams/lib/permissions.ts
 *  - src/components/school-dashboard/timetable/permissions-config.ts
 */
export interface FeaturePermissionsModule {
  getTabsForRole(
    role: Role | null | undefined,
    lang: string,
    dictionary?: Record<string, string> | undefined
  ): PageNavItem[]
  getUIConfigForRole(role: Role | null | undefined): UIPermissions
}
