// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"

/**
 * Shared entry guard for every /lumos managed route.
 *
 * Mirrors the role policy the old single settings page enforced: ADMIN and
 * DEVELOPER reach every surface, TEACHER reaches Videos only, everyone else
 * is bounced to the course catalog. `teacherAllowed` is false for the
 * admin-only surfaces (enrollments / instructors / review).
 */
export async function requireSettingsAccess(
  lang: Locale,
  { teacherAllowed = false }: { teacherAllowed?: boolean } = {}
) {
  const [{ schoolId }, session] = await Promise.all([
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) redirect(`/${lang}/auth/login`)

  const role = session.user.role || ""
  const isAdmin = ["ADMIN", "DEVELOPER"].includes(role)
  const isTeacher = role === "TEACHER"

  if (!isAdmin && !(teacherAllowed && isTeacher)) {
    redirect(`/${lang}/lumos/courses`)
  }

  return { schoolId, session, role, isAdmin, isTeacher }
}
