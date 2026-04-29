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
  "STUDENT",
] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []
  return [{ name: d?.all || "All", href: `/${lang}/subjects` }]
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  if (role === "TEACHER" || role === "STAFF") {
    return {
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
      readOnlyMode: true,
    }
  }
  if (role === "STUDENT") {
    return {
      ...NO_UI_PERMISSIONS,
      readOnlyMode: true,
    }
  }
  return NO_UI_PERMISSIONS
}
