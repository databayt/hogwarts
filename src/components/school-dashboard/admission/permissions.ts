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

const VIEW_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN", "STAFF"] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []
  const base = `/${lang}/admission`
  const isAdmin = isRoleIn(role, ADMIN_ROLES)

  const tabs: PageNavItem[] = [
    { name: d?.applications || "Applications", href: `${base}/applications` },
    { name: d?.merit || "Merit", href: `${base}/merit` },
    { name: d?.enrollment || "Enrollment", href: `${base}/enrollment` },
  ]
  if (isAdmin) {
    tabs.unshift({
      name: d?.campaigns || "Campaigns",
      href: `${base}/campaigns`,
    })
    tabs.push({ name: d?.settings || "Settings", href: `${base}/settings` })
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
    }
  }
  return NO_UI_PERMISSIONS
}
