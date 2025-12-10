/**
 * Unified File Block - Upload Validation
 * Zod schemas for file upload validation
 */

import { z } from "zod";
import type { FileCategory, FileType, StorageProvider, StorageTier } from "../types";
import { SIZE_LIMITS, MIME_TYPES } from "../config";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get allowed MIME types for a category
 */
function getAllowedMimeTypes(category: FileCategory): string[] {
  if (category === "other") return [];
  const mimeConfig = MIME_TYPES[category as keyof typeof MIME_TYPES];
  return mimeConfig ? Object.keys(mimeConfig) : [];
}

/**
 * Get max size for a file type
 */
function getMaxSize(type?: FileType): number {
  if (type && type in SIZE_LIMITS) {
    return SIZE_LIMITS[type as keyof typeof SIZE_LIMITS];
  }
  return SIZE_LIMITS.default;
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
});

/**
 * Upload options schema
 */
export const uploadOptionsSchema = z.object({
  category: z.enum(["image", "video", "document", "audio", "archive", "other"] as const),
  type: z.string().optional(),
  folder: z.string().optional(),
  provider: z.enum(["vercel_blob", "aws_s3", "cloudflare_r2", "imagekit"] as const).optional(),
  tier: z.enum(["hot", "warm", "cold"] as const).optional(),
  access: z.enum(["public", "private"] as const).optional(),
  metadata: z.record(z.string()).optional(),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
  onProgress: z.function().args(z.number()).returns(z.void()).optional(),
});

/**
 * Single file upload request schema
 */
export const uploadRequestSchema = z.object({
  file: fileInfoSchema,
  options: uploadOptionsSchema.optional(),
});

/**
 * Batch upload request schema
 */
export const batchUploadRequestSchema = z.object({
  files: z.array(fileInfoSchema).min(1, "At least one file is required"),
  options: uploadOptionsSchema.optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    category: FileCategory;
    type?: FileType;
    maxSize?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = options.maxSize || getMaxSize(options.type);
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed (${maxSizeMB}MB)`,
    };
  }

  // Check file type
  const allowedTypes = options.allowedTypes || getAllowedMimeTypes(options.category);
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed for ${options.category} uploads`,
    };
  }

  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    return { valid: false, error: "File name is required" };
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".js", ".vbs"];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (dangerousExtensions.includes(extension)) {
    return { valid: false, error: "This file type is not allowed for security reasons" };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  options: {
    category: FileCategory;
    type?: FileType;
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
    maxTotalSize?: number;
  }
): { valid: boolean; errors: Array<{ file: string; error: string }> } {
  const errors: Array<{ file: string; error: string }> = [];

  // Check max files
  if (options.maxFiles && files.length > options.maxFiles) {
    return {
      valid: false,
      errors: [{ file: "batch", error: `Maximum ${options.maxFiles} files allowed` }],
    };
  }

  // Check total size
  if (options.maxTotalSize) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > options.maxTotalSize) {
      const maxMB = Math.round(options.maxTotalSize / (1024 * 1024));
      const totalMB = Math.round(totalSize / (1024 * 1024));
      return {
        valid: false,
        errors: [{ file: "batch", error: `Total size (${totalMB}MB) exceeds maximum (${maxMB}MB)` }],
      };
    }
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, options);
    if (!result.valid && result.error) {
      errors.push({ file: file.name, error: result.error });
    }
  }

  return { valid: errors.length === 0, errors };
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
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Failed upload result schema
 */
export const uploadErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  filename: z.string().optional(),
});

/**
 * Combined upload result schema
 */
export const uploadResponseSchema = z.discriminatedUnion("success", [
  uploadResultSchema,
  uploadErrorSchema,
]);

// ============================================================================
// Type Exports
// ============================================================================

export type FileInfo = z.infer<typeof fileInfoSchema>;
export type UploadOptions = z.infer<typeof uploadOptionsSchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type BatchUploadRequest = z.infer<typeof batchUploadRequestSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
export type UploadError = z.infer<typeof uploadErrorSchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
