// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listAssignments } from "../actions/assignments"
import { listRoutes } from "../actions/routes"
import { TransportationEmptyState } from "../empty-state"
import { AssignmentsClient } from "./assignments-client"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function AssignmentsContent({ locale, dictionary }: Props) {
  const [assignmentsResult, routesResult] = await Promise.all([
    listAssignments(),
    listRoutes(),
  ])

  if (!assignmentsResult.success) {
    return (
      <TransportationEmptyState
        title={dictionary.transportation.empty.noAssignments}
        description={dictionary.transportation.errors.internalError}
      />
    )
  }

  // Fetch students + stops grouped by route for the picker. Scoped by tenant.
  const { schoolId } = await getTenantContext()
  const [students, allStops] = schoolId
    ? await Promise.all([
        db.student.findMany({
          where: { schoolId },
          select: { id: true, firstName: true, lastName: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          take: 500,
        }),
        db.routeStop.findMany({
          where: { schoolId },
          select: { id: true, name: true, stopOrder: true, routeId: true },
          orderBy: { stopOrder: "asc" },
        }),
      ])
    : [[], []]

  const stopsByRoute = allStops.reduce<
    Record<string, { id: string; name: string; stopOrder: number }[]>
  >((acc, stop) => {
    if (!acc[stop.routeId]) acc[stop.routeId] = []
    acc[stop.routeId].push({
      id: stop.id,
      name: stop.name,
      stopOrder: stop.stopOrder,
    })
    return acc
  }, {})

  return (
    <AssignmentsClient
      locale={locale}
      assignments={assignmentsResult.data}
      routes={routesResult.success ? routesResult.data : []}
      students={students}
      stopsByRoute={stopsByRoute}
      dictionary={dictionary}
    />
  )
}
