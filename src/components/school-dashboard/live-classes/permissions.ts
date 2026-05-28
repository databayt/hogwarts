// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// FeaturePermissionsModule implementation for the live-classes block.
// See src/lib/rbac/ui-permissions.ts for the contract.

import type { UserRole } from "@prisma/client"

import {
  FULL_UI_PERMISSIONS,
  NO_UI_PERMISSIONS,
  READ_ONLY_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import {
  ADMIN_ROLES,
  HOST_ROLES,
} from "@/components/school-dashboard/live-classes/authorization"

export type LiveClassTab = {
  name: string
  href: string
  exact?: boolean
}

export function getTabsForRole(
  role: UserRole,
  lang: string,
  dictionary?: { liveClasses?: { nav?: Record<string, string> } } | null
): LiveClassTab[] {
  const t = dictionary?.liveClasses?.nav ?? {}
  const tabs: LiveClassTab[] = [
    {
      name: t.upcoming ?? "Upcoming",
      href: `/${lang}/live-classes`,
      exact: true,
    },
    { name: t.live ?? "Live now", href: `/${lang}/live-classes?status=live` },
    { name: t.past ?? "Past", href: `/${lang}/live-classes?status=ended` },
  ]
  if (HOST_ROLES.includes(role)) {
    tabs.push({
      name: t.schedule ?? "Schedule",
      href: `/${lang}/live-classes/schedule`,
    })
  }
  if (ADMIN_ROLES.includes(role)) {
    tabs.push({
      name: t.networkTest ?? "Network test",
      href: `/${lang}/live-classes/network-test`,
    })
  }
  return tabs
}

export function getUIConfigForRole(role: UserRole): UIPermissions {
  if (role === "DEVELOPER" || role === "ADMIN") return FULL_UI_PERMISSIONS
  if (role === "TEACHER") {
    return {
      ...FULL_UI_PERMISSIONS,
      showAddButton: true,
      showEditAction: true,
      showDeleteAction: false,
    }
  }
  if (role === "STUDENT" || role === "GUARDIAN") {
    return READ_ONLY_UI_PERMISSIONS
  }
  if (role === "STAFF" || role === "ACCOUNTANT") {
    return READ_ONLY_UI_PERMISSIONS
  }
  return NO_UI_PERMISSIONS
}
