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

// ACCOUNTANT is included: server grants them viewApplications + recordPayment;
// they can see applications and enrollment tabs (read-only posture via getUIConfigForRole).
export const ADMISSION_VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
  "ACCOUNTANT",
] as const

const VIEW_ROLES = ADMISSION_VIEW_ROLES

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  if (!isRoleIn(role, VIEW_ROLES)) return []
  const base = `/${lang}/admission`
  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const isAccountant = role === "ACCOUNTANT"

  // ACCOUNTANT: only applications + enrollment (read-only, no leads/merit/settings)
  if (isAccountant) {
    return [
      {
        name: d?.applications || "Applications",
        href: `${base}/applications`,
      },
      { name: d?.enrollment || "Enrollment", href: `${base}/enrollment` },
    ]
  }

  const tabs: PageNavItem[] = [
    { name: d?.applications || "Applications", href: `${base}/applications` },
    { name: d?.merit || "Merit", href: `${base}/merit` },
    { name: d?.enrollment || "Enrollment", href: `${base}/enrollment` },
    // Leads tab: visible to ADMIN, STAFF (and DEVELOPER via isAdmin below)
    { name: d?.leads || "Leads", href: `${base}/leads` },
  ]
  if (isAdmin) {
    // Campaigns is rendered at the admission index (`/admission/page.tsx`),
    // so the tab points at `base`, not `${base}/campaigns` (which 404s).
    tabs.unshift({
      name: d?.campaigns || "Campaigns",
      href: base,
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
  // ACCOUNTANT: read-only — tab visibility (VIEW_ROLES) grants the view;
  // NO_UI_PERMISSIONS (readOnlyMode, all mutating actions off) is the posture.
  if (role === "ACCOUNTANT") {
    return NO_UI_PERMISSIONS
  }
  return NO_UI_PERMISSIONS
}
