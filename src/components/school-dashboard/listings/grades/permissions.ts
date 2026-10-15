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

const VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
] as const

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
