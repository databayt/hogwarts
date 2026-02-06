/**
 * Client-side video metadata extraction
 *
 * Uses the browser's <video> element to extract:
 * - Duration
 * - Resolution (width x height)
 * - Thumbnail (JPEG of frame at 25% duration)
 *
 * No server-side processing or third-party services needed.
 */

export interface VideoMetadata {
  duration: number // seconds
  width: number // pixels
  height: number // pixels
  thumbnailDataUrl: string // base64 JPEG
}

/**
 * Extract metadata from a video File using a hidden <video> element
 *
 * @param file - Video file (mp4, webm, etc.)
 * @returns Metadata including duration, resolution, and thumbnail
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)

    // Cleanup helper
    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.remove()
    }

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error("Video metadata extraction timed out"))
    }, 30_000)

    video.preload = "metadata"
    video.muted = true
    video.playsInline = true
    video.src = url

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration
      const width = video.videoWidth
      const height = video.videoHeight

      if (!duration || !width || !height) {
        clearTimeout(timeout)
        cleanup()
        reject(new Error("Could not extract video metadata"))
        return
      }

      // Seek to 25% of duration for a better thumbnail (first frame is often black)
      video.currentTime = Math.min(duration * 0.25, 10)
    })

    video.addEventListener("seeked", () => {
      clearTimeout(timeout)

      try {
        // Draw frame to canvas
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          cleanup()
          reject(new Error("Could not create canvas context"))
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Generate thumbnail as JPEG (quality 0.7 for good size/quality balance)
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.7)

        cleanup()
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          thumbnailDataUrl,
        })
      } catch (err) {
        cleanup()
        reject(err)
      }
    })

    video.addEventListener("error", () => {
      clearTimeout(timeout)
      cleanup()
      reject(new Error("Failed to load video for metadata extraction"))
    })
  })
}

/**
 * Convert a data URL to a Blob for uploading
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg"
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}

/**
 * Format duration in seconds to human-readable string
 * e.g. 3661 → "1h 1m 1s", 125 → "2m 5s", 45 → "0m 45s"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

/**
 * Format resolution to human-readable string
 * e.g. 1920x1080 → "1080p", 1280x720 → "720p", 3840x2160 → "4K"
 */
export function formatResolution(width: number, height: number): string {
  if (height >= 2160) return "4K"
  if (height >= 1440) return "1440p"
  if (height >= 1080) return "1080p"
  if (height >= 720) return "720p"
  if (height >= 480) return "480p"
  return `${width}x${height}`
}
