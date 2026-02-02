/**
 * URL validation utilities for Stream module
 */

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".avi",
  ".mkv",
  ".m4v",
]
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
]
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"]

// Common video hosting patterns
const VIDEO_HOSTING_PATTERNS = [
  /youtube\.com\/watch/i,
  /youtu\.be\//i,
  /vimeo\.com\//i,
  /wistia\.com\//i,
  /loom\.com\//i,
  /cloudflare\.com.*\/video/i,
  /mux\.com\//i,
  /bunnycdn\./i,
  /cdn\.databayt\.org/i,
]

// CDN patterns that serve media
const CDN_PATTERNS = [
  /cloudfront\.net/i,
  /amazonaws\.com/i,
  /blob\.vercel-storage\.com/i,
  /res\.cloudinary\.com/i,
  /images\.unsplash\.com/i,
  /cdn\.databayt\.org/i,
]

/**
 * Check if URL points to a valid video
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Check for video file extensions
    if (VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return true
    }

    // Check for known video hosting services
    if (VIDEO_HOSTING_PATTERNS.some((pattern) => pattern.test(url))) {
      return true
    }

    // Check for CDN URLs (they might serve videos)
    if (CDN_PATTERNS.some((pattern) => pattern.test(url))) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Check if URL points to a valid image
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Check for image file extensions
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return true
    }

    // Check for CDN URLs (they commonly serve images)
    if (CDN_PATTERNS.some((pattern) => pattern.test(url))) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Check if URL points to a valid document
 */
export function isValidDocumentUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Check for document file extensions
    if (DOCUMENT_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return true
    }

    // Check for CDN URLs
    if (CDN_PATTERNS.some((pattern) => pattern.test(url))) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Validate URL based on expected type
 */
export function validateMediaUrl(
  url: string,
  type: "video" | "image" | "document"
): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: true } // Empty is valid (optional field)
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }

  // Type-specific validation
  switch (type) {
    case "video":
      if (!isValidVideoUrl(url)) {
        return {
          valid: false,
          error:
            "URL does not appear to be a valid video. Supported formats: MP4, WebM, OGG, or video hosting services.",
        }
      }
      break
    case "image":
      if (!isValidImageUrl(url)) {
        return {
          valid: false,
          error:
            "URL does not appear to be a valid image. Supported formats: JPG, PNG, GIF, WebP, SVG.",
        }
      }
      break
    case "document":
      if (!isValidDocumentUrl(url)) {
        return {
          valid: false,
          error:
            "URL does not appear to be a valid document. Supported formats: PDF, DOC, DOCX, PPT, PPTX.",
        }
      }
      break
  }

  return { valid: true }
}

/**
 * Extract video embed URL for iframes (YouTube, Vimeo, etc.)
 */
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null

  try {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    )
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`
    }

    // Direct video URL - return as is
    if (VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext))) {
      return url
    }

    return url
  } catch {
    return null
  }
}
