"use client"

import { useCallback, useEffect, useRef } from "react"

import {
  END_THRESHOLD,
  getProgressKey,
  INTRO_SKIP_THRESHOLD,
  PROGRESS_SAVE_INTERVAL,
  REWIND_BUFFER,
} from "../constants"

interface ProgressData {
  lessonId: string
  position: number
  duration: number
  updatedAt: number
  completed: boolean
}

interface UseVideoProgressOptions {
  lessonId: string
  duration: number
  currentTime: number
  isPlaying: boolean
  onSaveProgress?: (watchedSeconds: number, totalSeconds: number) => void
}

/**
 * Hook for managing video progress - save to localStorage and sync to server
 */
export function useVideoProgress({
  lessonId,
  duration,
  currentTime,
  isPlaying,
  onSaveProgress,
}: UseVideoProgressOptions) {
  const lastSaveTimeRef = useRef<number>(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Save progress to localStorage
  const saveToLocal = useCallback(
    (position: number) => {
      if (!lessonId || duration <= 0) return

      const data: ProgressData = {
        lessonId,
        position: Math.floor(position),
        duration: Math.floor(duration),
        updatedAt: Date.now(),
        completed: position >= duration - END_THRESHOLD,
      }

      try {
        localStorage.setItem(getProgressKey(lessonId), JSON.stringify(data))
      } catch {
        // localStorage might be full or disabled
        console.warn("Failed to save video progress to localStorage")
      }
    },
    [lessonId, duration]
  )

  // Get resume position from localStorage
  const getResumePosition = useCallback((): number => {
    if (!lessonId) return 0

    try {
      const stored = localStorage.getItem(getProgressKey(lessonId))
      if (!stored) return 0

      const data: ProgressData = JSON.parse(stored)

      // If lesson ID doesn't match, start from beginning
      if (data.lessonId !== lessonId) return 0

      // Calculate resume position with thresholds
      return calculateResumePosition(data.position, data.duration)
    } catch {
      return 0
    }
  }, [lessonId])

  // Debounced server sync
  const syncToServer = useCallback(
    (position: number) => {
      if (!onSaveProgress || duration <= 0) return

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce server calls by 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        onSaveProgress(Math.floor(position), Math.floor(duration))
      }, 2000)
    },
    [onSaveProgress, duration]
  )

  // Save progress (called during playback)
  const saveProgress = useCallback(
    (position: number) => {
      // Always save to local immediately
      saveToLocal(position)

      // Sync to server (debounced)
      syncToServer(position)

      lastSaveTimeRef.current = Date.now()
    },
    [saveToLocal, syncToServer]
  )

  // Throttled save during playback (every PROGRESS_SAVE_INTERVAL)
  useEffect(() => {
    if (!isPlaying || duration <= 0) return

    const interval = setInterval(() => {
      if (currentTime > 0) {
        saveProgress(currentTime)
      }
    }, PROGRESS_SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [isPlaying, currentTime, duration, saveProgress])

  // Save on pause
  const onPause = useCallback(() => {
    if (currentTime > 0) {
      saveProgress(currentTime)
    }
  }, [currentTime, saveProgress])

  // Save on visibility change (tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentTime > 0) {
        saveProgress(currentTime)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [currentTime, saveProgress])

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTime > 0 && duration > 0) {
        // Use sendBeacon for reliable delivery
        const data: ProgressData = {
          lessonId,
          position: Math.floor(currentTime),
          duration: Math.floor(duration),
          updatedAt: Date.now(),
          completed: currentTime >= duration - END_THRESHOLD,
        }

        // Save to localStorage as backup
        try {
          localStorage.setItem(getProgressKey(lessonId), JSON.stringify(data))
        } catch {
          // Ignore
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [lessonId, currentTime, duration])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    getResumePosition,
    saveProgress,
    onPause,
  }
}

/**
 * Calculate the resume position with thresholds
 */
function calculateResumePosition(saved: number, duration: number): number {
  // If saved position is within first 15 seconds, start from beginning
  if (saved < INTRO_SKIP_THRESHOLD) {
    return 0
  }

  // If saved position is within 30 seconds of end, consider completed
  if (saved >= duration - END_THRESHOLD) {
    return 0 // Start fresh
  }

  // Otherwise, resume from saved position minus 5 seconds for context
  return Math.max(0, saved - REWIND_BUFFER)
}
