// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listVehicles } from "../actions/vehicles"
import { TransportationEmptyState } from "../empty-state"
import { VehiclesClient } from "./vehicles-client"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function VehiclesContent({ locale, dictionary }: Props) {
  const result = await listVehicles()

  if (!result.success) {
    return (
      <TransportationEmptyState
        title={dictionary.transportation.empty.noVehicles}
        description={dictionary.transportation.errors.internalError}
      />
    )
  }

  return (
    <VehiclesClient
      locale={locale}
      vehicles={result.data}
      dictionary={dictionary}
    />
  )
}
