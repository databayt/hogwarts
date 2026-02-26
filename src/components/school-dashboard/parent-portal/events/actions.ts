"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function getParentEvents(displayLang?: "ar" | "en") {
  try {
    const session = await auth()

    if (!session?.user?.schoolId) {
      return { success: false, error: "Not authenticated", events: [] }
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
                givenName: true,
                middleName: true,
                surname: true,
              },
            },
          },
        },
      },
    })

    if (!guardian) {
      return { success: false, error: "Guardian not found", events: [] }
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

    // Map events with translation
    const mappedEvents = await Promise.all(
      events.map(async (event) => {
        const storedLang = (event.lang as "ar" | "en") || "ar"
        return {
          id: event.id,
          title: await getDisplayText(
            event.title || "",
            storedLang,
            lang,
            schoolId
          ),
          description: event.description
            ? await getDisplayText(
                event.description,
                storedLang,
                lang,
                schoolId
              )
            : null,
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
        }
      })
    )

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
        name: `${sg.student.givenName}${sg.student.middleName ? ` ${sg.student.middleName}` : ""} ${sg.student.surname}`,
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
