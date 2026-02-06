import { useCallback, useEffect, useRef, useState } from "react"

import { searchPlaces, type MapboxFeature } from "@/lib/mapbox"

import { useDebounce } from "./use-debounce"

export function useMapboxSearch(debounceMs = 300) {
  const [query, setQueryRaw] = useState("")
  const [results, setResults] = useState<MapboxFeature[]>([])
  const [loading, setLoading] = useState(false)

  const latestQueryRef = useRef("")
  const debouncedQuery = useDebounce(query, debounceMs)

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    latestQueryRef.current = trimmed

    if (!trimmed || trimmed.length < 2) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      const features = await searchPlaces(trimmed)
      if (latestQueryRef.current === trimmed) {
        setResults(features)
      }
    } catch {
      if (latestQueryRef.current === trimmed) {
        setResults([])
      }
    } finally {
      if (latestQueryRef.current === trimmed) {
        setLoading(false)
      }
    }
  }, [])

  // Auto-search on debounced query change
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
    }
  }, [debouncedQuery, performSearch])

  const setQuery = useCallback((newQuery: string) => {
    setQueryRaw(newQuery)
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setQueryRaw("")
    latestQueryRef.current = ""
  }, [])

  return { query, setQuery, results, loading, clearResults }
}
