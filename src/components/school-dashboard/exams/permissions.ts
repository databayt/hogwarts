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

import { getExamTabsForRole } from "./lib/permissions"

export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, string>
): PageNavItem[] {
  return getExamTabsForRole(role ?? undefined, lang, d) as PageNavItem[]
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
  if (role === "STAFF" || role === "ACCOUNTANT") {
    return {
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
      readOnlyMode: true,
    }
  }
  if (role === "STUDENT" || role === "GUARDIAN") {
    return {
      ...NO_UI_PERMISSIONS,
      readOnlyMode: true,
    }
  }
  return NO_UI_PERMISSIONS
}
