"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseVideoScrollControlOptions {
  /** Intersection Observer threshold (0-1). Default: 0.5 */
  threshold?: number
  /** Fade-in duration in ms. Default: 500 */
  fadeInDuration?: number
  /** Fade-out duration in ms. Default: 300 */
  fadeOutDuration?: number
  /** Auto-pause when out of view. Default: true */
  autoPause?: boolean
  /** Enable audio control. Default: true */
  enableAudio?: boolean
}

interface UseVideoScrollControlReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Ref to attach to the video element */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Whether video is currently in view */
  isInView: boolean
  /** Current muted state */
  isMuted: boolean
  /** Current volume (0-1) */
  volume: number
  /** Toggle mute state (for user interaction) */
  toggleMute: () => void
  /** Whether user has enabled audio */
  userEnabledAudio: boolean
}

/**
 * Hook for scroll-based video control with smooth volume transitions.
 *
 * Features:
 * - Auto-play/pause based on visibility
 * - Smooth volume fade in/out with easing
 * - Handles fast scrolling gracefully
 * - User-controlled mute toggle (required for browser autoplay policy)
 */
export function useVideoScrollControl(
  options: UseVideoScrollControlOptions = {}
): UseVideoScrollControlReturn {
  const {
    threshold = 0.5,
    fadeInDuration = 500,
    fadeOutDuration = 300,
    autoPause = true,
    enableAudio = true,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startVolumeRef = useRef<number>(0)

  const [isInView, setIsInView] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(0)
  const [userEnabledAudio, setUserEnabledAudio] = useState(false)

  // Easing functions
  const easeOut = useCallback((t: number) => 1 - Math.pow(1 - t, 3), [])
  const easeIn = useCallback((t: number) => Math.pow(t, 3), [])

  // Cancel any running animation
  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    startTimeRef.current = null
  }, [])

  // Animate volume change
  const animateVolume = useCallback(
    (targetVolume: number, duration: number, easingFn: (t: number) => number) => {
      cancelAnimation()

      if (!videoRef.current) return

      const video = videoRef.current
      const startVolume = video.volume
      startVolumeRef.current = startVolume

      // If we're already at the target, no need to animate
      if (Math.abs(startVolume - targetVolume) < 0.01) {
        video.volume = targetVolume
        setVolume(targetVolume)
        if (targetVolume === 0) {
          video.muted = true
          setIsMuted(true)
        }
        return
      }

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp
        }

        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easingFn(progress)

        const newVolume = startVolume + (targetVolume - startVolume) * easedProgress

        if (videoRef.current) {
          videoRef.current.volume = Math.max(0, Math.min(1, newVolume))
          setVolume(newVolume)
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          animationRef.current = null
          startTimeRef.current = null

          if (videoRef.current && targetVolume === 0) {
            videoRef.current.muted = true
            setIsMuted(true)
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [cancelAnimation]
  )

  // Toggle mute (user interaction - required for browser autoplay policy)
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      // User wants to unmute
      setUserEnabledAudio(true)
      video.muted = false
      setIsMuted(false)
      video.volume = 0
      animateVolume(1, fadeInDuration, easeOut)
    } else {
      // User wants to mute
      animateVolume(0, fadeOutDuration, easeIn)
    }
  }, [isMuted, animateVolume, fadeInDuration, fadeOutDuration, easeIn, easeOut])

  // Intersection Observer setup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      cancelAnimation()
    }
  }, [threshold, cancelAnimation])

  // Handle visibility changes - play/pause and volume transitions
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isInView) {
      // Always start muted for autoplay to work (browser requirement)
      video.muted = true

      // Play video when in view
      video.play().then(() => {
        // After play starts successfully, handle audio
        if (enableAudio && userEnabledAudio) {
          // User has previously enabled audio, so unmute and fade in
          video.muted = false
          setIsMuted(false)
          video.volume = 0
          animateVolume(1, fadeInDuration, easeOut)
        } else {
          // Keep muted, user needs to click to enable audio
          setIsMuted(true)
        }
      }).catch(() => {
        // Autoplay blocked - that's ok, video just won't play
      })
    } else {
      // Fade out audio when leaving view
      if (enableAudio && userEnabledAudio && !isMuted) {
        animateVolume(0, fadeOutDuration, easeIn)
      }

      // Pause video when out of view
      if (autoPause) {
        video.pause()
      }
    }
  }, [isInView, enableAudio, autoPause, userEnabledAudio, fadeInDuration, fadeOutDuration, animateVolume, easeIn, easeOut, isMuted])

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimation()
  }, [cancelAnimation])

  return {
    containerRef,
    videoRef,
    isInView,
    isMuted,
    volume,
    toggleMute,
    userEnabledAudio,
  }
}
