// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getTenantContext } from "@/lib/tenant-context"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { getEventsForMonth } from "@/components/school-dashboard/listings/events/queries"

import { EventCalendarClient } from "./calendar-client"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

export default async function EventCalendarContent({
  searchParams,
  dictionary,
}: Props) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const params = await searchParams
  const now = new Date()
  const year = Number(params.year) || now.getFullYear()
  const month = Number(params.month) || now.getMonth() + 1

  const { events, grouped } = await getEventsForMonth(schoolId, year, month)

  return (
    <EventCalendarClient
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        eventType: e.eventType,
        eventDate: e.eventDate.toISOString(),
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location || "",
        status: e.status,
      }))}
      grouped={Object.fromEntries(
        Object.entries(grouped).map(([key, evts]) => [
          key,
          evts.map((e) => ({
            id: e.id,
            title: e.title,
            eventType: e.eventType,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location || "",
          })),
        ])
      )}
      year={year}
      month={month}
      dictionary={dictionary}
    />
  )
}
