/**
 * Unified File Block - Configuration Constants
 */

import type { FileCategory, StorageProvider, StorageTier } from "./types"

// ============================================================================
// Size Limits (in bytes)
// ============================================================================

export const SIZE_LIMITS = {
  // Images
  avatar: 2 * 1024 * 1024, // 2 MB
  logo: 5 * 1024 * 1024, // 5 MB
  banner: 10 * 1024 * 1024, // 10 MB
  thumbnail: 1 * 1024 * 1024, // 1 MB
  content: 10 * 1024 * 1024, // 10 MB

  // Videos
  lesson: 500 * 1024 * 1024, // 500 MB (Vercel Blob limit)
  course: 5 * 1024 * 1024 * 1024, // 5 GB (S3)
  assignment: 100 * 1024 * 1024, // 100 MB
  promotional: 500 * 1024 * 1024, // 500 MB

  // Documents
  pdf: 50 * 1024 * 1024, // 50 MB
  word: 50 * 1024 * 1024, // 50 MB
  excel: 50 * 1024 * 1024, // 50 MB
  powerpoint: 100 * 1024 * 1024, // 100 MB
  text: 10 * 1024 * 1024, // 10 MB
  certificate: 10 * 1024 * 1024, // 10 MB
  receipt: 10 * 1024 * 1024, // 10 MB
  invoice: 10 * 1024 * 1024, // 10 MB
  report: 50 * 1024 * 1024, // 50 MB
  transcript: 10 * 1024 * 1024, // 10 MB
  id_card: 5 * 1024 * 1024, // 5 MB

  // Defaults
  default: 10 * 1024 * 1024, // 10 MB
  maxTotal: 5 * 1024 * 1024 * 1024, // 5 GB
} as const

// ============================================================================
// MIME Types
// ============================================================================

export const MIME_TYPES = {
  // Images
  image: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/svg+xml": [".svg"],
    "image/avif": [".avif"],
  },

  // Videos
  video: {
    "video/mp4": [".mp4"],
    "video/webm": [".webm"],
    "video/quicktime": [".mov"],
    "video/x-msvideo": [".avi"],
    "video/x-matroska": [".mkv"],
  },

  // Documents
  document: {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "text/plain": [".txt"],
    "text/csv": [".csv"],
  },

  // Audio
  audio: {
    "audio/mpeg": [".mp3"],
    "audio/wav": [".wav"],
    "audio/ogg": [".ogg"],
    "audio/webm": [".weba"],
    "audio/aac": [".aac"],
  },

  // Archives
  archive: {
    "application/zip": [".zip"],
    "application/x-zip-compressed": [".zip"],
    "application/x-rar-compressed": [".rar"],
    "application/gzip": [".gz"],
    "application/x-7z-compressed": [".7z"],
  },
} as const

// ============================================================================
// Provider Configuration
// ============================================================================

export const PROVIDER_CONFIG: Record<
  StorageProvider,
  {
    name: string
    maxSize: number
    tier: StorageTier
    features: string[]
  }
> = {
  vercel_blob: {
    name: "Vercel Blob",
    maxSize: 500 * 1024 * 1024, // 500 MB
    tier: "hot",
    features: ["fast_access", "cdn", "automatic_cleanup"],
  },
  aws_s3: {
    name: "AWS S3",
    maxSize: 5 * 1024 * 1024 * 1024, // 5 GB
    tier: "warm",
    features: ["large_files", "signed_urls", "lifecycle_policies"],
  },
  cloudflare_r2: {
    name: "Cloudflare R2",
    maxSize: 5 * 1024 * 1024 * 1024, // 5 GB
    tier: "cold",
    features: ["archive", "cost_effective", "s3_compatible"],
  },
  imagekit: {
    name: "ImageKit",
    maxSize: 50 * 1024 * 1024, // 50 MB
    tier: "hot",
    features: ["image_optimization", "transformations", "cdn"],
  },
} as const

// ============================================================================
// Storage Tier Thresholds
// ============================================================================

export const TIER_THRESHOLDS = {
  hot: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    maxAge: 30, // days
  },
  warm: {
    maxSize: 500 * 1024 * 1024, // 500 MB
    maxAge: 90, // days
  },
  cold: {
    maxSize: Infinity,
    maxAge: Infinity,
  },
} as const

// ============================================================================
// Folder Structure
// ============================================================================

export const FOLDER_STRUCTURE = {
  avatars: "avatars",
  logos: "logos",
  banners: "banners",
  documents: "documents",
  generated: "documents/generated",
  invoices: "documents/invoices",
  receipts: "documents/receipts",
  certificates: "documents/certificates",
  transcripts: "documents/transcripts",
  reports: "documents/reports",
  media: "media",
  images: "media/images",
  videos: "media/videos",
  courses: "courses",
  assignments: "assignments",
  submissions: "submissions",
  exports: "exports",
  imports: "imports",
  temp: "temp",
} as const

// ============================================================================
// Export Configuration
// ============================================================================

export const EXPORT_CONFIG = {
  batchSize: 1000,
  maxRows: 50000,
  defaultFormats: ["csv", "excel", "pdf"] as const,
  dateFormat: {
    en: "yyyy-MM-dd",
    ar: "dd/MM/yyyy",
  },
  currency: {
    en: "USD",
    ar: "SAR",
  },
} as const

// ============================================================================
// Import Configuration
// ============================================================================

export const IMPORT_CONFIG = {
  maxRows: 5000,
  batchSize: 50,
  maxRetries: 3,
  previewLimit: 5,
  supportedFormats: ["csv", "excel", "json"] as const,
} as const

// ============================================================================
// Print Configuration
// ============================================================================

export const PRINT_CONFIG = {
  defaultPageSize: "A4" as const,
  defaultOrientation: "portrait" as const,
  defaultMargins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  pageSizes: {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
    A3: { width: 297, height: 420 },
    A5: { width: 148, height: 210 },
  },
} as const

// ============================================================================
// Document Generation Configuration
// ============================================================================

export const GENERATE_CONFIG = {
  defaultQuality: "standard" as const,
  maxConcurrentBatch: 5,
  timeoutMs: 30000,
  templates: {
    invoice: ["classic", "modern", "minimal"],
    receipt: ["standard", "compact", "detailed"],
    certificate: ["elegant", "modern", "achievement"],
    report_card: ["standard", "detailed", "compact"],
    id_card: ["standard", "photo-id", "minimal"],
    transcript: ["official", "summary"],
  },
} as const

// ============================================================================
// File Icons Mapping
// ============================================================================

export const FILE_ICONS: Record<FileCategory, string> = {
  image: "image",
  video: "video",
  document: "file-text",
  audio: "music",
  archive: "archive",
  other: "file",
}

export const DOCUMENT_ICONS: Record<string, string> = {
  pdf: "file-type-pdf",
  word: "file-type-doc",
  excel: "file-spreadsheet",
  powerpoint: "presentation",
  text: "file-text",
  csv: "table",
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get category from MIME type
 */
export function getCategoryFromMimeType(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (
    mimeType.startsWith("application/pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.startsWith("text/")
  ) {
    return "document"
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  ) {
    return "archive"
  }
  return "other"
}

/**
 * Get size limit for file type
 */
export function getSizeLimit(category: FileCategory, type?: string): number {
  if (type && type in SIZE_LIMITS) {
    return SIZE_LIMITS[type as keyof typeof SIZE_LIMITS]
  }
  return SIZE_LIMITS.default
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// ============================================================================
// Storage Provider Selection (legacy support)
// ============================================================================

/**
 * Storage configuration for provider-based size limits
 */
export const STORAGE_CONFIG = {
  // File size limits (in bytes) by provider
  MAX_SIZES: {
    // Vercel Blob limits (use for smaller files)
    VERCEL_BLOB: {
      video: 500 * 1024 * 1024, // 500 MB
      material: 50 * 1024 * 1024, // 50 MB
      image: 10 * 1024 * 1024, // 10 MB
    },
    // Extended limits (use for large videos with S3/R2)
    EXTENDED: {
      video: 5 * 1024 * 1024 * 1024, // 5 GB (supports 40+ min 1080p, 20+ min 4K)
      material: 500 * 1024 * 1024, // 500 MB
      image: 50 * 1024 * 1024, // 50 MB
    },
  },

  // Storage providers
  PROVIDERS: {
    VERCEL_BLOB: "vercel_blob",
    AWS_S3: "aws_s3",
    CLOUDFLARE_R2: "cloudflare_r2",
  },

  // Provider selection rules
  getProvider: (
    fileSize: number,
    fileType: "video" | "material" | "image"
  ): string => {
    // For videos over 500MB, use extended storage if configured
    if (
      fileType === "video" &&
      fileSize > STORAGE_CONFIG.MAX_SIZES.VERCEL_BLOB.video
    ) {
      // Check which extended provider is available
      if (process.env.CLOUDFLARE_R2_ACCOUNT_ID)
        return STORAGE_CONFIG.PROVIDERS.CLOUDFLARE_R2
      if (process.env.AWS_S3_BUCKET) return STORAGE_CONFIG.PROVIDERS.AWS_S3

      // No extended storage configured, reject file
      throw new Error(
        `Video file size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds Vercel Blob limit. ` +
          `Please configure AWS S3 or Cloudflare R2 for large video files.`
      )
    }

    // Use Vercel Blob for small files
    return STORAGE_CONFIG.PROVIDERS.VERCEL_BLOB
  },

  // Get max size for file type based on available storage
  getMaxSize: (fileType: "video" | "material" | "image"): number => {
    // Check if extended storage is configured
    const hasExtendedStorage =
      process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.AWS_S3_BUCKET

    if (hasExtendedStorage) {
      return STORAGE_CONFIG.MAX_SIZES.EXTENDED[fileType]
    }

    return STORAGE_CONFIG.MAX_SIZES.VERCEL_BLOB[fileType]
  },
} as const

/**
 * Human-readable size labels
 */
export const SIZE_LABELS = {
  getLabel: (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    const mb = bytes / (1024 * 1024)

    if (gb >= 1) return `${gb.toFixed(1)} GB`
    return `${mb.toFixed(0)} MB`
  },
} as const

/**
 * Video quality recommendations
 */
export const VIDEO_RECOMMENDATIONS = {
  "480p (SD)": {
    bitrate: "2.5 Mbps",
    duration40min: "750 MB",
    recommended: "Basic lessons, slower connections",
  },
  "720p (HD)": {
    bitrate: "5 Mbps",
    duration40min: "1.5 GB",
    recommended: "Standard quality, most lessons",
  },
  "1080p (Full HD)": {
    bitrate: "8 Mbps",
    duration40min: "2.4 GB",
    recommended: "High quality, detailed content",
  },
  "4K (Ultra HD)": {
    bitrate: "20 Mbps",
    duration40min: "6 GB",
    recommended: "Maximum quality, large displays",
  },
} as const

/**
 * Get accept object for react-dropzone
 */
export function getAcceptForCategory(
  category: FileCategory
): Record<string, string[]> {
  if (category === "other") return {}
  const mimeConfig = MIME_TYPES[category as keyof typeof MIME_TYPES]
  if (!mimeConfig) return {}

  // Convert readonly arrays to mutable for compatibility
  const result: Record<string, string[]> = {}
  for (const [mime, exts] of Object.entries(mimeConfig)) {
    result[mime] = [...exts]
  }
  return result
}
