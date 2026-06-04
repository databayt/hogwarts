// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listDrivers } from "../actions/drivers"
import { listAvailableGeofences, listRoutes } from "../actions/routes"
import { listVehicles } from "../actions/vehicles"
import { TransportationEmptyState } from "../empty-state"
import { translateRoutes } from "../shared/translate-display"
import { RoutesClient } from "./routes-client"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function RoutesContent({ locale, dictionary }: Props) {
  const [routesResult, vehiclesResult, driversResult, geofencesResult] =
    await Promise.all([
      listRoutes(),
      listVehicles(),
      listDrivers(),
      listAvailableGeofences(),
    ])

  if (!routesResult.success) {
    return (
      <TransportationEmptyState
        title={dictionary.transportation.empty.noRoutes}
        description={dictionary.transportation.errors.internalError}
      />
    )
  }

  return (
    <RoutesClient
      locale={locale}
      routes={await translateRoutes(routesResult.data, locale)}
      vehicles={vehiclesResult.success ? vehiclesResult.data : []}
      drivers={driversResult.success ? driversResult.data : []}
      geofences={geofencesResult.success ? geofencesResult.data : []}
      dictionary={dictionary}
    />
  )
}
