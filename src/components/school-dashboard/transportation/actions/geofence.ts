"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Geofence-driven boarding (M2-3) — user-facing wrapper.
//
// Permission-gated wrapper around `recordBoardingFromGeofenceInternal`.
// External webhooks (service accounts) bypass this and call the internal
// helper directly via /api/transportation/geofence-boarding.
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"

import { recordBoardingFromGeofenceInternal } from "./geofence-internal"
import { requireContext, transportationRevalidatePath } from "./helpers"

const geofenceBoardingSchema = z.object({
  studentId: z.string().min(1),
  geofenceId: z.string().min(1),
  eventType: z.enum(["ENTER", "EXIT"]),
  timestamp: z.string().datetime().optional(),
})

export type GeofenceBoardingInput = z.infer<typeof geofenceBoardingSchema>

export async function recordBoardingFromGeofence(input: GeofenceBoardingInput) {
  const ctx = await requireContext("record_boarding")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx

  const parsed = geofenceBoardingSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }

  const result = await recordBoardingFromGeofenceInternal({
    schoolId,
    recordedBy: userId,
    ...parsed.data,
  })

  if ("success" in result && result.success && result.tripId) {
    revalidatePath(transportationRevalidatePath(`trips/${result.tripId}`))
  }

  return result
}
