"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { localize } from "@/components/translation/localize"

export async function getParentEvents(displayLang?: "ar" | "en") {
  try {
    const session = await auth()

    if (!session?.user?.schoolId) {
      return { ...actionError(ACTION_ERRORS.NOT_AUTHENTICATED), events: [] }
    }

    const schoolId = session.user.schoolId
    const lang = displayLang || "ar"

    // Get guardian and their students
    const guardian = await db.guardian.findFirst({
      where: {
        userId: session.user.id,
        schoolId,
      },
      include: {
        studentGuardians: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!guardian) {
      return { ...actionError(ACTION_ERRORS.PARENT_NOT_FOUND), events: [] }
    }

    // Fetch upcoming and recent events for the school
    // Parents can see: public events, parent meetings, school-wide events
    const events = await db.event.findMany({
      where: {
        schoolId,
        status: { not: "CANCELLED" },
        OR: [
          { isPublic: true },
          { eventType: "PARENT_MEETING" },
          { targetAudience: { contains: "parent", mode: "insensitive" } },
          { targetAudience: { contains: "all", mode: "insensitive" } },
          { targetAudience: null },
        ],
      },
      orderBy: { eventDate: "desc" },
      take: 50,
      select: {
        id: true,
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
        currentAttendees: true,
        isPublic: true,
        registrationRequired: true,
        status: true,
        createdAt: true,
      },
    })

    // Check user's registrations for these events
    const eventIds = events.map((e) => e.id)
    const registrations = await db.eventRegistration.findMany({
      where: {
        eventId: { in: eventIds },
        userId: session.user.id,
        schoolId,
      },
      select: {
        eventId: true,
        status: true,
      },
    })

    const registrationMap = new Map(
      registrations.map((r) => [r.eventId, r.status])
    )

    // Map events with translation — ONE batched localize() pass for the whole
    // list (replaces N×getText; registry covers title/description/location/organizer).
    const localized = await localize("Event", events, { schoolId, lang })
    const mappedEvents = localized.map((event) => ({
      id: event.id,
      title: event.title || "",
      description: event.description ?? null,
      eventType: event.eventType,
      eventDate: event.eventDate.toISOString(),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      organizer: event.organizer,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      isPublic: event.isPublic,
      registrationRequired: event.registrationRequired,
      status: event.status,
      registrationStatus: registrationMap.get(event.id) || null,
      createdAt: event.createdAt.toISOString(),
    }))

    logger.info("Parent events fetched", {
      action: "parent_events_fetch",
      userId: session.user.id,
      guardianId: guardian.id,
      eventCount: mappedEvents.length,
    })

    return {
      success: true,
      events: mappedEvents,
      students: guardian.studentGuardians.map((sg) => ({
        id: sg.student.id,
        name: `${sg.student.firstName}${sg.student.middleName ? ` ${sg.student.middleName}` : ""} ${sg.student.lastName}`,
      })),
    }
  } catch (error) {
    logger.error(
      "Failed to fetch parent events",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "parent_events_fetch_error",
      }
    )
    return {
      success: false,
      error: "Failed to fetch events",
      events: [],
    }
  }
}
