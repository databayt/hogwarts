"use client"

import { useCallback } from "react"
import { parseAsStringEnum, useQueryState } from "nuqs"

export type ViewMode = "table" | "grid"

interface UsePlatformViewOptions {
  defaultView?: ViewMode
  storageKey?: string
}

/**
 * Hook for managing school-dashboard view mode (table/grid) with URL persistence
 */
export function usePlatformView(options: UsePlatformViewOptions = {}) {
  const { defaultView = "table" } = options

  const [view, setView] = useQueryState(
    "view",
    parseAsStringEnum<ViewMode>(["table", "grid"])
      .withDefault(defaultView)
      .withOptions({
        history: "replace",
        shallow: true,
      })
  )

  const toggleView = useCallback(() => {
    setView((prev) => (prev === "table" ? "grid" : "table"))
  }, [setView])

  const setTableView = useCallback(() => {
    setView("table")
  }, [setView])

  const setGridView = useCallback(() => {
    setView("grid")
  }, [setView])

  return {
    view,
    setView,
    toggleView,
    setTableView,
    setGridView,
    isTable: view === "table",
    isGrid: view === "grid",
  }
}
