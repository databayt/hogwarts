"use client"

/**
 * Hook for proctoring functionality
 *
 * Manages:
 * - Security flag tracking
 * - Flag reporting to server
 * - Proctor mode enforcement
 * - Statistics aggregation
 */
import { useCallback, useRef, useState } from "react"
import type { ProctorMode } from "@prisma/client"

import { reportSecurityFlag } from "../actions"
import type { ProctorEventType, SecurityFlagEvent } from "../types"

// Map proctor events to security flags
const EVENT_TO_FLAG: Record<ProctorEventType, string | null> = {
  FOCUS_LOST: "FOCUS_LOST",
  FOCUS_RESTORED: null, // Don't report focus restored
  TAB_SWITCH: "TAB_SWITCH",
  COPY_ATTEMPT: "COPY_ATTEMPT",
  PASTE_ATTEMPT: "COPY_ATTEMPT", // Same category
  CONTEXT_MENU: null, // Don't report context menu
  PRINT_ATTEMPT: "COPY_ATTEMPT", // Same category
  SCREENSHOT_ATTEMPT: "COPY_ATTEMPT",
  DEVTOOLS_OPEN: "TIME_ANOMALY", // Map to time anomaly
}

interface UseProctorOptions {
  sessionId: string | null
  mode: ProctorMode
  maxWarnings?: number
  onMaxWarningsReached?: () => void
}

interface ProctorStats {
  focusLostCount: number
  tabSwitchCount: number
  copyAttempts: number
  totalFlags: number
}

export function useProctor({
  sessionId,
  mode,
  maxWarnings = 10,
  onMaxWarningsReached,
}: UseProctorOptions) {
  const [stats, setStats] = useState<ProctorStats>({
    focusLostCount: 0,
    tabSwitchCount: 0,
    copyAttempts: 0,
    totalFlags: 0,
  })
  const [flags, setFlags] = useState<SecurityFlagEvent[]>([])
  const reportingInProgress = useRef(new Set<string>())

  // Handle proctor event
  const handleEvent = useCallback(
    async (event: ProctorEventType, details?: string) => {
      if (mode === "NONE" || mode === "BASIC") return

      // Create flag event
      const flagEvent: SecurityFlagEvent = {
        flag: event as any,
        timestamp: new Date().toISOString(),
        details,
      }

      // Update local state
      setFlags((prev) => [...prev, flagEvent])

      // Update stats
      setStats((prev) => {
        const next = { ...prev, totalFlags: prev.totalFlags + 1 }
        if (event === "FOCUS_LOST") {
          next.focusLostCount = prev.focusLostCount + 1
        } else if (event === "TAB_SWITCH") {
          next.tabSwitchCount = prev.tabSwitchCount + 1
        } else if (
          event === "COPY_ATTEMPT" ||
          event === "PASTE_ATTEMPT" ||
          event === "PRINT_ATTEMPT"
        ) {
          next.copyAttempts = prev.copyAttempts + 1
        }
        return next
      })

      // Check max warnings
      if (stats.totalFlags + 1 >= maxWarnings) {
        onMaxWarningsReached?.()
      }

      // Report to server (if session exists and event should be reported)
      const flagToReport = EVENT_TO_FLAG[event]
      if (!sessionId || !flagToReport) return

      // Dedupe rapid-fire events
      const reportKey = `${event}-${Math.floor(Date.now() / 1000)}`
      if (reportingInProgress.current.has(reportKey)) return
      reportingInProgress.current.add(reportKey)

      try {
        await reportSecurityFlag({
          sessionId,
          flag: flagToReport as any,
          details,
        })
      } catch (error) {
        console.error("Failed to report security flag:", error)
      } finally {
        // Allow same event type after 1 second
        setTimeout(() => {
          reportingInProgress.current.delete(reportKey)
        }, 1000)
      }
    },
    [mode, sessionId, stats.totalFlags, maxWarnings, onMaxWarningsReached]
  )

  // Reset stats (e.g., for new session)
  const resetStats = useCallback(() => {
    setStats({
      focusLostCount: 0,
      tabSwitchCount: 0,
      copyAttempts: 0,
      totalFlags: 0,
    })
    setFlags([])
  }, [])

  // Check if mode requires active monitoring
  const isMonitoringActive = mode === "STANDARD" || mode === "STRICT"

  // Check if mode is strict
  const isStrictMode = mode === "STRICT"

  return {
    stats,
    flags,
    handleEvent,
    resetStats,
    isMonitoringActive,
    isStrictMode,
    mode,
  }
}
