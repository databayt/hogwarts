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
    { name: d?.navAll || "All", href: `/${lang}/announcements` },
  ]
  if (canWrite) {
    tabs.push({
      name: d?.navTemplates || "Templates",
      href: `/${lang}/announcements/templates`,
    })
  }
  if (canWrite) {
    tabs.push({
      name: d?.navArchived || "Archive",
      href: `/${lang}/announcements/archived`,
    })
  }
  if (isAdmin) {
    tabs.push({
      name: d?.navSettings || "Settings",
      href: `/${lang}/announcements/settings`,
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
      showImportButton: false,
      showBulkActions: false,
    }
  }
  return {
    ...NO_UI_PERMISSIONS,
    readOnlyMode: true,
  }
}
