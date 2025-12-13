"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseVideoScrollControlOptions {
  /** Intersection Observer threshold (0-1). Default: 0.4 */
  threshold?: number
  /** Fade-in duration in ms. Default: 600 */
  fadeInDuration?: number
  /** Fade-out duration in ms. Default: 300 */
  fadeOutDuration?: number
  /** Target volume when unmuted (0-1). Default: 0.7 */
  targetVolume?: number
}

interface UseVideoScrollControlReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  isInView: boolean
  isMuted: boolean
}

/**
 * Video scroll control with automatic sound based on visibility.
 *
 * - Auto-plays when in view
 * - Auto-pauses when out of view
 * - Auto-unmutes with fade-in when in view (after user interaction)
 * - Auto-mutes with fade-out when out of view
 */
export function useVideoScrollControl(
  options: UseVideoScrollControlOptions = {}
): UseVideoScrollControlReturn {
  const {
    threshold = 0.4,
    fadeInDuration = 600,
    fadeOutDuration = 300,
    targetVolume = 0.7,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const hasUserInteracted = useRef(false)

  const [isInView, setIsInView] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  // Cancel animation
  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  // Smooth volume transition
  const animateVolume = useCallback(
    (video: HTMLVideoElement, from: number, to: number, duration: number, onComplete?: () => void) => {
      cancelAnimation()

      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const currentVolume = from + (to - from) * eased

        video.volume = Math.max(0, Math.min(1, currentVolume))

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          animationRef.current = null
          onComplete?.()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [cancelAnimation]
  )

  // Track user interaction (required for autoplay with sound)
  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteracted.current = true
      // Try to unmute if video is in view
      const video = videoRef.current
      if (video && isInView && video.muted && targetVolume > 0) {
        video.muted = false
        video.volume = 0
        setIsMuted(false)
        animateVolume(video, 0, targetVolume, fadeInDuration)
      }
    }

    // Listen for any user interaction
    window.addEventListener("click", handleInteraction, { once: true })
    window.addEventListener("scroll", handleInteraction, { once: true })
    window.addEventListener("touchstart", handleInteraction, { once: true })

    return () => {
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("scroll", handleInteraction)
      window.removeEventListener("touchstart", handleInteraction)
    }
  }, [isInView, targetVolume, fadeInDuration, animateVolume])

  // Intersection Observer
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

  // Handle play/pause and sound based on visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isInView) {
      // Video is in view - play and unmute (if user has interacted)
      video.play().catch(() => {
        // Autoplay blocked
      })

      // Auto-unmute with fade-in if user has interacted
      if (hasUserInteracted.current && video.muted && targetVolume > 0) {
        video.muted = false
        video.volume = 0
        setIsMuted(false)
        animateVolume(video, 0, targetVolume, fadeInDuration)
      }
    } else {
      // Video is out of view - mute and pause
      if (!video.muted && targetVolume > 0) {
        // Fade out audio then pause
        animateVolume(video, video.volume, 0, fadeOutDuration, () => {
          video.muted = true
          setIsMuted(true)
          video.pause()
        })
      } else {
        video.pause()
      }
    }
  }, [isInView, targetVolume, fadeInDuration, fadeOutDuration, animateVolume])

  // Cleanup
  useEffect(() => {
    return () => cancelAnimation()
  }, [cancelAnimation])

  return {
    containerRef,
    videoRef,
    isInView,
    isMuted,
  }
}
