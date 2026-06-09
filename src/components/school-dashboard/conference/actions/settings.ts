"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Conference settings — per-school capacity + retention knobs stored on the
// School row (conferenceRetentionDays / conferenceMaxConcurrent /
// conferenceMaxDuration / conferenceRecordingDefault). ADMIN/DEVELOPER only.
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { liveClassSettingsSchema } from "@/components/school-dashboard/conference/validation"

import { conferenceRevalidatePath, requireContext } from "./helpers"

const SETTINGS_SELECT = {
  conferenceRetentionDays: true,
  conferenceMaxConcurrent: true,
  conferenceMaxDuration: true,
  conferenceRecordingDefault: true,
} as const

export async function getConferenceSettings() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const school = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: SETTINGS_SELECT,
  })
  if (!school) return actionError(ACTION_ERRORS.NOT_FOUND)
  return { success: true as const, data: school }
}

export async function updateConferenceSettings(input: unknown) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response

  const parsed = liveClassSettingsSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  try {
    await db.school.update({
      where: { id: ctx.schoolId },
      data: parsed.data,
    })
  } catch {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }

  revalidatePath(conferenceRevalidatePath("settings"))
  return { success: true as const, data: parsed.data }
}

/** Sections + their per-section recording opt-out flag. ADMIN/DEVELOPER only. */
export async function listSectionRecordingPolicy() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const sections = await db.section.findMany({
    where: { schoolId: ctx.schoolId },
    select: { id: true, name: true, conferenceRecordingOptOut: true },
    orderBy: { name: "asc" },
  })
  return { success: true as const, data: sections }
}

/** Toggle a section's recording opt-out. Tenant-scoped write. */
export async function setSectionRecordingOptOut(
  sectionId: string,
  optOut: boolean
) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  if (!sectionId) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const result = await db.section.updateMany({
    where: { id: sectionId, schoolId: ctx.schoolId },
    data: { conferenceRecordingOptOut: optOut },
  })
  if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)

  revalidatePath(conferenceRevalidatePath("settings"))
  return { success: true as const, data: { sectionId, optOut } }
}
