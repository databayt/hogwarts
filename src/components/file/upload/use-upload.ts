/**
 * useUpload Hook - Single & Batch File Upload with Validation
 *
 * Manages file upload lifecycle:
 * - Client-side validation (type, size, quantity)
 * - Progress tracking (percentage and raw bytes)
 * - Server-side upload via FormData
 * - Error handling and state management
 * - Support for single and multiple file uploads
 *
 * KEY PATTERNS:
 * - VALIDATION TWICE: Client (UX) and server action (security)
 * - SIMULATED PROGRESS: Client-side progress simulation (10% increments) since FormData doesn't expose events
 * - SERVER ACTIONS: Uses "use server" actions for secure upload handling
 * - ERROR RECOVERY: Single file error doesn't block remaining files in batch
 *
 * GOTCHAS:
 * - Progress is simulated (not real) because FormData upload doesn't expose progress events
 * - AbortController is created but not actively used (placeholder for future pause/cancel)
 * - No chunking - only handles single-request uploads (use useChunkedUpload for large files)
 */

"use client"

import { useCallback, useRef, useState } from "react"

import type {
  FileCategory,
  FileMetadata,
  FileType,
  StorageProvider,
  StorageTier,
  UploadProgress,
} from "../types"
import {
  deleteFile,
  uploadFile,
  uploadFiles as uploadFilesAction,
} from "./actions"
import { validateFile, validateFiles } from "./validation"

// ============================================================================
// Types
// ============================================================================

interface UseUploadOptions {
  category: FileCategory
  type?: FileType
  folder?: string
  provider?: StorageProvider
  tier?: StorageTier
  access?: "public" | "private"
  maxSize?: number
  maxFiles?: number
  maxTotalSize?: number
  allowedTypes?: string[]
  metadata?: Record<string, string>
  onSuccess?: (result: UploadResult) => void
  onError?: (error: string, filename?: string) => void
  onProgress?: (progress: UploadProgress) => void
}

interface UploadResult {
  id: string
  url: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  category: FileCategory
  type?: string
  provider: StorageProvider
  tier: StorageTier
}

interface UseUploadReturn {
  // State
  isUploading: boolean
  progress: UploadProgress | null
  error: string | null
  uploadedFiles: UploadResult[]

  // Actions
  upload: (file: File) => Promise<UploadResult | null>
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>
  remove: (fileId: string) => Promise<boolean>
  reset: () => void
  clearError: () => void

  // Validation
  validate: (file: File) => { valid: boolean; error?: string }
  validateMultiple: (files: File[]) => {
    valid: boolean
    errors: Array<{ file: string; error: string }>
  }

  // Utilities
  getAcceptedTypes: () => Record<string, string[]>
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([])

  const abortControllerRef = useRef<AbortController | null>(null)

  // ============================================================================
  // Validation
  // ============================================================================

  const validate = useCallback(
    (file: File) => {
      return validateFile(file, {
        category: options.category,
        type: options.type,
        maxSize: options.maxSize,
        allowedTypes: options.allowedTypes,
      })
    },
    [options.category, options.type, options.maxSize, options.allowedTypes]
  )

  const validateMultiple = useCallback(
    (files: File[]) => {
      return validateFiles(files, {
        category: options.category,
        type: options.type,
        maxSize: options.maxSize,
        maxFiles: options.maxFiles,
        maxTotalSize: options.maxTotalSize,
        allowedTypes: options.allowedTypes,
      })
    },
    [
      options.category,
      options.type,
      options.maxSize,
      options.maxFiles,
      options.maxTotalSize,
      options.allowedTypes,
    ]
  )

  // ============================================================================
  // Upload Single File
  // ============================================================================

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      // Validate first
      const validation = validate(file)
      if (!validation.valid) {
        setError(validation.error || "Validation failed")
        options.onError?.(validation.error || "Validation failed", file.name)
        return null
      }

      setIsUploading(true)
      setError(null)
      setProgress({
        fileId: `upload-${Date.now()}`,
        fileName: file.name,
        filename: file.name,
        progress: 0,
        percentage: 0,
        loaded: 0,
        total: file.size,
        status: "uploading",
      })

      try {
        // Create FormData
        const formData = new FormData()
        formData.set("file", file)

        // Simulate progress by incrementing 10% every 200ms until server responds
        // Real progress would require XMLHttpRequest upload events (not available with FormData)
        // Stops at 90% to leave room for server processing
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (!prev || (prev.percentage ?? prev.progress) >= 90) return prev
            const newPercentage = Math.min(
              (prev.percentage ?? prev.progress) + 10,
              90
            )
            return {
              ...prev,
              loaded: Math.floor((newPercentage / 100) * (prev.total ?? 0)),
              percentage: newPercentage,
              progress: newPercentage,
            }
          })
        }, 200)

        // Upload via server action
        const result = await uploadFile(formData, {
          category: options.category,
          type: options.type,
          folder: options.folder,
          provider: options.provider,
          tier: options.tier,
          access: options.access,
          metadata: options.metadata,
        })

        clearInterval(progressInterval)

        if (!result.success) {
          setProgress((prev) =>
            prev ? { ...prev, status: "error", error: result.error } : null
          )
          setError(result.error)
          options.onError?.(result.error, file.name)
          return null
        }

        // Success
        const uploadResult: UploadResult = {
          id: result.id,
          url: result.url,
          filename: result.filename,
          originalName: result.originalName,
          size: result.size,
          mimeType: result.mimeType,
          category: result.category as FileCategory,
          type: result.type,
          provider: result.provider as StorageProvider,
          tier: result.tier as StorageTier,
        }

        setProgress({
          fileId: `upload-${Date.now()}`,
          fileName: file.name,
          filename: file.name,
          loaded: file.size,
          total: file.size,
          progress: 100,
          percentage: 100,
          status: "success",
        })

        setUploadedFiles((prev) => [...prev, uploadResult])
        options.onSuccess?.(uploadResult)
        options.onProgress?.({
          fileId: `upload-${Date.now()}`,
          fileName: file.name,
          filename: file.name,
          loaded: file.size,
          total: file.size,
          progress: 100,
          percentage: 100,
          status: "success",
        })

        return uploadResult
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed"
        setProgress((prev) =>
          prev ? { ...prev, status: "error", error: errorMessage } : null
        )
        setError(errorMessage)
        options.onError?.(errorMessage, file.name)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [options, validate]
  )

  // ============================================================================
  // Upload Multiple Files
  // ============================================================================

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      // Validate all files first
      const validation = validateMultiple(files)
      if (!validation.valid) {
        const errorMessage = validation.errors
          .map((e) => `${e.file}: ${e.error}`)
          .join("; ")
        setError(errorMessage)
        options.onError?.(errorMessage)
        return []
      }

      setIsUploading(true)
      setError(null)

      const results: UploadResult[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        setProgress({
          fileId: `upload-${Date.now()}-${i}`,
          fileName: file.name,
          filename: file.name,
          progress: 0,
          percentage: 0,
          loaded: 0,
          total: file.size,
          status: "uploading",
          currentFile: i + 1,
          totalFiles: files.length,
        })

        const result = await upload(file)
        if (result) {
          results.push(result)
        }
      }

      setIsUploading(false)
      return results
    },
    [options, upload, validateMultiple]
  )

  // ============================================================================
  // Remove File
  // ============================================================================

  const remove = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const result = await deleteFile(fileId)
      if (result.success) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
        return true
      }
      setError(result.error || "Delete failed")
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed"
      setError(errorMessage)
      return false
    }
  }, [])

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(null)
    setError(null)
    setUploadedFiles([])
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getAcceptedTypes = useCallback((): Record<string, string[]> => {
    // Return accept object for react-dropzone based on category
    const categoryMimes: Record<FileCategory, Record<string, string[]>> = {
      image: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/gif": [".gif"],
        "image/webp": [".webp"],
        "image/svg+xml": [".svg"],
        "image/avif": [".avif"],
      },
      video: {
        "video/mp4": [".mp4"],
        "video/webm": [".webm"],
        "video/quicktime": [".mov"],
      },
      document: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "text/plain": [".txt"],
        "text/csv": [".csv"],
      },
      audio: {
        "audio/mpeg": [".mp3"],
        "audio/wav": [".wav"],
        "audio/ogg": [".ogg"],
      },
      archive: {
        "application/zip": [".zip"],
        "application/x-rar-compressed": [".rar"],
        "application/gzip": [".gz"],
      },
      other: {},
    }

    return categoryMimes[options.category] || {}
  }, [options.category])

  return {
    // State
    isUploading,
    progress,
    error,
    uploadedFiles,

    // Actions
    upload,
    uploadMultiple,
    remove,
    reset,
    clearError,

    // Validation
    validate,
    validateMultiple,

    // Utilities
    getAcceptedTypes,
  }
}

export type { UseUploadOptions, UseUploadReturn, UploadResult }
