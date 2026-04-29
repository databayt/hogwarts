// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Role } from "@/lib/rbac/types"
import {
  ADMIN_ROLES,
  FULL_UI_PERMISSIONS,
  isRoleIn,
  NO_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import type { PageNavItem } from "@/components/atom/page-nav"

import {
  canConfigureSettings,
  canExportTimetable,
  canManageConflicts,
  canModifyTimetable,
  canViewTimetable,
  hasPermission,
} from "./permissions-config"

/**
 * Standardized tab list for the timetable feature.
 * Mirrors the per-feature `getTabsForRole` convention used across the dashboard.
 */
export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, any>
): PageNavItem[] {
  if (!canViewTimetable(role)) return []

  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const canEdit = canModifyTimetable(role)
  const canExport = canExportTimetable(role)
  const canConfig = canConfigureSettings(role)
  const canConflicts = canManageConflicts(role)
  const canAnalytics = hasPermission(role, "view_analytics")
  const isStudent = role === "STUDENT"
  const isGuardian = role === "GUARDIAN"

  const base = `/${lang}/timetable`
  const tabs: PageNavItem[] = [
    { name: d?.overview || "Overview", href: base, exact: true },
  ]
  if (canEdit) {
    tabs.push({ name: d?.builder || "Builder", href: `${base}/builder` })
    tabs.push({ name: d?.generate || "Generate", href: `${base}/generate` })
  }
  if (isStudent || isGuardian) {
    tabs.push({ name: d?.myTimetable || "My Timetable", href: `${base}/my` })
  }
  if (canConflicts) {
    tabs.push({ name: d?.conflicts || "Conflicts", href: `${base}/conflicts` })
  }
  if (canAnalytics) {
    tabs.push({ name: d?.analytics || "Analytics", href: `${base}/analytics` })
  }
  if (canExport) {
    tabs.push({ name: d?.exports || "Exports", href: `${base}/exports` })
  }
  if (isAdmin || canConfig) {
    tabs.push({ name: d?.settings || "Settings", href: `${base}/settings` })
  }
  return tabs
}

/**
 * UIPermissions shape (Edit/Delete/Archive/etc.) for the timetable feature.
 * The legacy `getUIConfigForRole` in permissions-config.ts uses different
 * field names (showEditButton, showAddButton...) — this is the standardized
 * shape consumed by Toolbar gating and column dropdowns.
 */
export function getRoleUIPermissions(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  const canEdit = canModifyTimetable(role)
  const canExport = canExportTimetable(role)
  if (canEdit) {
    return {
      ...FULL_UI_PERMISSIONS,
      showDeleteAction: false,
    }
  }
  return {
    ...NO_UI_PERMISSIONS,
    showExportButton: canExport,
    readOnlyMode: true,
  }
}
