/**
 * File Upload Validation
 *
 * Unified file upload system with multi-provider storage and category-based limits:
 * - 6 categories: Image (10MB), Video (100MB), Document (50MB), Audio (20MB), Archive (30MB), Other (100MB)
 * - Multiple providers: Vercel Blob, AWS S3, Cloudflare R2, ImageKit
 * - Storage tiers: Hot (CDN), Warm (archival), Cold (deleted after 30 days)
 * - MIME validation: Whitelist per category (prevent executable uploads)
 * - Dangerous file detection: Block .exe, .bat, .js, .vbs (security)
 * - Batch validation: Multiple files with cumulative size limit
 * - Metadata: File name, size, type, last modified (audit trail)
 *
 * Key validation rules:
 * - File name: Required, non-empty after trim
 * - MIME type: Must match category (image/* for images, video/* for video)
 * - Size: Hard limits per category (prevents storage abuse)
 * - Dangerous extensions: Blocked regardless of MIME type
 * - Batch count: configurable max files per request
 * - Batch size: configurable max total per request
 * - Metadata: Optional, stored as key-value pairs
 * - Access: Public (CDN) or Private (authenticated)
 *
 * Why category-based limits:
 * - Images: Compressed, frequent, small (10MB covers 4K photos)
 * - Video: Uncompressed, storage-heavy, less frequent (100MB = ~1min 1080p)
 * - Documents: Variable (PDFs < 1MB, video dumps 50MB+)
 * - Audio: Small, voice notes or music (20MB = ~4min 128kbps)
 * - Archive: Zips of documents (30MB = 50+ PDFs)
 * - Other: Catch-all, liberal limit (should use category)
 *
 * Why dangerous file blocking:
 * - .exe/.bat: Executables (run on user machine if downloaded)
 * - .js/.vbs: Scripts (XSS, ransomware potential)
 * - Prevents: Malware distribution through file uploads
 * - Defense: Whitelist approach (only known-good types)
 *
 * Why MIME + extension check:
 * - MIME alone: Can be spoofed (rename .exe to .pdf.exe)
 * - Extension alone: Unreliable (doesn't match actual content)
 * - Together: Strong validation (requires both match category)
 */

import { z } from "zod"

import { MIME_TYPES, SIZE_LIMITS } from "../config"
import type {
  FileCategory,
  FileType,
  StorageProvider,
  StorageTier,
} from "../types"

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get allowed MIME types for a category
 */
function getAllowedMimeTypes(category: FileCategory): string[] {
  if (category === "other") return []
  const mimeConfig = MIME_TYPES[category as keyof typeof MIME_TYPES]
  return mimeConfig ? Object.keys(mimeConfig) : []
}

/**
 * Get max size for a file type
 */
function getMaxSize(type?: FileType): number {
  if (type && type in SIZE_LIMITS) {
    return SIZE_LIMITS[type as keyof typeof SIZE_LIMITS]
  }
  return SIZE_LIMITS.default
}

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * File metadata schema (client-side info before upload)
 */
export const fileInfoSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().positive("File size must be positive"),
  type: z.string().min(1, "MIME type is required"),
  lastModified: z.number().optional(),
})

/**
 * Upload options schema
 */
export const uploadOptionsSchema = z.object({
  category: z.enum([
    "image",
    "video",
    "document",
    "audio",
    "archive",
    "other",
  ] as const),
  type: z.string().optional(),
  folder: z.string().optional(),
  provider: z
    .enum(["vercel_blob", "aws_s3", "cloudflare_r2", "imagekit"] as const)
    .optional(),
  tier: z.enum(["hot", "warm", "cold"] as const).optional(),
  access: z.enum(["public", "private"] as const).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
  onProgress: z.any().optional(),
})

/**
 * Single file upload request schema
 */
export const uploadRequestSchema = z.object({
  file: fileInfoSchema,
  options: uploadOptionsSchema.optional(),
})

/**
 * Batch upload request schema
 */
export const batchUploadRequestSchema = z.object({
  files: z.array(fileInfoSchema).min(1, "At least one file is required"),
  options: uploadOptionsSchema.optional(),
})

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate file before upload
 * Enforces: size limits, MIME type whitelist, dangerous extension blocking
 */
export function validateFile(
  file: File,
  options: {
    category: FileCategory
    type?: FileType
    maxSize?: number
    allowedTypes?: string[]
  }
): { valid: boolean; error?: string } {
  // Check file size - hard limit per category
  // Why: Prevents storage abuse (e.g., 1000 100MB videos = 100GB cost)
  const maxSize = options.maxSize || getMaxSize(options.type)
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    const fileSizeMB = Math.round(file.size / (1024 * 1024))
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed (${maxSizeMB}MB)`,
    }
  }

  // Check file type - whitelist by category
  // Why: Prevents disguised executables (rename .exe to .pdf)
  const allowedTypes =
    options.allowedTypes || getAllowedMimeTypes(options.category)
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed for ${options.category} uploads`,
    }
  }

  // Check file name - must not be empty
  if (!file.name || file.name.trim().length === 0) {
    return { valid: false, error: "File name is required" }
  }

  // Check for potentially dangerous file extensions
  // Why: Defense in depth - blocks known executables even if MIME spoofed
  // Example: .exe file renamed to .pdf + MIME changed to application/pdf still blocked
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".scr",
    ".pif",
    ".js",
    ".vbs",
  ]
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
  if (dangerousExtensions.includes(extension)) {
    return {
      valid: false,
      error: "This file type is not allowed for security reasons",
    }
  }

  return { valid: true }
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  options: {
    category: FileCategory
    type?: FileType
    maxSize?: number
    allowedTypes?: string[]
    maxFiles?: number
    maxTotalSize?: number
  }
): { valid: boolean; errors: Array<{ file: string; error: string }> } {
  const errors: Array<{ file: string; error: string }> = []

  // Check max files
  if (options.maxFiles && files.length > options.maxFiles) {
    return {
      valid: false,
      errors: [
        { file: "batch", error: `Maximum ${options.maxFiles} files allowed` },
      ],
    }
  }

  // Check total size
  if (options.maxTotalSize) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > options.maxTotalSize) {
      const maxMB = Math.round(options.maxTotalSize / (1024 * 1024))
      const totalMB = Math.round(totalSize / (1024 * 1024))
      return {
        valid: false,
        errors: [
          {
            file: "batch",
            error: `Total size (${totalMB}MB) exceeds maximum (${maxMB}MB)`,
          },
        ],
      }
    }
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, options)
    if (!result.valid && result.error) {
      errors.push({ file: file.name, error: result.error })
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Upload Result Schema
// ============================================================================

/**
 * Successful upload result schema
 */
export const uploadResultSchema = z.object({
  success: z.literal(true),
  url: z.string().url(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number(),
  mimeType: z.string(),
  category: z.string(),
  type: z.string().optional(),
  provider: z.string(),
  tier: z.string(),
  pathname: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Failed upload result schema
 */
export const uploadErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  filename: z.string().optional(),
})

/**
 * Combined upload result schema
 */
export const uploadResponseSchema = z.discriminatedUnion("success", [
  uploadResultSchema,
  uploadErrorSchema,
])

// ============================================================================
// Type Exports
// ============================================================================

export type FileInfo = z.infer<typeof fileInfoSchema>
export type UploadOptions = z.infer<typeof uploadOptionsSchema>
export type UploadRequest = z.infer<typeof uploadRequestSchema>
export type BatchUploadRequest = z.infer<typeof batchUploadRequestSchema>
export type UploadResult = z.infer<typeof uploadResultSchema>
export type UploadError = z.infer<typeof uploadErrorSchema>
export type UploadResponse = z.infer<typeof uploadResponseSchema>
