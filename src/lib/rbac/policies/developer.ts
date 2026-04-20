// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// DEVELOPER is the platform operator. Full unconstrained access to every
// school and subject. Tenant impersonation is applied upstream via
// getTenantContext() (priority: impersonate_schoolId cookie > subdomain >
// session), so when a developer is viewing a specific school, ctx.schoolId
// already reflects that school — no change to rules needed.
export function developerRules(
  _ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  can("manage", "all")
}
