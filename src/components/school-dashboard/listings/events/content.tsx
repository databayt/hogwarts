// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Prisma } from "@prisma/client"
import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type EventRow } from "@/components/school-dashboard/listings/events/columns"
import { getTargetAudiences } from "@/components/school-dashboard/listings/events/config"
import { eventsSearchParams } from "@/components/school-dashboard/listings/events/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/events/permissions"
import { EventsTable } from "@/components/school-dashboard/listings/events/table"
import { localize } from "@/components/translation/localize"
import { search } from "@/components/translation/search"

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
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  let data: EventRow[] = []
  let total = 0

  if (schoolId) {
    // Bilingual search: queries in either language match content stored in
    // the other language via the translation cache — no API cost.
    const school =
      sp.title || sp.location
        ? await db.school.findUnique({
            where: { id: schoolId },
            select: { preferredLanguage: true },
          })
        : null
    const storageLang = (school?.preferredLanguage as "ar" | "en") || "ar"
    const displayLang = lang === "en" ? "en" : "ar"

    const [titleConditions, locationConditions] = await Promise.all([
      sp.title
        ? search(sp.title, ["title"], schoolId, storageLang, displayLang)
        : Promise.resolve(null),
      sp.location
        ? search(sp.location, ["location"], schoolId, storageLang, displayLang)
        : Promise.resolve(null),
    ])

    const andClauses: object[] = []
    if (titleConditions) andClauses.push({ OR: titleConditions })
    if (locationConditions) andClauses.push({ OR: locationConditions })

    const where: any = {
      schoolId,
      // Exclude in-flight wizard drafts — they have a blank title until the
      // wizard completes and would otherwise pollute the list and its count.
      wizardStep: null,
      ...(andClauses.length ? { AND: andClauses } : {}),
      ...(sp.eventType ? { eventType: sp.eventType } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.eventDate ? { eventDate: new Date(sp.eventDate) } : {}),
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

    const audienceMap = Object.fromEntries(
      getTargetAudiences(dictionary?.events).map((o) => [o.value, o.label])
    )

    const [rows, count] = await Promise.all([
      db.event.findMany({
        where,
        orderBy,
        skip,
        take,
        // Only the columns EventRow renders — keeps the description/notes Text
        // columns out of the RSC payload on every row of every page.
        select: {
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
        },
      }),
      db.event.count({ where }),
    ])

    // ONE batched translation pass — replaces 3× getText per row.
    const localizedRows = await localize("Event", rows as any[], {
      schoolId,
      lang: displayLang,
    })

    data = localizedRows.map((e: any) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      eventDate: (e.eventDate as Date).toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location ?? dictionary?.events?.locationTBD ?? "TBD",
      organizer: e.organizer ?? dictionary?.events?.organizerTBD ?? "TBD",
      targetAudience: e.targetAudience
        ? (audienceMap[e.targetAudience] ?? e.targetAudience)
        : (dictionary?.events?.audienceTBD ?? "All"),
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
        permissions={permissions}
      />
    </div>
  )
}
