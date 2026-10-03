// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useEffect, useState } from "react"

import {
  suggestPlaces,
  type PlaceSuggestion,
  type SearchBias,
} from "@/lib/mapbox"

import { useDebounce } from "./use-debounce"

/**
 * Debounced, biased address autocomplete. A newer keystroke aborts the
 * request in flight, so a slow answer for "الر" can never overwrite the
 * answer for "الرياض". Loading is DERIVED (the answer on screen belongs to an
 * older query) rather than set from the effect.
 */
export function useMapboxSearch(
  debounceMs = 200,
  language?: string,
  bias?: SearchBias,
  /** False while the dropdown is closed — e.g. right after a selection fills the input */
  enabled = true
) {
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState<{
    q: string
    rows: PlaceSuggestion[]
  }>({ q: "", rows: [] })
  const debouncedQuery = useDebounce(query, debounceMs)

  // Primitive deps so a fresh bias object each render doesn't refetch
  const country = bias?.country
  const lng = bias?.proximity?.[0]
  const lat = bias?.proximity?.[1]

  const q = debouncedQuery.trim()
  const active = enabled && q.length >= 2

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    suggestPlaces(q, {
      language,
      bias: {
        country,
        proximity: lng != null && lat != null ? [lng, lat] : undefined,
      },
      signal: controller.signal,
    })
      .then((rows) => {
        if (!controller.signal.aborted) setAnswer({ q, rows })
      })
      .catch(() => {
        if (!controller.signal.aborted) setAnswer({ q, rows: [] })
      })
    return () => controller.abort()
  }, [active, q, language, country, lng, lat])

  const clearResults = useCallback(() => setAnswer({ q: "", rows: [] }), [])

  const typed = query.trim()
  const loading =
    enabled && typed.length >= 2 && (typed !== q || answer.q !== q)
  // Keep the last rows on screen while the next answer is in flight
  const results = enabled && typed.length >= 2 ? answer.rows : []

  return { query, setQuery, results, loading, clearResults }
}
