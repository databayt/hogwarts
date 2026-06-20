// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listRoutes } from "../actions/routes"
import { listPendingTransportSkips } from "../actions/skips"
import { listTrips } from "../actions/trips"
import { TransportationEmptyState } from "../empty-state"
import { translateRoutes } from "../shared/translate-display"
import { TripSkipApprovals } from "./trip-skip-approvals"
import { TripsClient } from "./trips-client"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function TripsContent({ locale, dictionary }: Props) {
  const [tripsResult, routesResult, skipsResult] = await Promise.all([
    listTrips(),
    listRoutes(),
    listPendingTransportSkips(),
  ])

  if (!tripsResult.success) {
    return (
      <TransportationEmptyState
        title={dictionary.transportation.trips.empty}
        description={dictionary.transportation.errors.internalError}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {skipsResult.success ? (
        <TripSkipApprovals
          skips={skipsResult.data}
          locale={locale}
          dictionary={dictionary}
        />
      ) : null}
      <TripsClient
        locale={locale}
        trips={tripsResult.data}
        routes={
          routesResult.success
            ? await translateRoutes(routesResult.data, locale)
            : []
        }
        dictionary={dictionary}
      />
    </div>
  )
}
