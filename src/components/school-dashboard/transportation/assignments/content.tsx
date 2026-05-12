// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  listAssignments,
  listRouteStopsForAssignment,
  listStudentsForAssignment,
} from "../actions/assignments"
import { listRoutes } from "../actions/routes"
import { TransportationEmptyState } from "../empty-state"
import { AssignmentsClient } from "./assignments-client"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function AssignmentsContent({ locale, dictionary }: Props) {
  const [assignmentsResult, routesResult, studentsResult, stopsResult] =
    await Promise.all([
      listAssignments(),
      listRoutes(),
      listStudentsForAssignment(),
      listRouteStopsForAssignment(),
    ])

  if (!assignmentsResult.success) {
    return (
      <TransportationEmptyState
        title={dictionary.transportation.empty.noAssignments}
        description={dictionary.transportation.errors.internalError}
      />
    )
  }

  const students = studentsResult.success ? studentsResult.data : []
  const allStops = stopsResult.success ? stopsResult.data : []

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
