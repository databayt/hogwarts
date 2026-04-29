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
  "GUARDIAN",
] as const

const WRITE_ROLES: readonly Role[] = ["DEVELOPER", "ADMIN", "TEACHER"] as const

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []

  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const canWrite = isRoleIn(role, WRITE_ROLES)

  const tabs: PageNavItem[] = [
    { name: d?.navAll || "All", href: `/${lang}/grades` },
  ]
  if (canWrite) {
    tabs.push({
      name: d?.navGenerate || "Generate",
      href: `/${lang}/grades/generate`,
    })
  }
  tabs.push({
    name: d?.navReports || "Reports",
    href: `/${lang}/grades/reports`,
  })
  if (isAdmin) {
    tabs.push({
      name: d?.navPromotion || "Promotion",
      href: `/${lang}/grades/promotion`,
    })
  }
  tabs.push({
    name: d?.navTranscripts || "Transcripts",
    href: `/${lang}/grades/transcripts`,
  })
  if (canWrite || isAdmin) {
    tabs.push({
      name: d?.navAnalytics || "Analytics",
      href: `/${lang}/grades/analytics`,
    })
  }
  if (isAdmin) {
    tabs.push({
      name: d?.navSettings || "Settings",
      href: `/${lang}/grades/settings`,
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
      showExportButton: role === "STAFF",
      readOnlyMode: true,
    }
  }
  return NO_UI_PERMISSIONS
}
