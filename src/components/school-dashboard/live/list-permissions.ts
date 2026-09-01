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

// Roles allowed to create/edit live classes (write access without delete/import).
const WRITE_ROLES: readonly Role[] = ["STAFF", "TEACHER"] as const

/** Shape of the slice of the conference dictionary the tab labels read. */
export interface ConferenceNavDictionary {
  tabs?: {
    sessions?: string
    schedule?: string
    settings?: string
    networkTest?: string
  }
}

/**
 * The tab strip over the conference app surfaces.
 *
 * The landing page (`/live`) is deliberately NOT a tab: it is reached
 * from the sidebar and owns its own hero, exactly as `/lumos` does. What's
 * left is one flat row over the surfaces that manage sessions.
 *
 * Tabs narrow with the role — a student sees only Sessions, so no strip of
 * links they'd be redirected out of.
 */
export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: ConferenceNavDictionary
): PageNavItem[] {
  if (!role) return []

  const t = d?.tabs
  const isAdmin = isRoleIn(role, ADMIN_ROLES)
  const canSchedule = isAdmin || role === "TEACHER"

  return [
    {
      name: t?.sessions ?? "Sessions",
      href: `/${lang}/live/dashboard`,
    },
    ...(canSchedule
      ? [
          {
            name: t?.schedule ?? "Schedule",
            href: `/${lang}/live/schedule`,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            name: t?.settings ?? "Settings",
            href: `/${lang}/live/settings`,
          },
          {
            name: t?.networkTest ?? "Network test",
            href: `/${lang}/live/network-test`,
          },
        ]
      : []),
  ]
}

/**
 * Resolve the UI permission flags for a role.
 *
 * - ADMIN / DEVELOPER → full (create, edit, delete)
 * - STAFF / TEACHER    → create + edit (no delete, no import, no bulk)
 * - everyone else      → read-only
 */
export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, ADMIN_ROLES)) return FULL_UI_PERMISSIONS
  if (isRoleIn(role, WRITE_ROLES)) {
    return {
      ...FULL_UI_PERMISSIONS,
      showDeleteAction: false,
      showImportButton: false,
      showBulkActions: false,
    }
  }
  return {
    ...NO_UI_PERMISSIONS,
    readOnlyMode: true,
  }
}

/**
 * Server-side guard: can this role create/edit live classes?
 * ADMIN, DEVELOPER, STAFF, TEACHER may manage.
 */
export function canManageLiveClasses(role: Role | null | undefined): boolean {
  if (!role) return false
  return isRoleIn(role, ADMIN_ROLES) || isRoleIn(role, WRITE_ROLES)
}

/**
 * Server-side guard: can this role delete live classes?
 * Only ADMIN / DEVELOPER.
 */
export function canDeleteLiveClasses(role: Role | null | undefined): boolean {
  if (!role) return false
  return isRoleIn(role, ADMIN_ROLES)
}
