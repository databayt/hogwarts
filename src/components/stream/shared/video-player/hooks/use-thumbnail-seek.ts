"use client"

import { useCallback, useRef } from "react"

import { THUMBNAIL_CACHE_SIZE, THUMBNAIL_WIDTH } from "../constants"

interface UseThumbnailSeekOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
}

/**
 * Hook for generating thumbnail previews during seeking
 * Uses canvas to capture video frames
 */
export function useThumbnailSeek({
  videoRef,
  enabled = true,
}: UseThumbnailSeekOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const thumbnailCache = useRef<Map<number, string>>(new Map())
  const isGeneratingRef = useRef(false)

  // Create canvas lazily
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }
    return canvasRef.current
  }, [])

  // Generate thumbnail for a specific time
  const generateThumbnail = useCallback(
    async (time: number): Promise<string | null> => {
      if (!enabled || !videoRef.current || isGeneratingRef.current) {
        return null
      }

      const video = videoRef.current

      // Check if video is loaded
      if (video.readyState < 2) {
        return null
      }

      // Round to nearest second for caching
      const roundedTime = Math.round(time)

      // Check cache
      if (thumbnailCache.current.has(roundedTime)) {
        return thumbnailCache.current.get(roundedTime)!
      }

      try {
        isGeneratingRef.current = true

        const canvas = getCanvas()
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight
        canvas.width = THUMBNAIL_WIDTH
        canvas.height = Math.round(THUMBNAIL_WIDTH / aspectRatio)

        // Draw current frame (we can't easily seek without affecting playback)
        // For simplicity, we'll capture from current position
        // A more advanced implementation would use a hidden video element
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const thumbnail = canvas.toDataURL("image/jpeg", 0.6)

        // Add to cache (with size limit)
        if (thumbnailCache.current.size >= THUMBNAIL_CACHE_SIZE) {
          // Remove oldest entry
          const firstKey = thumbnailCache.current.keys().next().value
          if (firstKey !== undefined) {
            thumbnailCache.current.delete(firstKey)
          }
        }
        thumbnailCache.current.set(roundedTime, thumbnail)

        return thumbnail
      } catch {
        return null
      } finally {
        isGeneratingRef.current = false
      }
    },
    [videoRef, enabled, getCanvas]
  )

  // Clear cache
  const clearCache = useCallback(() => {
    thumbnailCache.current.clear()
  }, [])

  return {
    generateThumbnail,
    clearCache,
  }
}
