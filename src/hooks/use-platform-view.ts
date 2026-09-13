"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback } from "react"
import { parseAsStringEnum, useQueryState } from "nuqs"

export type ViewMode = "table" | "grid"

/** Below Tailwind's `md` — the width `ListingViews` splits at. */
const PHONE_QUERY = "(max-width: 767px)"

interface UsePlatformViewOptions {
  defaultView?: ViewMode
  /**
   * The view a PHONE opens on while the URL names none. Leave unset and a
   * phone gets `defaultView` like everyone else.
   *
   * Opt-in per listing rather than a global flip: a grid is only a better
   * phone default where the grid has actually been designed for one.
   */
  phoneView?: ViewMode
  storageKey?: string
}

/**
 * Hook for managing school-dashboard view mode (table/grid) with URL persistence
 */
export function usePlatformView(options: UsePlatformViewOptions = {}) {
  const { defaultView = "table", phoneView: phoneDefault } = options

  // No `.withDefault()`: a missing `?view` has to stay distinguishable from an
  // explicit one, because "the reader chose table" and "nobody chose" render
  // differently on a phone.
  const [param, setParam] = useQueryState(
    "view",
    parseAsStringEnum<ViewMode>(["table", "grid"]).withOptions({
      history: "replace",
      shallow: true,
    })
  )

  const view: ViewMode = param ?? defaultView
  const phoneView: ViewMode | null =
    param === null && phoneDefault && phoneDefault !== defaultView
      ? phoneDefault
      : null

  const setView = useCallback(
    (next: ViewMode) => {
      void setParam(next)
    },
    [setParam]
  )

  // The effective view is resolved inside the handler, where `window` exists —
  // never during render, so server and client markup agree.
  const toggleView = useCallback(() => {
    void setParam((prev) => {
      const onPhone =
        typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches
      const current =
        prev ?? (onPhone && phoneDefault ? phoneDefault : defaultView)
      return current === "table" ? "grid" : "table"
    })
  }, [setParam, phoneDefault, defaultView])

  const setTableView = useCallback(() => {
    void setParam("table")
  }, [setParam])

  const setGridView = useCallback(() => {
    void setParam("grid")
  }, [setParam])

  return {
    view,
    /** Set while a phone is showing its own default; null otherwise. */
    phoneView,
    setView,
    toggleView,
    setTableView,
    setGridView,
    isTable: view === "table",
    isGrid: view === "grid",
  }
}
