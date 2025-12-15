/**
 * Enhanced File Uploader Component
 * Modern drag-drop interface with react-dropzone
 *
 * Features:
 * - Drag and drop support
 * - Multiple file upload
 * - File type validation
 * - Size validation
 * - Automatic chunking for large files
 * - Real-time progress tracking
 * - Image preview
 * - Client-side optimization
 */

"use client"

import { useCallback, useState } from "react"
import type { FileCategory } from "@prisma/client"
import { Upload, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { UploadProgress } from "./aggregate-progress"
import { FilePreview, getFileIcon } from "./file-preview"
import { useChunkedUpload } from "./use-chunked"
import { useImageOptimization } from "./use-image-optimization"

// ============================================================================
// Types
// ============================================================================

export interface UploadedFileResult {
  fileId: string
  url: string
  cdnUrl?: string
}

export interface FileUploaderProps {
  /** Category for uploaded files */
  category?: FileCategory
  /** Folder path for storage */
  folder?: string
  /** Maximum file size in bytes (default: 5GB) */
  maxSize?: number
  /** Accepted file types (MIME types) */
  accept?: Record<string, string[]>
  /** Maximum number of files */
  maxFiles?: number
  /** Enable multiple file selection */
  multiple?: boolean
  /** Enable image optimization before upload */
  optimizeImages?: boolean
  /** Callback on successful upload */
  onUploadComplete?: (files: UploadedFileResult[]) => void
  /** Callback on upload error */
  onUploadError?: (error: string) => void
  /** Custom class name */
  className?: string
}

interface UploadedFile {
  id: string
  file: File
  preview?: string
  optimized?: boolean
}

// ============================================================================
// Default Accept Configurations
// ============================================================================

export const ACCEPT_IMAGES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
}

export const ACCEPT_DOCUMENTS = {
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
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/plain": [".txt"],
}

export const ACCEPT_VIDEOS = {
  "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
}

export const ACCEPT_AUDIO = {
  "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
}

export const ACCEPT_ALL = {
  ...ACCEPT_IMAGES,
  ...ACCEPT_DOCUMENTS,
  ...ACCEPT_VIDEOS,
  ...ACCEPT_AUDIO,
}

// ============================================================================
// Component
// ============================================================================

export function FileUploader({
  category = "OTHER",
  folder,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB
  accept = ACCEPT_ALL,
  maxFiles = 10,
  multiple = true,
  optimizeImages = true,
  onUploadComplete,
  onUploadError,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)

  const { uploadMultiple, progress, isUploading, cancelUpload } =
    useChunkedUpload({
      onSuccess: (fileId) => {
        // Handle individual file success
      },
      onError: (error) => {
        onUploadError?.(error)
        toast.error(error)
      },
    })

  const { optimizeImage, canOptimize } = useImageOptimization({
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    format: "webp",
  })

  // ============================================================================
  // File Validation
  // ============================================================================

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File ${file.name} exceeds maximum size of ${formatBytes(maxSize)}`
      }

      // Check file type (accept prop validation)
      const acceptedTypes = Object.keys(accept)
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) {
          const baseType = type.split("/")[0]
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })

      if (!isAccepted) {
        return `File type ${file.type} is not accepted`
      }

      return null
    },
    [maxSize, accept]
  )

  // ============================================================================
  // File Drop Handler
  // ============================================================================

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Validate file count
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Validate each file
      const validFiles: File[] = []
      for (const file of acceptedFiles) {
        const error = validateFile(file)
        if (error) {
          toast.error(error)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) {
        return
      }

      // Generate previews and optimize images
      setIsOptimizing(true)
      const uploadedFiles: UploadedFile[] = []

      for (const file of validFiles) {
        let preview: string | undefined
        let processedFile = file
        let optimized = false

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          preview = URL.createObjectURL(file)

          // Optimize if enabled and possible
          if (optimizeImages && canOptimize(file)) {
            try {
              processedFile = await optimizeImage(file)
              optimized = true
              toast.success(
                `Optimized ${file.name} (${Math.round(((file.size - processedFile.size) / file.size) * 100)}% smaller)`
              )
            } catch (error) {
              console.error("Optimization failed:", error)
              // Continue with original file
            }
          }
        }

        uploadedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file: processedFile,
          preview,
          optimized,
        })
      }

      setIsOptimizing(false)
      setFiles((prev) => [...prev, ...uploadedFiles])
    },
    [
      files.length,
      maxFiles,
      validateFile,
      optimizeImages,
      canOptimize,
      optimizeImage,
    ]
  )

  // ============================================================================
  // Dropzone Configuration
  // ============================================================================

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles,
      multiple,
      disabled: isUploading || isOptimizing,
    })

  // ============================================================================
  // Upload Handler
  // ============================================================================

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("No files selected")
      return
    }

    const filesToUpload = files.map((f) => f.file)
    const results = await uploadMultiple(filesToUpload, category)

    // Check results
    const successCount = results.filter((r: any) => r.success).length
    const failCount = results.length - successCount

    if (successCount > 0) {
      const uploadedFiles = results
        .filter((r: any) => r.success && (r.fileId || r.id) && r.url)
        .map((r: any) => ({
          fileId: r.fileId || r.id,
          url: r.url,
          cdnUrl: r.cdnUrl,
        }))

      onUploadComplete?.(uploadedFiles)
      toast.success(`Successfully uploaded ${successCount} file(s)`)

      // Clear uploaded files
      setFiles([])
    }

    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} file(s)`)
    }
  }

  // ============================================================================
  // File Removal
  // ============================================================================

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })

    // Cancel upload if in progress
    const file = files.find((f) => f.id === id)
    if (file && progress[file.file.name]) {
      cancelUpload(file.file.name)
    }
  }

  const clearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          "cursor-pointer border-2 border-dashed transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          (isUploading || isOptimizing) && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Upload className="text-muted-foreground mb-4 h-12 w-12" />

          {isDragActive ? (
            isDragReject ? (
              <p className="text-destructive">Some files will be rejected</p>
            ) : (
              <p className="text-primary">Drop files here</p>
            )
          ) : (
            <>
              <p className="mb-2 text-lg font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="text-muted-foreground mb-4 text-sm">
                {multiple ? `Up to ${maxFiles} files` : "Single file"} • Max{" "}
                {formatBytes(maxSize)} per file
              </p>
              {optimizeImages && (
                <p className="text-muted-foreground text-xs">
                  Images will be automatically optimized before upload
                </p>
              )}
            </>
          )}

          {isOptimizing && (
            <p className="text-muted-foreground mt-4 text-sm">
              Optimizing images...
            </p>
          )}
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Selected Files ({files.length})</h3>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <FilePreview
                key={uploadedFile.id}
                file={uploadedFile.file}
                preview={uploadedFile.preview}
                optimized={uploadedFile.optimized}
                progress={progress[uploadedFile.file.name]}
                onRemove={() => removeFile(uploadedFile.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(progress).length > 0 && (
        <UploadProgress progress={progress} />
      )}

      {/* Actions */}
      {files.length > 0 && !isUploading && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || isOptimizing}
            className="flex-1"
          >
            Upload {files.length} file(s)
          </Button>
          <Button
            variant="outline"
            onClick={clearAll}
            disabled={isUploading || isOptimizing}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Re-export getFileIcon for external use
export { getFileIcon }
