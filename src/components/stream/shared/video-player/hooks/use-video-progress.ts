"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
  // Mirror currentTime into a ref so the periodic-save interval can read the
  // latest position WITHOUT currentTime being in its deps (which would tear
  // down and recreate the interval several times per second — the reason
  // mid-playback saves never fired).
  const currentTimeRef = useRef<number>(currentTime)
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])
  // Same mirror for duration — keeps the beforeunload handler off the
  // currentTime/duration deps (which tick ~4×/sec during playback).
  const durationRef = useRef<number>(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])

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

  // Immediate (non-debounced) save — used when the user is leaving the player
  // (pause, tab hidden) so the final position reliably reaches the server
  // instead of being dropped by the 2s debounce when the tab closes.
  const flushProgress = useCallback(
    (position: number) => {
      saveToLocal(position)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      if (onSaveProgress && duration > 0 && position > 0) {
        onSaveProgress(Math.floor(position), Math.floor(duration))
      }
      lastSaveTimeRef.current = Date.now()
    },
    [saveToLocal, onSaveProgress, duration]
  )

  // Keep the latest saveProgress in a ref so the interval below never needs it
  // (or currentTime) in its deps — the interval should run uninterrupted for
  // the whole playing session.
  const saveProgressRef = useRef(saveProgress)
  useEffect(() => {
    saveProgressRef.current = saveProgress
  }, [saveProgress])

  // Periodic save during playback (every PROGRESS_SAVE_INTERVAL). Deps are only
  // [isPlaying, duration] so the timer is created ONCE per play session and
  // reads the live position from the ref.
  useEffect(() => {
    if (!isPlaying || duration <= 0) return

    const interval = setInterval(() => {
      const t = currentTimeRef.current
      if (t > 0) {
        saveProgressRef.current(t)
      }
    }, PROGRESS_SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [isPlaying, duration])

  // Save on pause (immediate flush to server)
  const onPause = useCallback(() => {
    if (currentTimeRef.current > 0) {
      flushProgress(currentTimeRef.current)
    }
  }, [flushProgress])

  // Save on visibility change (tab hidden) — immediate flush, since a debounced
  // save would not fire if the tab is being closed.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentTimeRef.current > 0) {
        flushProgress(currentTimeRef.current)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [flushProgress])

  // Save on beforeunload — reads position/duration from refs so the listener
  // is installed once per lesson, not re-bound on every timeupdate tick.
  useEffect(() => {
    const handleBeforeUnload = () => {
      const t = currentTimeRef.current
      const d = durationRef.current
      if (t > 0 && d > 0) {
        const data: ProgressData = {
          lessonId,
          position: Math.floor(t),
          duration: Math.floor(d),
          updatedAt: Date.now(),
          completed: t >= d - END_THRESHOLD,
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
  }, [lessonId])

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
