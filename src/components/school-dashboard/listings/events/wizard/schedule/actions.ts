"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { prewarm } from "@/components/translation/prewarm"

import { scheduleSchema, type ScheduleFormData } from "./validation"

export async function getEventSchedule(
  eventId: string
): Promise<ActionResponse<ScheduleFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const event = await db.event.findFirst({
      where: { id: eventId, schoolId },
      select: {
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
      },
    })

    if (!event) return actionError(ACTION_ERRORS.EVENT_NOT_FOUND)

    return {
      success: true,
      data: {
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateEventSchedule(
  eventId: string,
  input: ScheduleFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = scheduleSchema.parse(input)

    await db.event.updateMany({
      where: { id: eventId, schoolId },
      data: {
        eventDate: parsed.eventDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        location: parsed.location ?? null,
      },
    })

    if (parsed.location) {
      after(() =>
        prewarm(
          "Event",
          { id: eventId, location: parsed.location! },
          { schoolId }
        )
      )
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
