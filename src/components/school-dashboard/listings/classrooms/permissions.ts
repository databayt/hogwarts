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
] as const

const MANAGE_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN", "STAFF"] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []
  const base = `/${lang}/classrooms`
  const canManage = isRoleIn(role, MANAGE_ROLES)

  const tabs: PageNavItem[] = [
    { name: d?.rooms || "Rooms", href: base, exact: true },
  ]
  if (canManage) {
    tabs.push({ name: d?.configure || "Configure", href: `${base}/configure` })
    tabs.push({ name: d?.capacity || "Capacity", href: `${base}/capacity` })
  }
  tabs.push({ name: d?.subjects || "Subjects", href: `${base}/subjects` })
  tabs.push({ name: d?.schedule || "Schedule", href: `${base}/schedule` })
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
  if (role === "TEACHER") {
    return {
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
      readOnlyMode: true,
    }
  }
  return NO_UI_PERMISSIONS
}
