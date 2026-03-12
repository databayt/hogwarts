"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { EventWizardData } from "./use-event-wizard"

/** Fetch full event data for the wizard */
export async function getEventForWizard(
  eventId: string
): Promise<
  { success: true; data: EventWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const event = await db.event.findFirst({
      where: { id: eventId, schoolId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        description: true,
        eventType: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        organizer: true,
        targetAudience: true,
        maxAttendees: true,
        isPublic: true,
        registrationRequired: true,
        notes: true,
        status: true,
        wizardStep: true,
      },
    })

    if (!event) return { success: false, error: "Event not found" }

    return { success: true, data: event as EventWizardData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load event",
    }
  }
}

/** Create a draft event record to start the wizard */
export async function createDraftEvent(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const event = await db.event.create({
      data: {
        schoolId,
        title: "",
        eventDate: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: event.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}

/** Mark the event wizard as complete */
export async function completeEventWizard(
  eventId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Validate required fields are present
    const event = await db.event.findFirst({
      where: { id: eventId, schoolId },
      select: { title: true },
    })

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    if (!event.title || event.title.trim().length === 0) {
      return {
        success: false,
        error: "Title is required before completing",
      }
    }

    await db.event.updateMany({
      where: { id: eventId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/events")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete event wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateEventWizardStep(
  eventId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.event.updateMany({
      where: { id: eventId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft event */
export async function deleteDraftEvent(
  eventId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.event.deleteMany({
      where: { id: eventId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft event not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete draft event",
    }
  }
}
