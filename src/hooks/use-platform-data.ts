"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Platform Data Hook - Optimistic Updates & Auto-Refresh
 *
 * Provides data management with:
 * - Infinite scroll / load more pagination
 * - Optimistic UI updates (add, update, remove)
 * - Auto-refresh when filters change
 * - Server state synchronization
 *
 * OPTIMISTIC UPDATE GOTCHAS:
 *
 * 1. NO ROLLBACK MECHANISM:
 *    optimisticAdd/Update/Remove update local state immediately.
 *    If the server action fails, the UI shows stale data until refresh.
 *    SOLUTION: Wrap in try-catch, call refresh() on failure.
 *
 * 2. ID GENERATION:
 *    optimisticAdd expects the item to have an 'id' already.
 *    For create operations, generate a temp ID (Date.now()) then
 *    replace after server confirms with real ID.
 *
 * 3. RACE CONDITIONS:
 *    If user rapidly adds multiple items, they appear in reverse order
 *    (newest first). This is intentional for "recent first" UIs.
 *
 * FILTER CHANGE DETECTION:
 * Uses JSON.stringify to compare filters. Works for primitives but
 * may cause false positives if object reference changes without values changing.
 *
 * FIRST RENDER SKIP:
 * Initial data comes from server (SSR). We skip refetching on first render
 * to prevent unnecessary network requests.
 */
import { useCallback, useEffect, useRef, useState } from "react"

interface UsePlatformDataOptions<TData, TFilters> {
  initialData: TData[]
  total: number
  perPage?: number
  fetcher: (params: TFilters & { page: number; perPage: number }) => Promise<{
    rows: TData[]
    total: number
  }>
  filters?: TFilters
}

interface UsePlatformDataReturn<TData> {
  data: TData[]
  total: number
  currentPage: number
  isLoading: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  optimisticAdd: (item: TData) => void
  optimisticUpdate: (id: string, updater: (item: TData) => TData) => void
  optimisticRemove: (id: string) => void
  setData: React.Dispatch<React.SetStateAction<TData[]>>
}

/**
 * Hook for managing school-dashboard data with optimistic updates and auto-refresh
 */
export function usePlatformData<
  TData extends { id: string },
  TFilters = Record<string, unknown>,
>(
  options: UsePlatformDataOptions<TData, TFilters>
): UsePlatformDataReturn<TData> {
  const {
    initialData,
    total: initialTotal,
    perPage = 20,
    fetcher,
    filters = {} as TFilters,
  } = options

  const [data, setData] = useState<TData[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const hasMore = data.length < total

  // WHY LATEST-REFS:
  // Call sites pass `fetcher` as an inline arrow and `filters` as an inline
  // object literal, so both get a fresh identity on every render. Reading them
  // through refs keeps `loadMore`/`refresh` referentially STABLE, which is what
  // lets React.memo on DataTable/DataTableLoadMore actually hold — otherwise
  // every table re-rendered its entire body on every keystroke.
  const fetcherRef = useRef(fetcher)
  const filtersRef = useRef(filters)
  const perPageRef = useRef(perPage)
  useEffect(() => {
    fetcherRef.current = fetcher
    filtersRef.current = filters
    perPageRef.current = perPage
  })

  // Mirror page/length into refs so the stable callbacks below never close over
  // stale state.
  const pageRef = useRef(1)
  const dataLengthRef = useRef(initialData.length)
  useEffect(() => {
    dataLengthRef.current = data.length
  }, [data.length])

  // WHY A REQUEST TOKEN:
  // Responses can land out of order — a slow loadMore resolving after a filter
  // change would append rows matching the OLD filter onto the new result set.
  // Every request captures the token it started with and discards itself if the
  // token has since moved on.
  const requestTokenRef = useRef(0)

  // WHY A REF (not the isLoading state) FOR THE IN-FLIGHT GUARD:
  // State updates are async, so two clicks dispatched before React re-renders
  // both observe isLoading === false and fire duplicate requests. A ref flips
  // synchronously.
  const inFlightRef = useRef(false)

  // Load more items (infinite scroll / load more button)
  const loadMore = useCallback(async () => {
    if (inFlightRef.current) return

    inFlightRef.current = true
    const token = requestTokenRef.current
    setIsLoading(true)
    try {
      // Read page from the setter to avoid capturing a stale currentPage.
      const nextPage = pageRef.current + 1
      const result = await fetcherRef.current({
        ...filtersRef.current,
        page: nextPage,
        perPage: perPageRef.current,
      })

      if (token !== requestTokenRef.current) return // superseded — drop it

      if (result.rows.length > 0) {
        // WHY DEDUPE: offset pagination re-serves a row whenever a record is
        // inserted or removed between pages. Appending blindly produced
        // duplicate React keys and visibly repeated rows.
        setData((prev) => {
          const seen = new Set(prev.map((item) => item.id))
          const fresh = result.rows.filter((row) => !seen.has(row.id))
          return fresh.length > 0 ? [...prev, ...fresh] : prev
        })
        pageRef.current = nextPage
        setCurrentPage(nextPage)
        setTotal(result.total)
      } else {
        // Server has nothing further; stop advertising more.
        setTotal((prevTotal) => Math.min(prevTotal, dataLengthRef.current))
      }
    } catch (error) {
      console.error("Failed to load more:", error)
    } finally {
      inFlightRef.current = false
      if (token === requestTokenRef.current) setIsLoading(false)
    }
  }, [])

  // Refresh data from server (reset to page 1 with current filters)
  const refresh = useCallback(async () => {
    // Invalidate anything in flight — its rows belong to a superseded query.
    const token = ++requestTokenRef.current
    setIsLoading(true)
    try {
      const result = await fetcherRef.current({
        ...filtersRef.current,
        page: 1,
        perPage: perPageRef.current,
      })

      if (token !== requestTokenRef.current) return

      setData(result.rows)
      setTotal(result.total)
      pageRef.current = 1
      setCurrentPage(1)
    } catch (error) {
      console.error("Failed to refresh:", error)
    } finally {
      if (token === requestTokenRef.current) setIsLoading(false)
    }
  }, [])

  // WHY REFS:
  // - prevFiltersRef: Compare current vs previous without triggering re-renders
  // - isFirstRender: Skip initial fetch (SSR already provided data)
  const prevFiltersRef = useRef<string>(JSON.stringify(filters))
  const isFirstRender = useRef(true)

  // Auto-refetch when filters change (skip first render)
  const filtersKey = JSON.stringify(filters)
  useEffect(() => {
    // WHY SKIP FIRST RENDER:
    // initialData comes from server-side rendering with current filters.
    // Refetching would cause flash and wasted network request.
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevFiltersRef.current = filtersKey
      return
    }

    // Only refetch if filters actually changed (prevents infinite loop)
    if (filtersKey !== prevFiltersRef.current) {
      prevFiltersRef.current = filtersKey
      refresh()
    }
  }, [filtersKey, refresh])

  // OPTIMISTIC OPERATIONS:
  // Update local state immediately for instant UI feedback.
  // CRITICAL: Caller must handle server action failure and refresh if needed.

  // WHY [item, ...prev]: New items appear at top (most recent first)
  const optimisticAdd = useCallback((item: TData) => {
    setData((prev) => [item, ...prev])
    setTotal((prev) => prev + 1)
  }, [])

  // WHY updater function: Allows partial updates without fetching full object
  const optimisticUpdate = useCallback(
    (id: string, updater: (item: TData) => TData) => {
      setData((prev) =>
        prev.map((item) => (item.id === id ? updater(item) : item))
      )
    },
    []
  )

  // WHY Math.max(0, ...): Prevent negative total if remove called twice for same item
  const optimisticRemove = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    data,
    total,
    currentPage,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    setData,
  }
}

/**
 * Create a mutation helper with standardized success/error handling
 *
 * WHY THIS HELPER:
 * - Enforces consistent { success: boolean } return type
 * - Centralizes error handling (onError callback)
 * - Separates mutation logic from component state
 *
 * USAGE PATTERN:
 * ```ts
 * const deleteStudent = createPlatformMutation({
 *   mutationFn: deleteStudentAction,
 *   onSuccess: () => {
 *     toast({ title: "Deleted" })
 *     refresh()  // Re-sync with server
 *   },
 *   onError: (error) => {
 *     refresh()  // Rollback optimistic update
 *     toast({ title: "Failed", description: error.message })
 *   }
 * })
 *
 * // In component:
 * optimisticRemove(id)  // Immediate UI update
 * await deleteStudent({ id })  // Server action
 * ```
 */
export function createPlatformMutation<TInput, TResult>(options: {
  mutationFn: (input: TInput) => Promise<TResult & { success: boolean }>
  onSuccess?: (result: TResult) => void
  onError?: (error: Error) => void
}) {
  return async (input: TInput): Promise<TResult & { success: boolean }> => {
    try {
      const result = await options.mutationFn(input)
      if (result.success) {
        options.onSuccess?.(result)
      }
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error")
      options.onError?.(err)
      throw err
    }
  }
}
