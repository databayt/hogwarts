/**
 * Unified File Block - Uploader Component
 * Drag-and-drop file uploader with preview and progress
 */

"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import {
  AlertCircle,
  Archive,
  CheckCircle,
  File,
  FileText,
  Image,
  Loader2,
  Music,
  Upload,
  Video,
  X,
} from "lucide-react"
import { useDropzone, type DropzoneOptions } from "react-dropzone"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { formatBytes } from "../formatters"
import type {
  FileCategory,
  FileType,
  StorageProvider,
  StorageTier,
  UploadProgress,
} from "../types"
import { useUpload, type UploadResult } from "./use-upload"

// ============================================================================
// Types
// ============================================================================

interface UploaderProps {
  category: FileCategory
  type?: FileType
  folder?: string
  provider?: StorageProvider
  tier?: StorageTier
  maxSize?: number
  maxFiles?: number
  allowedTypes?: string[]
  className?: string
  disabled?: boolean
  showPreview?: boolean
  showFileList?: boolean
  variant?: "default" | "compact" | "avatar" | "banner"
  placeholder?: string
  accept?: Record<string, string[]>
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: string) => void
  onFilesChange?: (files: UploadResult[]) => void
  dictionary?: {
    dropzone?: string
    browse?: string
    uploading?: string
    uploadComplete?: string
    uploadFailed?: string
    remove?: string
    maxSize?: string
  }
}

interface FilePreview {
  file: File
  preview?: string
  status: "pending" | "uploading" | "completed" | "error"
  progress: number
  error?: string
  result?: UploadResult
}

// ============================================================================
// Icon Mapping
// ============================================================================

const categoryIcons: Record<FileCategory, React.ReactNode> = {
  image: <Image className="text-muted-foreground h-8 w-8" />,
  video: <Video className="text-muted-foreground h-8 w-8" />,
  document: <FileText className="text-muted-foreground h-8 w-8" />,
  audio: <Music className="text-muted-foreground h-8 w-8" />,
  archive: <Archive className="text-muted-foreground h-8 w-8" />,
  other: <File className="text-muted-foreground h-8 w-8" />,
}

// ============================================================================
// Component
// ============================================================================

export function Uploader({
  category,
  type,
  folder,
  provider,
  tier,
  maxSize,
  maxFiles = 10,
  allowedTypes,
  className,
  disabled = false,
  showPreview = true,
  showFileList = true,
  variant = "default",
  placeholder,
  accept,
  onUploadComplete,
  onUploadError,
  onFilesChange,
  dictionary,
}: UploaderProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([])

  const {
    isUploading,
    progress,
    error,
    uploadedFiles,
    upload,
    uploadMultiple,
    remove,
    validate,
    getAcceptedTypes,
  } = useUpload({
    category,
    type,
    folder,
    provider,
    tier,
    maxSize,
    maxFiles,
    allowedTypes,
    onSuccess: (result) => {
      setPreviews((prev) =>
        prev.map((p) =>
          p.file.name === result.originalName
            ? { ...p, status: "completed", progress: 100, result }
            : p
        )
      )
    },
    onError: (err, filename) => {
      setPreviews((prev) =>
        prev.map((p) =>
          p.file.name === filename ? { ...p, status: "error", error: err } : p
        )
      )
      onUploadError?.(err)
    },
  })

  // Update parent when files change
  React.useEffect(() => {
    onFilesChange?.(uploadedFiles)
  }, [uploadedFiles, onFilesChange])

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return

      // Create previews
      const newPreviews: FilePreview[] = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: "pending" as const,
        progress: 0,
      }))

      setPreviews((prev) => [...prev, ...newPreviews])

      // Upload files
      const results = await uploadMultiple(acceptedFiles)

      if (results.length > 0) {
        onUploadComplete?.(results)
      }
    },
    [disabled, uploadMultiple, onUploadComplete]
  )

  // Remove file preview
  const removePreview = useCallback(
    async (index: number) => {
      const preview = previews[index]
      if (preview.result) {
        await remove(preview.result.id)
      }
      if (preview.preview) {
        URL.revokeObjectURL(preview.preview)
      }
      setPreviews((prev) => prev.filter((_, i) => i !== index))
    },
    [previews, remove]
  )

  // Configure dropzone
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: accept || getAcceptedTypes(),
    maxSize,
    maxFiles,
    disabled: disabled || isUploading,
    multiple: maxFiles > 1,
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone(dropzoneOptions)

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview)
      })
    }
  }, [])

  // ============================================================================
  // Render Variants
  // ============================================================================

  if (variant === "avatar") {
    return (
      <div className={cn("relative", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "border-border bg-muted/50 relative h-32 w-32 rounded-full border-2 border-dashed",
            "flex cursor-pointer items-center justify-center transition-colors",
            isDragActive && "border-primary bg-primary/10",
            isDragReject && "border-destructive bg-destructive/10",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input {...getInputProps()} />
          {previews.length > 0 && previews[0].preview ? (
            <img
              src={previews[0].preview}
              alt="Avatar preview"
              className="h-full w-full rounded-full object-cover"
            />
          ) : uploadedFiles.length > 0 ? (
            <img
              src={uploadedFiles[0].url}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <Upload className="text-muted-foreground h-8 w-8" />
          )}
          {isUploading && (
            <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-full">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          {...getRootProps()}
          className="relative"
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {dictionary?.browse || "Upload"}
        </Button>
        {uploadedFiles.length > 0 && (
          <span className="text-muted-foreground text-sm">
            {uploadedFiles.length} file(s) uploaded
          </span>
        )}
        {error && <span className="text-destructive text-sm">{error}</span>}
      </div>
    )
  }

  // ============================================================================
  // Default Render
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-border relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed",
          "bg-muted/50 cursor-pointer p-8 text-center transition-colors",
          isDragActive && "border-primary bg-primary/10",
          isDragReject && "border-destructive bg-destructive/10",
          disabled && "cursor-not-allowed opacity-50",
          variant === "banner" && "h-48"
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            <p className="text-muted-foreground text-sm">
              {dictionary?.uploading || "Uploading..."}
            </p>
            {progress && (
              <Progress value={progress.percentage} className="w-48" />
            )}
          </div>
        ) : (
          <>
            {categoryIcons[category]}
            <p className="mt-4 text-sm font-medium">
              {isDragActive
                ? dictionary?.dropzone || "Drop files here"
                : placeholder || "Drag & drop files here, or click to browse"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {maxSize &&
                `${dictionary?.maxSize || "Max size"}: ${formatBytes(maxSize)}`}
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* File List */}
      {showFileList && previews.length > 0 && (
        <div className="space-y-2">
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${index}`}
              className="border-border bg-card flex items-center gap-3 rounded-lg border p-3"
            >
              {/* Preview/Icon */}
              {showPreview && preview.preview ? (
                <img
                  src={preview.preview}
                  alt={preview.file.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
                  {categoryIcons[category]}
                </div>
              )}

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {preview.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(preview.file.size)}
                </p>
                {preview.status === "uploading" && (
                  <Progress value={preview.progress} className="mt-1 h-1" />
                )}
                {preview.error && (
                  <p className="text-destructive text-xs">{preview.error}</p>
                )}
              </div>

              {/* Status/Actions */}
              <div className="flex items-center gap-2">
                {preview.status === "uploading" && (
                  <Loader2 className="text-primary h-4 w-4 animate-spin" />
                )}
                {preview.status === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {preview.status === "error" && (
                  <AlertCircle className="text-destructive h-4 w-4" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePreview(index)}
                  disabled={preview.status === "uploading"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export type { UploaderProps }
