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

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, any>,
  unreadCount = 0
): PageNavItem[] {
  if (!role || role === "USER") return []
  const basePath = `/${lang}/notifications`

  return [
    { name: d?.tabs?.all || "All", href: basePath, exact: true },
    {
      name: d?.tabs?.unread || "Unread",
      href: `${basePath}/unread`,
      badge: unreadCount,
    },
    {
      name: d?.actions?.settings || "Settings",
      href: `${basePath}/preferences`,
    },
  ]
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  return {
    ...NO_UI_PERMISSIONS,
    showEditAction: true,
    showDeleteAction: true,
    showToggleStatus: true,
  }
}
