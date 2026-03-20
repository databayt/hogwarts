// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useEffect, type RefObject } from "react"

import { SKIP_BACKWARD, SKIP_FORWARD } from "../constants"

interface UseMediaSessionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
}

export function useMediaSession({
  videoRef,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
}: UseMediaSessionOptions) {
  // Register action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return

    const video = videoRef.current
    if (!video) return

    navigator.mediaSession.setActionHandler("play", () => video.play())
    navigator.mediaSession.setActionHandler("pause", () => video.pause())
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      video.currentTime -= SKIP_BACKWARD
    })
    navigator.mediaSession.setActionHandler("seekforward", () => {
      video.currentTime += SKIP_FORWARD
    })
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) {
        video.currentTime = details.seekTime
      }
    })

    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("seekbackward", null)
      navigator.mediaSession.setActionHandler("seekforward", null)
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }, [videoRef])

  // Update playback state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
  }, [isPlaying])

  // Update position state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    if (duration > 0 && currentTime <= duration) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate,
        position: currentTime,
      })
    }
  }, [currentTime, duration, playbackRate])
}
