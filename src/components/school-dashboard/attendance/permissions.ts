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

  const tabs: PageNavItem[] = [
    { name: d?.overview || "Overview", href: basePath, exact: true },
  ]
  if (isStaff) {
    tabs.push({ name: d?.manual || "Manual", href: `${basePath}/manual` })
    tabs.push({
      name: d?.navQrCode || "QR Code",
      href: `${basePath}/qr-code`,
    })
  } else {
    tabs.push({ name: d?.records || "Records", href: `${basePath}/records` })
  }
  tabs.push({ name: d?.excuses || "Excuses", href: `${basePath}/excuses` })
  if (isStaff) {
    tabs.push({
      name: d?.earlyWarning?.title || "Early Warning",
      href: `${basePath}/early-warning`,
    })
    tabs.push({
      name: d?.interventions?.title || "Interventions",
      href: `${basePath}/interventions`,
    })
    tabs.push({
      name: d?.analytics || "Analytics",
      href: `${basePath}/analytics`,
    })
    tabs.push({ name: d?.reports || "Reports", href: `${basePath}/reports` })
  }
  if (isAdmin) {
    tabs.push({ name: d?.settings || "Settings", href: `${basePath}/settings` })
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
