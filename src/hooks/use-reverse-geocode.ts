// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useRef, useState } from "react"

import { reverseGeocode, type LocationResult } from "@/lib/mapbox"

/**
 * Address for a point. Only the latest request counts: dragging the pin
 * twice aborts the first lookup, and a superseded call resolves to null so
 * the caller drops it instead of writing a stale address.
 */
export function useReverseGeocode(language?: string) {
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const geocode = useCallback(
    async (
      latitude: number,
      longitude: number
    ): Promise<LocationResult | null | "superseded"> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      const data = await reverseGeocode(
        latitude,
        longitude,
        language,
        controller.signal
      )
      if (controller.signal.aborted) return "superseded"
      setLoading(false)
      return data
    },
    [language]
  )

  return { geocode, loading }
}
