// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"

const DEFAULT_ROLES: readonly string[] = ["ADMIN", "DEVELOPER"]

/**
 * Session + tenant + role gate for the school-admin area's server actions.
 *
 * getTenantContext() alone proves nothing about the caller — it is derived
 * from the request's subdomain header before the session is read, so an
 * action gated only on schoolId is reachable by anonymous POST. And tenant
 * membership alone is not authorization either: students and guardians share
 * the schoolId. Throws "Unauthorized" unless the caller is signed in, belongs
 * to the tenant (DEVELOPER is platform-wide and exempt from the membership
 * check), and holds one of the allowed roles.
 */
export async function requireSchoolRole(
  roles: readonly string[] = DEFAULT_ROLES
): Promise<{ userId: string; schoolId: string; role: string }> {
  const [session, { schoolId }] = await Promise.all([
    auth(),
    getTenantContext(),
  ])
  const user = session?.user

  if (!user?.id || !schoolId) throw new Error("Unauthorized")

  const role = user.role ?? ""
  if (role !== "DEVELOPER" && user.schoolId !== schoolId)
    throw new Error("Unauthorized")
  if (!roles.includes(role)) throw new Error("Unauthorized")

  return { userId: user.id, schoolId, role }
}
