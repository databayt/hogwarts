"use client"

/**
 * Exam Timer Component
 *
 * Countdown timer with:
 * - Visual countdown display
 * - Color-coded urgency (green -> yellow -> red)
 * - 5-minute warning callback
 * - Auto-submit on expiry
 * - Pause/resume support (for PAUSED session status)
 */
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Clock, Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ExamTimerProps {
  /** Total duration in minutes */
  duration: number
  /** Start time of the exam session */
  startedAt: Date | null
  /** Whether the timer is paused */
  isPaused?: boolean
  /** Callback when time runs out */
  onTimeUp: () => void
  /** Callback when 5 minutes remaining */
  onWarning?: () => void
  /** Additional class name */
  className?: string
}

export function ExamTimer({
  duration,
  startedAt,
  isPaused = false,
  onTimeUp,
  onWarning,
  className,
}: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if (!startedAt) return duration * 60
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    return Math.max(0, duration * 60 - elapsed)
  })
  const warningShown = useRef(false)
  const timeUpCalled = useRef(false)

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Determine urgency level for styling
  const getUrgencyLevel = useCallback(
    (seconds: number): "normal" | "warning" | "critical" => {
      if (seconds <= 60) return "critical" // Last minute
      if (seconds <= 300) return "warning" // Last 5 minutes
      return "normal"
    },
    []
  )

  // Timer effect
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        // Trigger warning at 5 minutes
        if (newTime === 300 && !warningShown.current) {
          warningShown.current = true
          onWarning?.()
        }

        // Trigger time up
        if (newTime <= 0 && !timeUpCalled.current) {
          timeUpCalled.current = true
          clearInterval(interval)
          onTimeUp()
          return 0
        }

        return Math.max(0, newTime)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, onTimeUp, onWarning])

  // Sync with server time on mount
  useEffect(() => {
    if (!startedAt) return
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    setTimeRemaining(Math.max(0, duration * 60 - elapsed))
  }, [startedAt, duration])

  const urgency = getUrgencyLevel(timeRemaining)

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 font-mono transition-colors",
        urgency === "normal" && "bg-muted text-foreground",
        urgency === "warning" &&
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
        urgency === "critical" &&
          "bg-destructive/10 text-destructive animate-pulse",
        className
      )}
    >
      {urgency === "critical" ? (
        <AlertTriangle className="h-5 w-5" />
      ) : isPaused ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}

      <span className="text-lg font-semibold tabular-nums">
        {formatTime(timeRemaining)}
      </span>

      {isPaused && (
        <Badge variant="secondary" className="ml-2">
          Paused
        </Badge>
      )}

      {urgency === "critical" && !isPaused && (
        <Badge variant="destructive" className="ml-2">
          Hurry!
        </Badge>
      )}
    </div>
  )
}

/**
 * Compact timer for mobile/header
 */
export function CompactTimer({
  duration,
  startedAt,
  isPaused = false,
  onTimeUp,
  onWarning,
  className,
}: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if (!startedAt) return duration * 60
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    return Math.max(0, duration * 60 - elapsed)
  })
  const timeUpCalled = useRef(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        if (newTime <= 0 && !timeUpCalled.current) {
          timeUpCalled.current = true
          clearInterval(interval)
          onTimeUp()
          return 0
        }
        return Math.max(0, newTime)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, onTimeUp])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const isCritical = timeRemaining <= 300

  return (
    <span
      className={cn(
        "font-mono text-sm font-medium tabular-nums",
        isCritical && "text-destructive",
        className
      )}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  )
}
