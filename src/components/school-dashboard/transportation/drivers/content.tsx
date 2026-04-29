// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listDrivers } from "../actions/drivers"
import { TransportationEmptyState } from "../empty-state"
import { DriversClient } from "./drivers-client"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function DriversContent({ locale, dictionary }: Props) {
  const result = await listDrivers()

  if (!result.success) {
    return (
      <TransportationEmptyState
        title={dictionary.transportation.empty.noDrivers}
        description={dictionary.transportation.errors.internalError}
      />
    )
  }

  return (
    <DriversClient
      locale={locale}
      drivers={result.data}
      dictionary={dictionary}
    />
  )
}
