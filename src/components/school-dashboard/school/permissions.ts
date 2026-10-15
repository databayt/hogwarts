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

const VIEW_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN"] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, any>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []
  const n = d?.navigation || d
  const base = `/${lang}/school`

  // Settings first, then people and outreach, then money, safety and
  // insight. "Academic" is a configuration section (configuration/academic),
  // not a tab — the old tab pointed at a /school/academic page that never
  // existed and 404'd.
  const tabs: PageNavItem[] = [
    { name: n?.overview || "Overview", href: base },
    {
      name: n?.configuration || "Configuration",
      href: `${base}/configuration/title`,
      matchPrefix: `${base}/configuration`,
    },
    { name: n?.membership || "Membership", href: `${base}/membership` },
    {
      name: n?.communication || "Communication",
      href: `${base}/communication`,
    },
    { name: n?.billing || "Billing", href: `${base}/billing` },
    { name: n?.security || "Security", href: `${base}/security` },
    { name: n?.reports || "Reports", href: `${base}/reports` },
    { name: n?.analysis || "Analysis", href: `${base}/analysis` },
    { name: n?.bulk || "Bulk", href: `${base}/bulk` },
  ]
  return tabs
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  return NO_UI_PERMISSIONS
}
