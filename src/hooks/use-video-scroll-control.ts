"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseVideoScrollControlOptions {
  /** Minimum visibility ratio to start playing (0-1). Default: 0.2 */
  playThreshold?: number
  /** Visibility ratio for full volume (0-1). Default: 0.6 */
  fullVolumeThreshold?: number
  /** Target volume when fully visible (0-1). Default: 0.7 */
  targetVolume?: number
  /** Enable progressive volume based on visibility. Default: true */
  progressiveVolume?: boolean
}

interface UseVideoScrollControlReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  isInView: boolean
  isMuted: boolean
  visibilityRatio: number
}

/**
 * Optimized video scroll control with smooth progressive transitions.
 *
 * Features:
 * - Progressive play/pause based on intersection ratio
 * - Gradual volume transition as element enters/exits viewport
 * - Ease-in-out animations for smooth experience
 * - Auto-loop with intelligent pause when out of view
 * - Higher resolution playback quality hints
 */
export function useVideoScrollControl(
  options: UseVideoScrollControlOptions = {}
): UseVideoScrollControlReturn {
  const {
    playThreshold = 0.2,
    fullVolumeThreshold = 0.6,
    targetVolume = 0.7,
    progressiveVolume = true,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const volumeAnimationRef = useRef<number | null>(null)
  const targetVolumeRef = useRef<number>(0)
  const hasUserInteracted = useRef(false)
  const playPromiseRef = useRef<Promise<void> | null>(null)

  const [isInView, setIsInView] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [visibilityRatio, setVisibilityRatio] = useState(0)

  // Cancel volume animation
  const cancelVolumeAnimation = useCallback(() => {
    if (volumeAnimationRef.current !== null) {
      cancelAnimationFrame(volumeAnimationRef.current)
      volumeAnimationRef.current = null
    }
  }, [])

  // Smooth volume animation with ease-in-out
  const animateToVolume = useCallback(
    (video: HTMLVideoElement, to: number, duration: number = 400) => {
      cancelVolumeAnimation()

      const from = video.volume
      if (Math.abs(from - to) < 0.01) {
        video.volume = to
        return
      }

      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease-in-out cubic for smooth transitions
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2

        const currentVolume = from + (to - from) * eased
        video.volume = Math.max(0, Math.min(1, currentVolume))

        if (progress < 1) {
          volumeAnimationRef.current = requestAnimationFrame(animate)
        } else {
          volumeAnimationRef.current = null
          video.volume = to

          // Mute when volume reaches 0
          if (to === 0 && !video.muted) {
            video.muted = true
            setIsMuted(true)
          }
        }
      }

      volumeAnimationRef.current = requestAnimationFrame(animate)
    },
    [cancelVolumeAnimation]
  )

  // Calculate volume based on visibility ratio
  const calculateVolume = useCallback(
    (ratio: number): number => {
      if (ratio <= playThreshold) return 0
      if (ratio >= fullVolumeThreshold) return targetVolume

      // Progressive volume between thresholds
      const normalizedRatio =
        (ratio - playThreshold) / (fullVolumeThreshold - playThreshold)
      return normalizedRatio * targetVolume
    },
    [playThreshold, fullVolumeThreshold, targetVolume]
  )

  // Safe play with promise handling
  const safePlay = useCallback((video: HTMLVideoElement) => {
    if (playPromiseRef.current) return

    playPromiseRef.current = video.play()
    playPromiseRef.current
      .then(() => {
        playPromiseRef.current = null
      })
      .catch(() => {
        playPromiseRef.current = null
      })
  }, [])

  // Safe pause with promise handling
  const safePause = useCallback((video: HTMLVideoElement) => {
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          video.pause()
          playPromiseRef.current = null
        })
        .catch(() => {
          playPromiseRef.current = null
        })
    } else {
      video.pause()
    }
  }, [])

  // Track user interaction (required for autoplay with sound)
  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteracted.current = true

      const video = videoRef.current
      if (video && isInView && video.muted && targetVolume > 0) {
        video.muted = false
        video.volume = 0
        setIsMuted(false)

        const newVolume = progressiveVolume
          ? calculateVolume(visibilityRatio)
          : targetVolume
        animateToVolume(video, newVolume, 600)
      }
    }

    window.addEventListener("click", handleInteraction, { once: true })
    window.addEventListener("scroll", handleInteraction, { once: true })
    window.addEventListener("touchstart", handleInteraction, { once: true })

    return () => {
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("scroll", handleInteraction)
      window.removeEventListener("touchstart", handleInteraction)
    }
  }, [
    isInView,
    visibilityRatio,
    targetVolume,
    progressiveVolume,
    calculateVolume,
    animateToVolume,
  ])

  // Progressive Intersection Observer with multiple thresholds
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create thresholds from 0 to 1 in 0.05 increments for smooth transitions
    const thresholds = Array.from({ length: 21 }, (_, i) => i * 0.05)

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio
        setVisibilityRatio(ratio)
        setIsInView(ratio >= playThreshold)

        const video = videoRef.current
        if (!video) return

        // Handle play/pause based on visibility
        if (ratio >= playThreshold) {
          safePlay(video)

          // Handle progressive volume
          if (hasUserInteracted.current && progressiveVolume) {
            const newVolume = calculateVolume(ratio)

            if (video.muted && newVolume > 0) {
              video.muted = false
              video.volume = 0
              setIsMuted(false)
            }

            targetVolumeRef.current = newVolume
            animateToVolume(video, newVolume, 200)
          }
        } else {
          // Fade out volume smoothly before pausing
          if (!video.muted && video.volume > 0) {
            animateToVolume(video, 0, 300)
            setTimeout(() => safePause(video), 300)
          } else {
            safePause(video)
          }
        }
      },
      { threshold: thresholds }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      cancelVolumeAnimation()
    }
  }, [
    playThreshold,
    progressiveVolume,
    calculateVolume,
    animateToVolume,
    safePlay,
    safePause,
    cancelVolumeAnimation,
  ])

  // Set video quality hints on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Hint for higher quality playback
    video.preload = "auto"

    // Request picture-in-picture if available for better rendering
    if ("playsInline" in video) {
      video.playsInline = true
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => cancelVolumeAnimation()
  }, [cancelVolumeAnimation])

  return {
    containerRef,
    videoRef,
    isInView,
    isMuted,
    visibilityRatio,
  }
}
