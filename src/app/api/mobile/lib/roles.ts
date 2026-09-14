// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

import type { MobileAuthContext } from "./authenticate"

/**
 * True when the caller holds one of the given roles.
 *
 * Typed off Prisma's `UserRole`, so a role that does not exist (the old
 * "SUPER_ADMIN") fails the type-check instead of silently never matching.
 * DEVELOPER is the platform role.
 *
 * Lives outside `authenticate.ts` on purpose: route tests mock that module
 * wholesale, and a helper exported from it would be `undefined` there.
 */
export function hasRole(
  auth: Pick<MobileAuthContext, "role">,
  ...roles: UserRole[]
): boolean {
  return (roles as string[]).includes(auth.role)
}

/** School staff who may manage records inside their tenant. */
export const STAFF_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
]
