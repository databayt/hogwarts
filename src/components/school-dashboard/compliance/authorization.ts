// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

export type ComplianceAction =
  | "manage_config" // toggle, mode change, SLA change
  | "manage_credentials" // create/rotate/revoke school-scoped credentials
  | "view_submissions" // read submission history
  | "retry_submission" // queue a new attempt
  | "download_artifact" // download the daily CSV
  | "manage_shared_groups" // DEVELOPER-only: cross-tenant credential groups

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

const PERMISSION_MATRIX: Record<ComplianceAction, UserRole[]> = {
  manage_config: ["DEVELOPER", "ADMIN"],
  manage_credentials: ["DEVELOPER", "ADMIN"],
  view_submissions: ["DEVELOPER", "ADMIN", "STAFF"],
  retry_submission: ["DEVELOPER", "ADMIN"],
  download_artifact: ["DEVELOPER", "ADMIN", "STAFF"],
  manage_shared_groups: ["DEVELOPER"],
}

export function checkCompliancePermission(
  auth: AuthContext,
  action: ComplianceAction
): boolean {
  return PERMISSION_MATRIX[action].includes(auth.role)
}
