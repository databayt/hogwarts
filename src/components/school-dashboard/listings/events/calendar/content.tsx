// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { getEventsForMonth } from "@/components/school-dashboard/listings/events/queries"
import { localize } from "@/components/translation/localize"

import { EventCalendarClient } from "./calendar-client"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function EventCalendarContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const params = await searchParams
  const now = new Date()
  const year = Number(params.year) || now.getFullYear()
  const month = Number(params.month) || now.getMonth() + 1

  const { events, grouped } = await getEventsForMonth(schoolId, year, month)

  // One batched pass over the month's events; the grouped map is rebuilt from
  // the localized rows by id so both views show the same translated title.
  const localizedEvents = await localize("Event", events as any[], {
    schoolId,
    lang,
  })
  const byId = new Map(localizedEvents.map((e: any) => [e.id, e]))
  const pick = (e: any) => byId.get(e.id) ?? e

  return (
    <EventCalendarClient
      events={localizedEvents.map((e: any) => ({
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
          evts.map((e) => {
            const l = pick(e)
            return {
              id: l.id,
              title: l.title,
              eventType: l.eventType,
              startTime: l.startTime,
              endTime: l.endTime,
              location: l.location || "",
            }
          }),
        ])
      )}
      year={year}
      month={month}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
