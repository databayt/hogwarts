"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  transportationSettingsSchema,
  type TransportationSettingsInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

const DEFAULTS = {
  defaultPickupBufferMinutes: 10,
  defaultMonthlyFee: null as number | null,
  notifyGuardiansOnTripStart: true,
  notifyGuardiansOnTripFinish: true,
  notifyGuardiansOnTripCancel: true,
  lateThresholdMinutes: 15,
  enableRouteOptimization: false,
  approachAlertMeters: 500,
}

export async function getSettings() {
  // Read with `manage_settings` permission — this matches the page-level
  // ADMIN/DEVELOPER allowlist. If we add a STAFF read view later we'd add a
  // separate `read_settings` permission.
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const settings = await db.transportationSettings.findUnique({
      where: { schoolId },
    })
    if (settings) {
      return {
        success: true as const,
        data: {
          defaultPickupBufferMinutes: settings.defaultPickupBufferMinutes,
          defaultMonthlyFee: settings.defaultMonthlyFee
            ? Number(settings.defaultMonthlyFee)
            : null,
          notifyGuardiansOnTripStart: settings.notifyGuardiansOnTripStart,
          notifyGuardiansOnTripFinish: settings.notifyGuardiansOnTripFinish,
          notifyGuardiansOnTripCancel: settings.notifyGuardiansOnTripCancel,
          lateThresholdMinutes: settings.lateThresholdMinutes,
          enableRouteOptimization: settings.enableRouteOptimization,
          approachAlertMeters: settings.approachAlertMeters,
        },
      }
    }
    return { success: true as const, data: DEFAULTS }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function updateSettings(input: TransportationSettingsInput) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = transportationSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const settings = await db.transportationSettings.upsert({
      where: { schoolId },
      update: {
        defaultPickupBufferMinutes: data.defaultPickupBufferMinutes,
        defaultMonthlyFee: data.defaultMonthlyFee ?? null,
        notifyGuardiansOnTripStart: data.notifyGuardiansOnTripStart,
        notifyGuardiansOnTripFinish: data.notifyGuardiansOnTripFinish,
        notifyGuardiansOnTripCancel: data.notifyGuardiansOnTripCancel,
        lateThresholdMinutes: data.lateThresholdMinutes,
        enableRouteOptimization: data.enableRouteOptimization,
        approachAlertMeters: data.approachAlertMeters,
      },
      create: {
        schoolId,
        defaultPickupBufferMinutes: data.defaultPickupBufferMinutes,
        defaultMonthlyFee: data.defaultMonthlyFee ?? null,
        notifyGuardiansOnTripStart: data.notifyGuardiansOnTripStart,
        notifyGuardiansOnTripFinish: data.notifyGuardiansOnTripFinish,
        notifyGuardiansOnTripCancel: data.notifyGuardiansOnTripCancel,
        lateThresholdMinutes: data.lateThresholdMinutes,
        enableRouteOptimization: data.enableRouteOptimization,
        approachAlertMeters: data.approachAlertMeters,
      },
    })

    revalidatePath(transportationRevalidatePath("settings"))
    return {
      success: true as const,
      data: {
        defaultPickupBufferMinutes: settings.defaultPickupBufferMinutes,
        defaultMonthlyFee: settings.defaultMonthlyFee
          ? Number(settings.defaultMonthlyFee)
          : null,
        notifyGuardiansOnTripStart: settings.notifyGuardiansOnTripStart,
        notifyGuardiansOnTripFinish: settings.notifyGuardiansOnTripFinish,
        notifyGuardiansOnTripCancel: settings.notifyGuardiansOnTripCancel,
        lateThresholdMinutes: settings.lateThresholdMinutes,
        enableRouteOptimization: settings.enableRouteOptimization,
        approachAlertMeters: settings.approachAlertMeters,
      },
    }
  } catch {
    return actionError(ACTION_ERRORS.TRANSPORTATION_SETTINGS_UPDATE_FAILED)
  }
}
