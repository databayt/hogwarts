/**
 * Events Seed
 * Creates school events
 *
 * Phase 7: Announcements & Events
 *
 * Note: Event model has no unique constraint, using findFirst + create
 * Schema fields: title, description, eventType, eventDate, startTime, endTime
 */

import type { PrismaClient } from "@prisma/client"

import { EVENTS } from "./constants"
import { logSuccess } from "./utils"

// ============================================================================
// EVENTS SEEDING
// ============================================================================

/**
 * Seed school events (30+ events)
 * Note: Event model has no unique constraint, using findFirst + create
 */
export async function seedEvents(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  let count = 0

  for (const event of EVENTS) {
    try {
      // Check if event exists (by title and eventDate)
      const existing = await prisma.event.findFirst({
        where: {
          schoolId,
          title: event.titleEn,
          eventDate: event.startDate,
        },
      })

      if (!existing) {
        await prisma.event.create({
          data: {
            schoolId,
            title: event.titleEn,
            description: event.descriptionEn,
            eventType: event.type.toUpperCase() as
              | "ACADEMIC"
              | "SPORTS"
              | "CULTURAL"
              | "PARENT_MEETING"
              | "CELEBRATION"
              | "WORKSHOP"
              | "OTHER",
            eventDate: event.startDate,
            startTime: event.startDate.toTimeString().slice(0, 5), // HH:MM
            endTime: event.endDate.toTimeString().slice(0, 5), // HH:MM
            status: "PLANNED",
          },
        })
        count++
      }
    } catch {
      // Skip if event already exists
    }
  }

  // Add more diverse events
  const additionalEvents = [
    {
      titleEn: "Science Fair",
      descriptionEn: "Annual science fair showcasing student projects",
      type: "ACADEMIC" as const,
      startDate: new Date("2025-11-15T09:00:00"),
      endDate: new Date("2025-11-15T15:00:00"),
    },
    {
      titleEn: "Cultural Day",
      descriptionEn: "Celebration of Sudanese culture and heritage",
      type: "CULTURAL" as const,
      startDate: new Date("2025-12-01T08:00:00"),
      endDate: new Date("2025-12-01T14:00:00"),
    },
    {
      titleEn: "Swimming Competition",
      descriptionEn: "Inter-class swimming championship",
      type: "SPORTS" as const,
      startDate: new Date("2025-11-20T10:00:00"),
      endDate: new Date("2025-11-20T14:00:00"),
    },
    {
      titleEn: "Quran Recitation Competition",
      descriptionEn: "Annual Quran recitation competition",
      type: "OTHER" as const, // RELIGIOUS not in enum, using OTHER
      startDate: new Date("2025-11-25T08:00:00"),
      endDate: new Date("2025-11-25T12:00:00"),
    },
    {
      titleEn: "Winter Break Begins",
      descriptionEn: "Start of winter holiday break",
      type: "OTHER" as const,
      startDate: new Date("2025-12-20T12:00:00"),
      endDate: new Date("2026-01-05T08:00:00"),
    },
    {
      titleEn: "Art Exhibition",
      descriptionEn: "Student art exhibition",
      type: "CULTURAL" as const,
      startDate: new Date("2025-10-10T09:00:00"),
      endDate: new Date("2025-10-10T15:00:00"),
    },
    {
      titleEn: "Football Tournament",
      descriptionEn: "Inter-class football tournament",
      type: "SPORTS" as const,
      startDate: new Date("2025-10-25T14:00:00"),
      endDate: new Date("2025-10-30T16:00:00"),
    },
    {
      titleEn: "Parent Workshop",
      descriptionEn: "Workshop on supporting student learning at home",
      type: "PARENT_MEETING" as const,
      startDate: new Date("2025-11-05T16:00:00"),
      endDate: new Date("2025-11-05T18:00:00"),
    },
    {
      titleEn: "Independence Day Celebration",
      descriptionEn: "Sudan Independence Day celebration",
      type: "CELEBRATION" as const,
      startDate: new Date("2026-01-01T08:00:00"),
      endDate: new Date("2026-01-01T12:00:00"),
    },
    {
      titleEn: "Graduation Ceremony",
      descriptionEn: "Annual graduation ceremony for Grade 12 students",
      type: "ACADEMIC" as const,
      startDate: new Date("2026-06-25T09:00:00"),
      endDate: new Date("2026-06-25T13:00:00"),
    },
  ]

  for (const event of additionalEvents) {
    try {
      const existing = await prisma.event.findFirst({
        where: {
          schoolId,
          title: event.titleEn,
          eventDate: event.startDate,
        },
      })

      if (!existing) {
        await prisma.event.create({
          data: {
            schoolId,
            title: event.titleEn,
            description: event.descriptionEn,
            eventType: event.type,
            eventDate: event.startDate,
            startTime: event.startDate.toTimeString().slice(0, 5),
            endTime: event.endDate.toTimeString().slice(0, 5),
            status: "PLANNED",
          },
        })
        count++
      }
    } catch {
      // Skip if event already exists
    }
  }

  logSuccess("Events", count, "academic, sports, cultural, celebrations")

  return count
}
