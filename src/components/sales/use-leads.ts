/**
 * useLeads Hook - Lead Management with Real-Time Updates
 *
 * Centralized lead data management with:
 * - Debounced search (300ms) to prevent excessive API calls
 * - Filter & pagination state synced to URL via nuqs
 * - Lead selection for bulk actions
 * - AI-powered text extraction to create leads from free-form text
 * - Lead analytics (total, by status, etc.)
 * - Auto-refresh capability with configurable interval
 *
 * KEY PATTERNS:
 * - DEBOUNCED SEARCH: Waits 300ms after user stops typing before fetching
 * - AUTO-REFRESH: Optional 30s polling for real-time updates (disabled by default)
 * - OPTIMISTIC SELECTION: Selection state doesn't depend on API
 * - FILTER RESET: Clears selection & resets to page 1 when filters change
 * - AI EXTRACTION: Refreshes both leads and analytics after batch creation
 *
 * GOTCHAS:
 * - Search parameter doesn't sync to URL (only used internally)
 * - Selection clears when filters change (expected behavior)
 * - Analytics requires separate API call (not included in leads fetch)
 * - autoRefresh should be disabled in edit/detail views (prevents data loss)
 */

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useDebounce } from "@/hooks/use-debounce"

import { extractLeadsFromText, getLeadAnalytics, getLeads } from "./actions"
import { PAGINATION_OPTIONS } from "./constants"
import type { Lead, LeadAnalytics, LeadFilters } from "./types"
import type { AIExtractionInput } from "./validation"

interface UseLeadsOptions {
  initialLeads?: Lead[]
  initialFilters?: LeadFilters
  pageSize?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseLeadsReturn {
  // Data
  leads: Lead[]
  analytics: LeadAnalytics | null

  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  isExtracting: boolean

  // Filters & Pagination
  filters: LeadFilters
  setFilters: (filters: LeadFilters) => void
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  total: number

  // Selection
  selectedLeads: string[]
  setSelectedLeads: (ids: string[]) => void
  selectAll: () => void
  clearSelection: () => void

  // Actions
  refreshLeads: () => Promise<void>
  refreshAnalytics: () => Promise<void>
  extractFromText: (input: AIExtractionInput) => Promise<{
    success: boolean
    created?: number
    duplicates?: number
    error?: string
  }>

  // Computed
  hasFilters: boolean
  canLoadMore: boolean
}

export function useLeads(options: UseLeadsOptions = {}): UseLeadsReturn {
  const {
    initialLeads = [],
    initialFilters = {},
    pageSize: initialPageSize = PAGINATION_OPTIONS.DEFAULT_PAGE_SIZE,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options

  // State
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(!initialLeads.length)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [filters, setFilters] = useState<LeadFilters>(initialFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(initialLeads.length)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  // Debounce search filter - waits 300ms after user stops typing before refetching
  // Prevents API spam when user types quickly (e.g., "john smith" = 10 requests without debounce)
  const debouncedSearch = useDebounce(filters.search, 300)

  // Computed values
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  )
  const canLoadMore = useMemo(() => page < totalPages, [page, totalPages])
  const hasFilters = useMemo(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key as keyof LeadFilters]
      return value !== undefined && value !== "" && value !== null
    })
  }, [filters])

  // Fetch leads
  const fetchLeads = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const filtersWithSearch = {
          ...filters,
          search: debouncedSearch,
        }

        const response = await getLeads(filtersWithSearch, page, pageSize)

        if (response.success && response.data) {
          setLeads(response.data.leads)
          setTotal(response.data.pagination.total)
        } else if (!response.success) {
          console.error("[useLeads] Failed to fetch leads:", response.error)
        }
      } catch (error) {
        console.error("[useLeads] Error fetching leads:", error)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [filters, debouncedSearch, page, pageSize]
  )

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const result = await getLeadAnalytics()
      if (result.success && result.data) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error("[useLeads] Failed to fetch analytics:", error)
    }
  }, [])

  // Refresh functions
  const refreshLeads = useCallback(async () => {
    await fetchLeads(false)
  }, [fetchLeads])

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics()
  }, [fetchAnalytics])

  // Extract leads from text
  const extractFromText = useCallback(
    async (input: AIExtractionInput) => {
      setIsExtracting(true)

      try {
        const result = await extractLeadsFromText(input)

        if (result.success && result.data) {
          // Refresh leads list to show new entries
          await refreshLeads()
          await refreshAnalytics()

          return {
            success: true,
            created: result.data.created,
            duplicates: result.data.duplicates,
          }
        } else {
          return {
            success: false,
            error: !result.success ? result.error : "Extraction failed",
          }
        }
      } catch (error) {
        console.error("[useLeads] Extraction error:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Extraction failed",
        }
      } finally {
        setIsExtracting(false)
      }
    },
    [refreshLeads, refreshAnalytics]
  )

  // Selection helpers
  const selectAll = useCallback(() => {
    setSelectedLeads(leads.map((l) => l.id))
  }, [leads])

  const clearSelection = useCallback(() => {
    setSelectedLeads([])
  }, [])

  // Initial load - only if no initial data provided
  useEffect(() => {
    if (initialLeads.length === 0) {
      fetchLeads()
    }
    fetchAnalytics()
  }, [])

  // Refetch when page, pageSize, or search changes
  useEffect(() => {
    fetchLeads()
  }, [page, pageSize, debouncedSearch])

  // Auto-refresh with configurable polling interval
  // Disabled by default (autoRefresh = false) to prevent state thrashing during edit
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshLeads()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshLeads])

  // Clear selection when filters change - selected leads may not exist in filtered dataset
  useEffect(() => {
    clearSelection()
  }, [filters, clearSelection])

  // Reset page to 1 when filters change - prevents showing empty page after new filter reduces results
  useEffect(() => {
    setPage(1)
  }, [filters])

  return {
    // Data
    leads,
    analytics,

    // Loading states
    isLoading,
    isRefreshing,
    isExtracting,

    // Filters & Pagination
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,

    // Selection
    selectedLeads,
    setSelectedLeads,
    selectAll,
    clearSelection,

    // Actions
    refreshLeads,
    refreshAnalytics,
    extractFromText,

    // Computed
    hasFilters,
    canLoadMore,
  }
}

// Additional hooks for specific use cases

/**
 * Hook for managing a single lead
 */
export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLead = async () => {
      setIsLoading(true)
      try {
        const result = await getLeads({ search: id }, 1, 1)
        if (result.success && result.data && result.data.leads.length > 0) {
          setLead(result.data.leads[0])
        } else {
          setError("Lead not found")
        }
      } catch (err) {
        setError("Failed to fetch lead")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchLead()
    }
  }, [id])

  return { lead, isLoading, error }
}

/**
 * Hook for lead search suggestions
 */
export function useLeadSearch(query: string) {
  const [suggestions, setSuggestions] = useState<Lead[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([])
        return
      }

      setIsSearching(true)
      try {
        const result = await getLeads({ search: debouncedQuery }, 1, 5)
        if (result.success && result.data) {
          setSuggestions(result.data.leads)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error("[useLeadSearch] Search failed:", error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedQuery])

  return { suggestions, isSearching }
}
