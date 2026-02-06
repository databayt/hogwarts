"use server"

import { db } from "@/lib/db"

/**
 * Shared auth helpers for onboarding steps.
 *
 * Eliminates duplicated lazy-import boilerplate from every step's actions.ts.
 */

export async function getAuthContext() {
  const { getAuthContext } = await import("@/lib/auth-security")
  return getAuthContext()
}

export async function requireSchoolOwnership(schoolId: string) {
  const { requireSchoolOwnership } = await import("@/lib/auth-security")
  return requireSchoolOwnership(schoolId)
}

export async function getSchoolOrThrow(schoolId: string) {
  await requireSchoolOwnership(schoolId)
  const school = await db.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new Error("School not found")
  return school
}
