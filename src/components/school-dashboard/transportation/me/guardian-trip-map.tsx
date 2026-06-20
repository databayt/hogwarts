"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Guardian/student wrapper around TripLiveMap. Fetches the trip's stops +
// polyline via an ownership-checked action, then renders the live map. Renders
// nothing until data resolves (or if access is denied).
import { useEffect, useState } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getTripMapData, type TripMapData } from "../actions/me"
import { decodePolyline } from "../lib/polyline"
import { TripLiveMap } from "../trips/trip-live-map"

interface Props {
  tripId: string
  dictionary: Dictionary
}

export function GuardianTripMap({ tripId, dictionary }: Props) {
  const [data, setData] = useState<TripMapData | null>(null)

  useEffect(() => {
    let active = true
    getTripMapData(tripId)
      .then((r) => {
        if (active && r.success && "data" in r) setData(r.data)
      })
      .catch(() => {
        // access denied or load error — render nothing
      })
    return () => {
      active = false
    }
  }, [tripId])

  if (!data) return null

  const routePath = data.polylineEncoded
    ? decodePolyline(data.polylineEncoded)
    : undefined

  return (
    <TripLiveMap
      tripId={tripId}
      stops={data.stops}
      routePath={routePath}
      dictionary={dictionary}
    />
  )
}
