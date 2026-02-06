import { useCallback, useRef, useState } from "react"

import { reverseGeocode, type LocationResult } from "@/lib/mapbox"

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false)
  const latestRequestRef = useRef("")

  const geocode = useCallback(
    async (
      latitude: number,
      longitude: number
    ): Promise<LocationResult | null> => {
      const requestKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`
      latestRequestRef.current = requestKey

      setLoading(true)

      try {
        const data = await reverseGeocode(latitude, longitude)

        if (latestRequestRef.current === requestKey) {
          setLoading(false)
          return data
        }

        return null
      } catch {
        if (latestRequestRef.current === requestKey) {
          setLoading(false)
        }
        return null
      }
    },
    []
  )

  return { geocode, loading }
}
