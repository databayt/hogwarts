// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { HomeBlockClient } from "./home-block-client"

/**
 * Server half of the phone dashboard's top block: one tenant-scoped count for
 * the calendar widget's bottom line. The Android widget shows the day's class
 * count from its view-model; the web equivalent that every role can read is
 * the school's own events for today.
 *
 * The count is best-effort — a failure here must not take the dashboard down,
 * so it falls back to zero and the widget renders its "no events" line.
 */
export async function HomeBlock({ locale }: { locale: string }) {
  let eventsToday = 0

  try {
    const { schoolId } = await getTenantContext()
    if (schoolId) {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      eventsToday = await db.event.count({
        where: {
          schoolId,
          eventDate: { gte: start, lt: end },
          status: { not: "CANCELLED" },
        },
      })
    }
  } catch (error) {
    console.error("[HomeBlock] Error counting today's events:", error)
  }

  return <HomeBlockClient locale={locale} eventsToday={eventsToday} />
}
