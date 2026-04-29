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

const WRITE_ROLES: readonly Role[] = [
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
  if (!role) return []

  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const canWrite = isRoleIn(role, WRITE_ROLES)

  const tabs: PageNavItem[] = [
    { name: d?.all || "All", href: `/${lang}/events` },
    { name: d?.calendar || "Calendar", href: `/${lang}/events/calendar` },
  ]
  if (canWrite) {
    tabs.push({
      name: d?.recurring || "Recurring",
      href: `/${lang}/events/recurring`,
    })
  }
  if (isAdmin) {
    tabs.push({
      name: d?.settings || "Settings",
      href: `/${lang}/events/settings`,
    })
  }
  return tabs
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  if (isRoleIn(role, WRITE_ROLES)) {
    return {
      ...FULL_UI_PERMISSIONS,
      showBulkActions: false,
      showImportButton: false,
    }
  }
  return {
    ...NO_UI_PERMISSIONS,
    readOnlyMode: true,
  }
}
