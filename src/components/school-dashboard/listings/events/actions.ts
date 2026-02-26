"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { type Prisma } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { getDisplayFields } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertEventPermission,
  getAuthContext,
} from "@/components/school-dashboard/listings/events/authorization"
import {
  eventCreateSchema,
  eventUpdateSchema,
  getEventsSchema,
} from "@/components/school-dashboard/listings/events/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type EventSelectResult = {
  id: string
  schoolId: string
  title: string
  description: string | null
  lang: string
  eventType: string
  eventDate: Date
  startTime: string
  endTime: string
  location: string | null
  organizer: string | null
  targetAudience: string | null
  maxAttendees: number | null
  currentAttendees: number
  isPublic: boolean
  registrationRequired: boolean
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

type EventListResult = {
  id: string
  title: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  organizer: string
  targetAudience: string
  maxAttendees: number | null
  currentAttendees: number
  status: string
  isPublic: boolean
  createdAt: string
}

const EVENTS_PATH = "/events"

// ============================================================================
// Mutations
// ============================================================================

export async function createEvent(
  input: z.infer<typeof eventCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "create", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const parsed = eventCreateSchema.parse(input)

    const row = await db.event.create({
      data: {
        schoolId,
        title: parsed.title,
        description: parsed.description || null,
        lang: (parsed as any).lang || "ar",
        eventType: parsed.eventType,
        eventDate: parsed.eventDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        location: parsed.location || null,
        organizer: parsed.organizer || null,
        targetAudience: parsed.targetAudience || null,
        maxAttendees: parsed.maxAttendees || null,
        currentAttendees: 0,
        isPublic: parsed.isPublic,
        registrationRequired: parsed.registrationRequired,
        notes: parsed.notes || null,
        status: "PLANNED",
      },
    })

    revalidatePath(EVENTS_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createEvent] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}

export async function updateEvent(
  input: z.infer<typeof eventUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "update", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const parsed = eventUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify event exists
    const existing = await db.event.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Event not found" }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.title !== "undefined") data.title = rest.title
    if (typeof rest.description !== "undefined")
      data.description = rest.description || null
    if (typeof (rest as any).lang !== "undefined")
      data.lang = (rest as any).lang
    if (typeof rest.eventType !== "undefined") data.eventType = rest.eventType
    if (typeof rest.eventDate !== "undefined") data.eventDate = rest.eventDate
    if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime
    if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime
    if (typeof rest.location !== "undefined")
      data.location = rest.location || null
    if (typeof rest.organizer !== "undefined")
      data.organizer = rest.organizer || null
    if (typeof rest.targetAudience !== "undefined")
      data.targetAudience = rest.targetAudience || null
    if (typeof rest.maxAttendees !== "undefined")
      data.maxAttendees = rest.maxAttendees || null
    if (typeof rest.isPublic !== "undefined") data.isPublic = rest.isPublic
    if (typeof rest.registrationRequired !== "undefined")
      data.registrationRequired = rest.registrationRequired
    if (typeof rest.notes !== "undefined") data.notes = rest.notes || null

    await db.event.updateMany({ where: { id, schoolId }, data })

    revalidatePath(EVENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateEvent] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event",
    }
  }
}

export async function deleteEvent(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "delete", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify event exists
    const existing = await db.event.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Event not found" }
    }

    await db.event.deleteMany({ where: { id, schoolId } })

    revalidatePath(EVENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteEvent] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getEvent(input: {
  id: string
  displayLang?: "ar" | "en"
}): Promise<ActionResponse<EventSelectResult | null>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "read", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const event = await db.event.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        description: true,
        lang: true,
        eventType: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        organizer: true,
        targetAudience: true,
        maxAttendees: true,
        currentAttendees: true,
        isPublic: true,
        registrationRequired: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!event) {
      return { success: true, data: null }
    }

    // On-demand translation if displayLang differs from stored lang
    if (input.displayLang && schoolId) {
      const translated = await getDisplayFields(
        event,
        ["title", "description"],
        (event.lang as "ar" | "en") || "ar",
        input.displayLang,
        schoolId
      )
      return {
        success: true,
        data: {
          ...event,
          title: translated.title || event.title,
          description: translated.description || event.description,
        } as EventSelectResult,
      }
    }

    return { success: true, data: event as EventSelectResult }
  } catch (error) {
    console.error("[getEvent] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    }
  }
}

export async function getEvents(
  input: Partial<z.infer<typeof getEventsSchema>>
): Promise<ActionResponse<{ rows: EventListResult[]; total: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "read", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const sp = getEventsSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.eventType ? { eventType: sp.eventType } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.eventDate ? { eventDate: new Date(sp.eventDate) } : {}),
      ...(sp.location
        ? { location: { contains: sp.location, mode: "insensitive" } }
        : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy: Prisma.EventOrderByWithRelationInput[] =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map(
            (s) =>
              ({
                [s.id]: s.desc ? "desc" : "asc",
              }) as Prisma.EventOrderByWithRelationInput
          )
        : [{ eventDate: "desc" }, { startTime: "asc" }]

    const [rows, count] = await Promise.all([
      db.event.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      db.event.count({ where }),
    ])

    const mapped: EventListResult[] = (rows as Array<any>).map((e) => ({
      id: e.id as string,
      title: e.title as string,
      eventType: e.eventType as string,
      eventDate: (e.eventDate as Date).toISOString(),
      startTime: e.startTime as string,
      endTime: e.endTime as string,
      location: e.location || "TBD",
      organizer: e.organizer || "TBD",
      targetAudience: e.targetAudience || "All",
      maxAttendees: e.maxAttendees as number | null,
      currentAttendees: e.currentAttendees as number,
      status: e.status as string,
      isPublic: e.isPublic as boolean,
      createdAt: (e.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getEvents] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    }
  }
}

/**
 * Export events to CSV format
 */
export async function getEventsCSV(
  input?: Partial<z.infer<typeof getEventsSchema>>
): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "export", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized" }
    }

    const sp = getEventsSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.eventType ? { eventType: sp.eventType } : {}),
      ...(sp.status ? { status: sp.status } : {}),
    }

    const events = await db.event.findMany({
      where,
      orderBy: [{ eventDate: "desc" }],
    })

    const headers = [
      "ID",
      "Title",
      "Type",
      "Date",
      "Start Time",
      "End Time",
      "Location",
      "Organizer",
      "Audience",
      "Max Attendees",
      "Current Attendees",
      "Status",
      "Public",
      "Created",
    ]
    const csvRows = (events as Array<any>).map((e) =>
      [
        e.id,
        `"${(e.title || "").replace(/"/g, '""')}"`,
        e.eventType,
        new Date(e.eventDate).toISOString().split("T")[0],
        e.startTime,
        e.endTime,
        `"${(e.location || "").replace(/"/g, '""')}"`,
        `"${(e.organizer || "").replace(/"/g, '""')}"`,
        `"${(e.targetAudience || "").replace(/"/g, '""')}"`,
        e.maxAttendees || "",
        e.currentAttendees || 0,
        e.status,
        e.isPublic ? "Yes" : "No",
        new Date(e.createdAt).toISOString().split("T")[0],
      ].join(",")
    )

    const csv = [headers.join(","), ...csvRows].join("\n")
    return { success: true, data: csv }
  } catch (error) {
    console.error("[getEventsCSV] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export events",
    }
  }
}

export async function bulkDeleteEvents(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertEventPermission(authContext, "bulk_action", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized for bulk operations" }
    }

    const { ids } = z
      .object({ ids: z.array(z.string().min(1)).min(1) })
      .parse(input)

    const existing = await db.event.findMany({
      where: { id: { in: ids }, schoolId },
      select: { id: true },
    })
    const validIds = existing.map((e: any) => e.id)

    const result = await db.event.deleteMany({
      where: { id: { in: validIds }, schoolId },
    })

    revalidatePath("/events")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkDeleteEvents] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to bulk delete events",
    }
  }
}

// ============================================================================
// Event Registration (RSVP)
// ============================================================================

export async function registerForEvent(input: {
  eventId: string
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { eventId } = z.object({ eventId: z.string().min(1) }).parse(input)

    // Verify event exists and registration is open
    const event = await db.event.findFirst({
      where: { id: eventId, schoolId },
      select: {
        id: true,
        registrationRequired: true,
        maxAttendees: true,
        currentAttendees: true,
        status: true,
      },
    })

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    if (event.status === "CANCELLED") {
      return { success: false, error: "Event is cancelled" }
    }

    // Check capacity
    const isFull =
      event.maxAttendees !== null &&
      event.currentAttendees >= event.maxAttendees

    // Check existing registration
    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    })

    if (existing && existing.status === "REGISTERED") {
      return { success: false, error: "Already registered" }
    }

    const status = isFull ? "WAITLISTED" : "REGISTERED"

    const registration = await db.eventRegistration.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
      create: {
        schoolId,
        eventId,
        userId: session.user.id,
        status,
        registeredAt: new Date(),
      },
      update: {
        status,
        registeredAt: new Date(),
        cancelledAt: null,
      },
    })

    // Increment counter if registered (not waitlisted)
    if (status === "REGISTERED") {
      await db.event.update({
        where: { id: eventId },
        data: { currentAttendees: { increment: 1 } },
      })
    }

    revalidatePath(EVENTS_PATH)
    return { success: true, data: { id: registration.id } }
  } catch (error) {
    console.error("[registerForEvent] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to register for event",
    }
  }
}

export async function cancelEventRegistration(input: {
  eventId: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { eventId } = z.object({ eventId: z.string().min(1) }).parse(input)

    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    })

    if (!existing || existing.status === "CANCELLED") {
      return { success: false, error: "No active registration found" }
    }

    const wasRegistered = existing.status === "REGISTERED"

    await db.eventRegistration.update({
      where: { id: existing.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    })

    // Decrement counter only if was registered (not waitlisted)
    if (wasRegistered) {
      await db.event.update({
        where: { id: eventId },
        data: { currentAttendees: { decrement: 1 } },
      })
    }

    revalidatePath(EVENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[cancelEventRegistration] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel registration",
    }
  }
}

export async function getEventRegistrations(input: {
  eventId: string
}): Promise<
  ActionResponse<
    Array<{
      id: string
      userId: string
      username: string | null
      email: string | null
      status: string
      registeredAt: string
    }>
  >
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Only admin/staff can view registrations
    if (!["ADMIN", "DEVELOPER", "STAFF"].includes(authContext.role)) {
      return { success: false, error: "Unauthorized" }
    }

    const { eventId } = z.object({ eventId: z.string().min(1) }).parse(input)

    const registrations = await db.eventRegistration.findMany({
      where: { eventId, schoolId },
      select: {
        id: true,
        userId: true,
        status: true,
        registeredAt: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { registeredAt: "asc" },
    })

    return {
      success: true,
      data: registrations.map((r) => ({
        id: r.id,
        userId: r.userId,
        username: r.user.username,
        email: r.user.email,
        status: r.status,
        registeredAt: r.registeredAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("[getEventRegistrations] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get registrations",
    }
  }
}

/**
 * Get previous events for autocomplete suggestions
 * Returns recent events with titles and descriptions
 */
export async function getPreviousEvents(options?: {
  displayLang?: "ar" | "en"
}): Promise<
  ActionResponse<
    Array<{
      id: string
      title: string | null
      description: string | null
      lang: string
    }>
  >
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Fetch recent events for suggestions (limit to 20 most recent)
    const events = await db.event.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        lang: true,
      },
    })

    // Translate suggestions if displayLang differs from stored lang
    const displayLang = options?.displayLang
    if (displayLang) {
      const translated = await Promise.all(
        events.map(async (e) => {
          const storedLang = (e.lang as "ar" | "en") || "ar"
          if (storedLang === displayLang) return e
          const fields = await getDisplayFields(
            e,
            ["title", "description"],
            storedLang,
            displayLang,
            schoolId
          )
          return {
            ...e,
            title: fields.title || e.title,
            description: fields.description || e.description,
          }
        })
      )
      return { success: true, data: translated }
    }

    return { success: true, data: events }
  } catch (error) {
    console.error("[getPreviousEvents] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch suggestions",
    }
  }
}
