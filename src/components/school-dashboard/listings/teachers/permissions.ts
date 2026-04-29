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

const VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
  "TEACHER",
  "ACCOUNTANT",
] as const

const MANAGE_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN", "STAFF"] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []

  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const canManage = isRoleIn(role, MANAGE_ROLES)

  const tabs: PageNavItem[] = [
    { name: d?.all || "All", href: `/${lang}/teachers` },
  ]
  if (canManage) {
    tabs.push({
      name: d?.departments || "Departments",
      href: `/${lang}/teachers/departments`,
    })
  }
  tabs.push({
    name: d?.schedule || "Schedule",
    href: `/${lang}/teachers/schedule`,
  })
  if (canManage) {
    tabs.push({
      name: d?.performance || "Performance",
      href: `/${lang}/teachers/performance`,
    })
  }
  if (isAdmin) {
    tabs.push({
      name: d?.settings || "Settings",
      href: `/${lang}/teachers/settings`,
    })
  }
  return tabs
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  if (role === "STAFF") {
    return {
      ...FULL_UI_PERMISSIONS,
      showDeleteAction: false,
      showArchiveAction: false,
      showRestoreAction: false,
    }
  }
  if (role === "TEACHER" || role === "ACCOUNTANT") {
    return {
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
      readOnlyMode: true,
    }
  }
  return NO_UI_PERMISSIONS
}
