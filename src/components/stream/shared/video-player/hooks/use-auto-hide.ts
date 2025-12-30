"use client"

import { useCallback, useEffect, useRef } from "react"

import { CONTROLS_HIDE_DELAY } from "../constants"

interface UseAutoHideOptions {
  isPlaying: boolean
  showControls: () => void
  hideControls: () => void
  delay?: number
}

export function useAutoHide({
  isPlaying,
  showControls,
  hideControls,
  delay = CONTROLS_HIDE_DELAY,
}: UseAutoHideOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    showControls()

    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        hideControls()
      }, delay)
    }
  }, [isPlaying, showControls, hideControls, delay])

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

  // Reset timer when playing state changes
  useEffect(() => {
    if (isPlaying) {
      resetTimer()
    } else {
      showControls()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isPlaying, resetTimer, showControls])

  return {
    handleMouseMove,
    handleMouseLeave,
  }
}
