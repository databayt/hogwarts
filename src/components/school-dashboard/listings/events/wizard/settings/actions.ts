"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { settingsSchema, type SettingsFormData } from "./validation"

export async function getEventSettings(
  eventId: string
): Promise<ActionResponse<SettingsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const event = await db.event.findFirst({
      where: { id: eventId, schoolId },
      select: {
        maxAttendees: true,
        isPublic: true,
        registrationRequired: true,
        notes: true,
      },
    })

    if (!event) return { success: false, error: "Event not found" }

    return {
      success: true,
      data: {
        maxAttendees: event.maxAttendees ?? undefined,
        isPublic: event.isPublic,
        registrationRequired: event.registrationRequired,
        notes: event.notes ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateEventSettings(
  eventId: string,
  input: SettingsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = settingsSchema.parse(input)

    await db.event.updateMany({
      where: { id: eventId, schoolId },
      data: {
        maxAttendees: parsed.maxAttendees ?? null,
        isPublic: parsed.isPublic,
        registrationRequired: parsed.registrationRequired,
        notes: parsed.notes ?? null,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
