"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { useDebounce } from "@/hooks/use-debounce"

import { globalSpotlightSearch } from "./actions"
import type { SpotlightGroupKind, SpotlightResultGroup } from "./types"

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

export interface UseSpotlightSearchArgs {
  /** Live query from the input — debounced internally before fetch. */
  query: string
  /** Tenant scope. Fetch is skipped if absent (we never run cross-tenant). */
  schoolId?: string
  /** Render locale; reserved for future per-locale ranking (not used yet). */
  locale?: "en" | "ar"
  /** Optional kind filter — empty/undefined searches all allowed kinds. */
  kinds?: SpotlightGroupKind[]
  /** Whether the dialog is currently open; pause fetch on close. */
  enabled: boolean
}

export type SpotlightFetchError =
  | "UNAUTHENTICATED"
  | "MISSING_SCHOOL_CONTEXT"
  | "QUERY_TOO_SHORT"
  | "FORBIDDEN"
  | "FETCH_FAILED"

export interface UseSpotlightSearchResult {
  groups: SpotlightResultGroup[]
  isPending: boolean
  error: SpotlightFetchError | null
  /** The debounced version of the query the current `groups` reflect. */
  debouncedQuery: string
}

/**
 * Drives the dynamic spotlight results panel. Combines a 300 ms debounce
 * with `useTransition` so the input remains responsive while a server
 * action fetches; cancels in-flight responses when the user types past the
 * old query.
 */
export function useSpotlightSearch({
  query,
  schoolId,
  locale,
  kinds,
  enabled,
}: UseSpotlightSearchArgs): UseSpotlightSearchResult {
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  const [groups, setGroups] = React.useState<SpotlightResultGroup[]>([])
  const [error, setError] = React.useState<SpotlightFetchError | null>(null)
  const [isPending, startTransition] = React.useTransition()

  // Stable kinds key avoids re-firing on a fresh array with same contents.
  const kindsKey = React.useMemo(
    () => (kinds && kinds.length ? kinds.slice().sort().join(",") : ""),
    [kinds]
  )

  React.useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!enabled || !schoolId || trimmed.length < MIN_QUERY_LENGTH) {
      setGroups([])
      setError(null)
      return
    }

    let cancelled = false
    startTransition(async () => {
      try {
        const out = await globalSpotlightSearch({
          query: trimmed,
          locale,
          kinds,
        })
        if (cancelled) return
        if (out.ok) {
          setGroups(out.groups)
          setError(null)
        } else {
          setGroups([])
          setError(out.errorCode)
        }
      } catch {
        if (!cancelled) {
          setGroups([])
          setError("FETCH_FAILED")
        }
      }
    })

    return () => {
      cancelled = true
    }
    // `kinds` is captured via `kindsKey` to keep the effect stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, enabled, schoolId, locale, kindsKey])

  return { groups, isPending, error, debouncedQuery }
}
