"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getEventInformation(
  eventId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const event = await db.event.findFirst({
      where: { id: eventId, schoolId },
      select: {
        title: true,
        description: true,
        eventType: true,
        organizer: true,
        targetAudience: true,
      },
    })

    if (!event) return { success: false, error: "Event not found" }

    return {
      success: true,
      data: {
        title: event.title,
        description: event.description ?? undefined,
        eventType: event.eventType as InformationFormData["eventType"],
        organizer: event.organizer ?? undefined,
        targetAudience: event.targetAudience ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateEventInformation(
  eventId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = informationSchema.parse(input)

    await db.event.updateMany({
      where: { id: eventId, schoolId },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        eventType: parsed.eventType ?? "OTHER",
        organizer: parsed.organizer ?? null,
        targetAudience: parsed.targetAudience ?? null,
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
