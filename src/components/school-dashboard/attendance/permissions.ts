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

const STAFF_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
] as const

const VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
  "STUDENT",
  "GUARDIAN",
] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, any>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []

  const isStaff = isRoleIn(role, STAFF_ROLES)
  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const basePath = `/${lang}/attendance`

  // Five jobs, one tab each. Every page the module ever grew still has a
  // route; merged pages light up the tab they now live under.
  const at = (p: string) => `${basePath}/${p}`
  const t = d?.hub as Record<string, string> | undefined

  if (!isStaff) {
    return [
      { name: t?.today || d?.overview || "Today", href: basePath, exact: true },
      { name: d?.records || "Records", href: at("records") },
      { name: d?.excuses || "Excuses", href: at("excuses") },
    ]
  }

  const tabs: PageNavItem[] = [
    {
      name: t?.today || d?.overview || "Today",
      href: basePath,
      exact: true,
    },
    {
      name: t?.take || "Take attendance",
      href: at("manual"),
      matchPrefixes: [
        at("qr-code"),
        at("barcode"),
        at("kiosk"),
        at("bulk-upload"),
        at("bulk"),
        at("geo"),
        at("hall-pass"),
      ],
    },
    {
      name: d?.excuses || "Excuses",
      href: at("excuses"),
      matchPrefixes: [at("intentions")],
    },
    {
      name: t?.atRisk || "Students at risk",
      href: at("early-warning"),
      matchPrefixes: [
        at("interventions"),
        at("ai"),
        at("letters"),
        at("gamification"),
      ],
    },
    {
      name: d?.reports || "Reports",
      href: at("reports"),
      matchPrefixes: [at("analytics"), at("analysis"), at("recent")],
    },
  ]
  if (isAdmin) {
    tabs.push({ name: d?.settings || "Settings", href: at("settings") })
  }
  return tabs
}

export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  if (isRoleIn(role, STAFF_ROLES)) {
    return {
      ...FULL_UI_PERMISSIONS,
      showDeleteAction: false,
    }
  }
  return {
    ...NO_UI_PERMISSIONS,
    readOnlyMode: true,
  }
}
