import { type Prisma } from "@prisma/client"
import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type EventRow } from "@/components/platform/events/columns"
import { eventsSearchParams } from "@/components/platform/events/list-params"
import { EventsTable } from "@/components/platform/events/table"

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

    data = rows.map((e: any) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      eventDate: (e.eventDate as Date).toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location || dictionary?.events?.locationTBD || "TBD",
      organizer: e.organizer || dictionary?.events?.organizerTBD || "TBD",
      targetAudience:
        e.targetAudience || dictionary?.events?.audienceTBD || "All",
      maxAttendees: e.maxAttendees,
      currentAttendees: e.currentAttendees,
      status: e.status,
      isPublic: e.isPublic,
      createdAt: (e.createdAt as Date).toISOString(),
    }))
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
