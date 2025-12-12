"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseVideoScrollControlOptions {
  /** Intersection Observer threshold (0-1). Default: 0.5 */
  threshold?: number
  /** Fade-in duration in ms. Default: 500 */
  fadeInDuration?: number
  /** Fade-out duration in ms. Default: 300 */
  fadeOutDuration?: number
  /** Target volume when unmuted (0-1). Default: 1 */
  targetVolume?: number
}

interface UseVideoScrollControlReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  isInView: boolean
  isMuted: boolean
}

/**
 * Pure video scroll control - no UI needed.
 *
 * - Auto-plays with sound when in view
 * - Auto-pauses and mutes when out of view
 * - Smooth volume transitions
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

  // Track any user interaction on the page
  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteracted.current = true
    }

    // These events indicate user interaction
    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })
    window.addEventListener('scroll', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
    }
  }, [])

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

  // Handle play/pause and audio based on visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isInView) {
      // Video is in view - play

      // Start muted for autoplay to work
      video.muted = true
      video.volume = 0

      video.play().then(() => {
        // Play succeeded
        // If targetVolume > 0, try to unmute with fade-in
        if (targetVolume > 0) {
          try {
            video.muted = false
            setIsMuted(false)
            animateVolume(video, 0, targetVolume, fadeInDuration)
          } catch {
            // Browser blocked unmute - stay muted
            video.muted = true
            setIsMuted(true)
          }
        }
        // If targetVolume is 0, keep muted (don't try to unmute)
      }).catch(() => {
        // Autoplay blocked entirely
      })
    } else {
      // Video is out of view - fade out and pause

      if (!video.paused && !video.muted && targetVolume > 0) {
        // Fade out audio then pause
        animateVolume(video, video.volume, 0, fadeOutDuration, () => {
          video.muted = true
          setIsMuted(true)
          video.pause()
        })
      } else {
        // Already muted or paused, just pause
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
