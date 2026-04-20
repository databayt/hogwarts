// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// USER is the "pre-school" state — a signed-up account that hasn't joined
// or created a school yet. Seen during onboarding and SaaS marketing flows.
// Intentionally minimal: schools can be created (onboarding), and the user
// can read/update their own User record. Everything school-scoped is denied
// — the school-dashboard layout redirects USER to onboarding anyway, but
// the rules enforce this at the action layer too.
export function userRules(
  _ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  // Onboarding can create a School row — after that the user becomes ADMIN
  // and this rule no longer applies.
  can("create", "School")
  // Read/update own profile fields (future: limit to safe fields once the
  // self-edit form is built; for now the action layer enforces).
  can("read", "School")
}
