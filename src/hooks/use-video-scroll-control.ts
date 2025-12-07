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
}

/**
 * Hook for scroll-based video control with smooth volume transitions.
 *
 * Features:
 * - Auto-play/pause based on visibility
 * - Smooth volume fade in/out with easing
 * - Handles fast scrolling gracefully
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

  // Easing functions
  // Ease-out: fast start, slow end (for fade-in - feels welcoming)
  const easeOut = useCallback((t: number) => 1 - Math.pow(1 - t, 3), [])

  // Ease-in: slow start, fast end (for fade-out - avoids lingering)
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
          // Animation complete
          animationRef.current = null
          startTimeRef.current = null

          // Update muted state when animation completes
          if (videoRef.current) {
            if (targetVolume === 0) {
              videoRef.current.muted = true
              setIsMuted(true)
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [cancelAnimation]
  )

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
      // Play video when in view
      video.play().catch(() => {
        // Autoplay may be blocked - that's ok
      })

      // Fade in audio
      if (enableAudio) {
        // Unmute first so we can control volume
        video.muted = false
        setIsMuted(false)
        animateVolume(1, fadeInDuration, easeOut)
      }
    } else {
      // Pause video when out of view
      if (autoPause) {
        video.pause()
      }

      // Fade out audio
      if (enableAudio) {
        animateVolume(0, fadeOutDuration, easeIn)
      }
    }
  }, [isInView, enableAudio, autoPause, fadeInDuration, fadeOutDuration, animateVolume, easeIn, easeOut])

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
  }
}
