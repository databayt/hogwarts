"use client"

import { useCallback, useEffect, useRef } from "react"

export interface UseAutoRefreshOptions {
  /** Whether auto-refresh is enabled */
  enabled?: boolean
  /** Refresh interval in milliseconds */
  interval?: number
  /** Callback to execute on refresh */
  onRefresh: () => void | Promise<void>
  /** Callback when refresh fails */
  onError?: (error: Error) => void
  /** Whether to refresh immediately on mount */
  refreshOnMount?: boolean
  /** Whether to pause on window blur */
  pauseOnBlur?: boolean
}

export interface UseAutoRefreshReturn {
  /** Manually trigger refresh */
  refresh: () => Promise<void>
  /** Start auto-refresh */
  start: () => void
  /** Stop auto-refresh */
  stop: () => void
  /** Check if auto-refresh is running */
  isRunning: boolean
}

/**
 * Hook for managing auto-refresh functionality
 */
export function useAutoRefresh({
  enabled = true,
  interval = 30000,
  onRefresh,
  onError,
  refreshOnMount = false,
  pauseOnBlur = true,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      await onRefresh()
    } catch (error) {
      onError?.(error as Error)
    }
  }, [onRefresh, onError])

  const start = useCallback(() => {
    if (intervalRef.current || !enabled) return

    isRunningRef.current = true
    intervalRef.current = setInterval(() => {
      refresh()
    }, interval)
  }, [enabled, interval, refresh])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      isRunningRef.current = false
    }
  }, [])

  // Handle window focus/blur
  useEffect(() => {
    if (!pauseOnBlur || !enabled) return

    const handleFocus = () => {
      if (isRunningRef.current) {
        start()
      }
    }

    const handleBlur = () => {
      stop()
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [enabled, pauseOnBlur, start, stop])

  // Start/stop based on enabled state
  useEffect(() => {
    if (enabled) {
      start()
      if (refreshOnMount) {
        refresh()
      }
    } else {
      stop()
    }

    return () => {
      stop()
    }
  }, [enabled, start, stop, refresh, refreshOnMount])

  return {
    refresh,
    start,
    stop,
    isRunning: isRunningRef.current,
  }
}
