"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { upsertSchoolWeekConfig } from "@/components/school-dashboard/timetable/actions"

/**
 * Persist the working-days + lunch config for a term.
 *
 * Why this calls upsertSchoolWeekConfig directly (and not via fetch):
 * - Server-to-server fetch() does not forward the user's session cookie,
 *   so auth() and getTenantContext() resolve empty inside the API handler
 *   and the action throws MISSING_SCHOOL_CONTEXT. The form would silently
 *   fail while the UI showed success (the previous implementation never
 *   awaited the response).
 * - Calling the server action directly preserves auth + tenant context.
 */
export async function saveScheduleConfig(formData: FormData) {
  const termId = formData.get("termId")?.toString() || null
  const workingDaysRaw = formData.getAll("workingDays") || []
  const workingDays = workingDaysRaw
    .map((v) => Number(String(v)))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
  const lunchAfterStr = formData.get("defaultLunchAfterPeriod")?.toString()
  const parsedLunch = lunchAfterStr ? Number(lunchAfterStr) : NaN
  const defaultLunchAfterPeriod = Number.isFinite(parsedLunch)
    ? parsedLunch
    : null

  await upsertSchoolWeekConfig({
    termId,
    workingDays,
    defaultLunchAfterPeriod,
  })

  revalidatePath("/(school-dashboard)/timetable")
}
