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

const STAFF_VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
  "TEACHER",
  "ACCOUNTANT",
] as const

const STAFF_WRITE_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
  "TEACHER",
] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, STAFF_VIEW_ROLES)) return []

  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const canWrite = isRoleIn(role, STAFF_WRITE_ROLES)

  const tabs: PageNavItem[] = [
    { name: d?.all || "All", href: `/${lang}/students` },
  ]
  if (canWrite) {
    tabs.push({ name: d?.enroll || "Enroll", href: `/${lang}/students/enroll` })
  }
  tabs.push({
    name: d?.performance || "Performance",
    href: `/${lang}/students/performance`,
  })
  tabs.push({
    name: d?.reports || "Reports",
    href: `/${lang}/students/reports`,
  })
  if (isAdmin) {
    tabs.push({
      name: d?.archive || "Archive",
      href: `/${lang}/students/archived`,
    })
    tabs.push({
      name: d?.settings || "Settings",
      href: `/${lang}/students/settings`,
    })
  }
  return tabs
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS

  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS

  if (role === "TEACHER") {
    return {
      ...NO_UI_PERMISSIONS,
      showAddButton: true,
      showExportButton: true,
      showEditAction: true,
      readOnlyMode: false,
    }
  }

  if (role === "STAFF" || role === "ACCOUNTANT") {
    return {
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
      readOnlyMode: true,
    }
  }

  return NO_UI_PERMISSIONS
}
