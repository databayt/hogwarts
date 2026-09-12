"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef } from "react"

import { CONTROLS_HIDE_DELAY } from "../constants"

interface UseAutoHideOptions {
  isPlaying: boolean
  showControls: () => void
  hideControls: () => void
  delay?: number
  /**
   * Keep the controls up regardless of the timer — an open menu.
   *
   * The timer only runs while something is playing, and on a pointer device
   * the reader's own mouse keeps resetting it, so nothing here mattered until
   * the phone layout put a seven-row menu behind one of the controls: with no
   * mouse to move, the card a reader was mid-way through vanished after three
   * seconds. The live room's own `useAutoHide(pinned)` takes the same flag.
   */
  hold?: boolean
}

export function useAutoHide({
  isPlaying,
  showControls,
  hideControls,
  delay = CONTROLS_HIDE_DELAY,
  hold = false,
}: UseAutoHideOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    showControls()

    if (isPlaying && !hold) {
      timeoutRef.current = setTimeout(() => {
        hideControls()
      }, delay)
    }
  }, [isPlaying, hold, showControls, hideControls, delay])

  const handleMouseMove = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      hideControls()
    }
  }, [isPlaying, hideControls])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Reset timer when playing state changes — or when a menu takes/releases
  // the hold, which is what restarts the countdown after one closes.
  useEffect(() => {
    if (isPlaying && !hold) {
      resetTimer()
    } else {
      showControls()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isPlaying, hold, resetTimer, showControls])

  return {
    handleMouseMove,
    handleMouseLeave,
  }
}
