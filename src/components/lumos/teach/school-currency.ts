// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * The currency a paid video is priced in — the school's own (`School.currency`,
 * set during onboarding), never a hardcoded USD.
 *
 * Shared by every surface that opens the propose dialog: the teacher dashboard
 * and the settings Videos tab both render it, and a school that prices in SDG
 * should not see one of them offer USD because only the other was wired.
 *
 * DEVELOPER has no school, so the platform lane falls back to USD.
 */
export async function getSchoolCurrency(): Promise<string> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return "USD"
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { currency: true },
  })
  return school?.currency?.trim().toUpperCase() || "USD"
}
