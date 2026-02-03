/**
 * ImageKit Storage Provider
 * Optimized for images with transformations and CDN
 *
 * @see https://docs.imagekit.io/
 */

import ImageKit from "imagekit"

import type { StorageProvider } from "../types"
import { BaseStorageProvider, type UploadProviderOptions } from "./base"

// ============================================================================
// Configuration & Constants
// ============================================================================

// Lazy initialization to avoid errors when env vars are missing
let imagekitInstance: ImageKit | null = null

function getImageKit(): ImageKit {
  if (!imagekitInstance) {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error("ImageKit environment variables are not configured")
    }

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })
  }

  return imagekitInstance
}

/**
 * Folder structure for Hogwarts school-dashboard
 */
export const IMAGEKIT_FOLDERS = {
  LIBRARY_BOOKS: "hogwarts/library/books",
  LIBRARY_AUTHORS: "hogwarts/library/authors",
  AVATARS: "hogwarts/avatars",
  BANNERS: "hogwarts/banners",
  EXCUSE_ATTACHMENTS: "hogwarts/attendance/excuses",
  LOGOS: "hogwarts/logos",
  DOCUMENTS: "hogwarts/documents",
} as const

/**
 * Get URL endpoint for client-side use
 */
export function getUrlEndpoint(): string {
  return process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
}

// ============================================================================
// Transformation Types & Presets
// ============================================================================

export interface TransformationOptions {
  /** Width in pixels */
  width?: number
  /** Height in pixels */
  height?: number
  /** Quality (1-100) */
  quality?: number
  /** Crop mode */
  crop?: "maintain_ratio" | "force" | "at_least" | "at_max"
  /** Focus area for cropping */
  focus?: "center" | "top" | "left" | "bottom" | "right" | "auto"
  /** Output format */
  format?: "auto" | "webp" | "jpg" | "png" | "avif"
  /** Blur amount (1-100) */
  blur?: number
}

// Transformation presets
export const IMAGE_TRANSFORMATIONS = {
  thumbnail: { width: 100, height: 100, crop: "at_max" as const },
  card: { width: 300, height: 400, crop: "at_max" as const },
  detail: { width: 600, height: 800, crop: "at_max" as const },
  avatar: { width: 200, height: 200, crop: "at_max" as const },
  banner: { width: 1200, height: 400, crop: "at_max" as const },
  logo: { width: 400, height: 400, crop: "at_max" as const },
} as const

export type TransformationPreset = keyof typeof IMAGE_TRANSFORMATIONS

/** Book cover preset transformations */
export const BOOK_COVER_PRESETS = {
  /** Small thumbnail for lists (200x267, 3:4 ratio) */
  thumbnail: {
    width: 200,
    height: 267,
    quality: 75,
    crop: "maintain_ratio" as const,
  },
  /** Card display (300x400) */
  card: {
    width: 300,
    height: 400,
    quality: 80,
    crop: "maintain_ratio" as const,
  },
  /** Detail page (600x800) */
  detail: {
    width: 600,
    height: 800,
    quality: 90,
    crop: "maintain_ratio" as const,
  },
  /** Full quality original */
  original: { quality: 100 },
} as const

// ============================================================================
// URL Generation Utilities
// ============================================================================

/**
 * Generate an optimized ImageKit URL with transformations
 *
 * @param path - Image path (e.g., "hogwarts/library/books/abc123/cover.jpg")
 * @param options - Transformation options
 * @returns Optimized URL with transformations
 *
 * @example
 * getImagekitUrl("hogwarts/library/books/abc/cover.jpg", { width: 300, quality: 80 })
 * // Returns: https://ik.imagekit.io/abdout/hogwarts/library/books/abc/cover.jpg?tr=w-300,q-80
 */
export function getImagekitUrl(
  path: string,
  options?: TransformationOptions
): string {
  const imagekit = getImageKit()
  const transformations: Record<string, string>[] = []

  if (options) {
    const tr: Record<string, string> = {}

    if (options.width) tr.width = options.width.toString()
    if (options.height) tr.height = options.height.toString()
    if (options.quality) tr.quality = options.quality.toString()
    if (options.crop) tr.crop = options.crop
    if (options.focus) tr.focus = options.focus
    if (options.format) tr.format = options.format
    if (options.blur) tr.blur = options.blur.toString()

    if (Object.keys(tr).length > 0) {
      transformations.push(tr)
    }
  }

  return imagekit.url({
    path: path.startsWith("/") ? path : `/${path}`,
    transformation: transformations.length > 0 ? transformations : undefined,
  })
}

/**
 * Get optimized book cover URL with preset transformation
 *
 * @param coverUrl - Full ImageKit URL or path
 * @param preset - Preset name (thumbnail, card, detail, original)
 * @returns Optimized URL
 */
export function getBookCoverUrl(
  coverUrl: string,
  preset: keyof typeof BOOK_COVER_PRESETS = "card"
): string {
  // If it's already an ImageKit URL, extract the path
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
  let path = coverUrl

  if (coverUrl.startsWith(urlEndpoint)) {
    path = coverUrl.replace(urlEndpoint, "")
  } else if (coverUrl.startsWith("https://ik.imagekit.io/")) {
    // Extract path from any ImageKit URL
    const url = new URL(coverUrl)
    path = url.pathname.replace(/^\/[^/]+/, "") // Remove the account name
  }

  return getImagekitUrl(path, BOOK_COVER_PRESETS[preset])
}

// ============================================================================
// Upload Types
// ============================================================================

export interface ImageKitUploadOptions {
  /** File to upload (base64, URL, or Buffer) */
  file: string | Buffer
  /** File name */
  fileName: string
  /** Folder path */
  folder?: string
  /** Tags for organization */
  tags?: string[]
  /** Use unique filename */
  useUniqueFileName?: boolean
  /** Custom metadata */
  customMetadata?: Record<string, string | number | boolean>
}

export interface ImageKitUploadResult {
  fileId: string
  name: string
  url: string
  thumbnailUrl: string
  filePath: string
  size: number
  fileType: string
  height?: number
  width?: number
}

// ============================================================================
// Direct Upload Functions (Server-side)
// ============================================================================

/**
 * Upload a file to ImageKit (server-side only)
 *
 * @param options - Upload options
 * @returns Upload result with file details
 */
export async function uploadToImageKit(
  options: ImageKitUploadOptions
): Promise<ImageKitUploadResult> {
  const imagekit = getImageKit()

  const response = await imagekit.upload({
    file: options.file,
    fileName: options.fileName,
    folder: options.folder || IMAGEKIT_FOLDERS.LIBRARY_BOOKS,
    tags: options.tags,
    useUniqueFileName: options.useUniqueFileName ?? true,
    customMetadata: options.customMetadata,
  })

  return {
    fileId: response.fileId,
    name: response.name,
    url: response.url,
    thumbnailUrl: response.thumbnailUrl,
    filePath: response.filePath,
    size: response.size,
    fileType: response.fileType,
    height: response.height,
    width: response.width,
  }
}

/**
 * Delete a file from ImageKit (server-side only)
 *
 * @param fileId - ImageKit file ID
 */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  const imagekit = getImageKit()
  await imagekit.deleteFile(fileId)
}

/**
 * Get file details from ImageKit (server-side only)
 *
 * @param fileId - ImageKit file ID
 */
export async function getImageKitFileDetails(fileId: string) {
  const imagekit = getImageKit()
  return imagekit.getFileDetails(fileId)
}

/**
 * Generate authentication parameters for client-side uploads
 * These are time-limited tokens for secure direct uploads
 */
export function getAuthenticationParameters() {
  const imagekit = getImageKit()
  return imagekit.getAuthenticationParameters()
}

export class ImageKitProvider extends BaseStorageProvider {
  protected providerName: StorageProvider = "imagekit"

  supports(
    feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"
  ): boolean {
    return feature === "transformations" || feature === "direct_upload"
  }

  async upload(
    file: File | Blob,
    path: string,
    options?: UploadProviderOptions
  ): Promise<string> {
    try {
      const imagekit = getImageKit()

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")

      // Extract folder and filename from path
      const lastSlash = path.lastIndexOf("/")
      const folder = lastSlash > 0 ? path.substring(0, lastSlash) : "/"
      const fileName = lastSlash > 0 ? path.substring(lastSlash + 1) : path

      const result = await imagekit.upload({
        file: base64,
        fileName,
        folder,
        useUniqueFileName: false,
        tags: options?.metadata ? Object.values(options.metadata) : undefined,
      })

      return result.url
    } catch (error) {
      console.error("[ImageKitProvider] Upload error:", error)
      throw new Error(
        `Failed to upload to ImageKit: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      const imagekit = getImageKit()

      // Extract file ID from URL or use path directly
      const fileId = this.extractFileId(urlOrPath)
      if (!fileId) {
        console.error(
          "[ImageKitProvider] Could not extract file ID from:",
          urlOrPath
        )
        return false
      }

      await imagekit.deleteFile(fileId)
      return true
    } catch (error) {
      console.error("[ImageKitProvider] Delete error:", error)
      return false
    }
  }

  async list(path: string, limit: number = 100): Promise<string[]> {
    try {
      const imagekit = getImageKit()

      const files = await imagekit.listFiles({
        path,
        limit,
      })

      return files
        .filter(
          (file): file is typeof file & { url: string } =>
            "url" in file && typeof file.url === "string"
        )
        .map((file) => file.url)
    } catch (error) {
      console.error("[ImageKitProvider] List error:", error)
      return []
    }
  }

  /**
   * Get transformed URL with preset
   */
  getTransformedUrl(url: string, preset: TransformationPreset): string {
    const transformation = IMAGE_TRANSFORMATIONS[preset]

    try {
      const imagekit = getImageKit()
      return imagekit.url({
        src: url,
        transformation: [transformation],
      })
    } catch {
      // If ImageKit is not configured, return original URL
      return url
    }
  }

  /**
   * Get authentication parameters for client-side uploads
   */
  async getAuthenticationParameters(): Promise<{
    token: string
    expire: number
    signature: string
  }> {
    const imagekit = getImageKit()
    return imagekit.getAuthenticationParameters()
  }

  private extractFileId(urlOrPath: string): string | null {
    // ImageKit URLs contain the file ID in the path
    // Example: https://ik.imagekit.io/abdout/folder/file_abc123.jpg
    // The file ID would need to be looked up via the API

    // For now, we'll need to use the file path to find and delete
    // This is a limitation - ideally we'd store the fileId in our database
    try {
      const url = new URL(urlOrPath)
      const pathParts = url.pathname.split("/").filter(Boolean)
      // Return the last part (filename) as a fallback
      return pathParts[pathParts.length - 1] || null
    } catch {
      return urlOrPath
    }
  }
}

// Export singleton helper
let provider: ImageKitProvider | null = null

export function getImageKitProvider(): ImageKitProvider {
  if (!provider) {
    provider = new ImageKitProvider()
  }
  return provider
}
