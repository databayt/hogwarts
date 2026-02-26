// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Prisma } from "@prisma/client"
import { SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type EventRow } from "@/components/school-dashboard/listings/events/columns"
import { eventsSearchParams } from "@/components/school-dashboard/listings/events/list-params"
import { EventsTable } from "@/components/school-dashboard/listings/events/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function EventsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await eventsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: EventRow[] = []
  let total = 0

  if (schoolId) {
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
            (s: { id: string; desc?: boolean }) =>
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

    data = await Promise.all(
      rows.map(async (e: any) => ({
        id: e.id,
        title: await getDisplayText(e.title, e.lang || "ar", lang, schoolId!),
        eventType: e.eventType,
        eventDate: (e.eventDate as Date).toISOString(),
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location
          ? await getDisplayText(e.location, e.lang || "ar", lang, schoolId!)
          : dictionary?.events?.locationTBD || "TBD",
        organizer: e.organizer
          ? await getDisplayText(e.organizer, e.lang || "ar", lang, schoolId!)
          : dictionary?.events?.organizerTBD || "TBD",
        targetAudience:
          e.targetAudience || dictionary?.events?.audienceTBD || "All",
        maxAttendees: e.maxAttendees,
        currentAttendees: e.currentAttendees,
        status: e.status,
        isPublic: e.isPublic,
        createdAt: (e.createdAt as Date).toISOString(),
      }))
    )
    total = count as number
  }

  return (
    <div className="space-y-6">
      <EventsTable
        initialData={data}
        total={total}
        dictionary={dictionary?.events}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
