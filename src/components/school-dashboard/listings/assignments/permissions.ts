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
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
] as const

const WRITE_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN", "TEACHER"] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []
  const tabs: PageNavItem[] = [
    { name: d?.navAll || "All", href: `/${lang}/assignments` },
    {
      name: d?.navUpcoming || "Upcoming",
      href: `/${lang}/assignments/upcoming`,
    },
  ]
  if (isRoleIn(role, WRITE_ROLES) || role === "STUDENT") {
    tabs.push({
      name: d?.navSubmitted || "Submitted",
      href: `/${lang}/assignments/submitted`,
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
      ...FULL_UI_PERMISSIONS,
      showImportButton: false,
    }
  }
  if (isRoleIn(role, VIEW_ROLES)) {
    return {
      ...NO_UI_PERMISSIONS,
      readOnlyMode: true,
    }
  }
  return NO_UI_PERMISSIONS
}
