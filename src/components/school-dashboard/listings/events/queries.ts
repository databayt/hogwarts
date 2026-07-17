// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read-only query helpers for the Events module.
 *
 * Scope note: this file previously carried a large speculative query-builder
 * library (list/detail/upcoming/day/public/stats + label & colour helpers).
 * None of it was ever imported, and it had drifted out of sync with the schema
 * (hardcoded English labels; `EventStatus` values that no longer matched the
 * Prisma enum). It was removed rather than repaired — the live list/detail
 * queries live in `actions.ts` and `content.tsx`. Add helpers back here only
 * when something actually consumes them.
 */

import { db } from "@/lib/db"

/** Minimal fields for calendar display. */
const eventCalendarSelect = {
  id: true,
  title: true,
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
  status: true,
  isPublic: true,
  createdAt: true,
} as const

/**
 * Get events for a specific month (for calendar view), grouped by ISO date.
 * Bounded to the month range; excludes in-flight wizard drafts.
 */
export async function getEventsForMonth(
  schoolId: string,
  year: number,
  month: number
) {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

  const events = await db.event.findMany({
    where: {
      schoolId,
      wizardStep: null,
      eventDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: { not: "CANCELLED" },
    },
    orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
    select: eventCalendarSelect,
  })

  // Group by date
  const grouped: Record<string, typeof events> = {}
  for (const event of events) {
    const dateKey = event.eventDate.toISOString().split("T")[0]
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(event)
  }

  return { events, grouped }
}
