"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import {
  FileIcon,
  FileText,
  ImageIcon,
  Music,
  Upload,
  VideoIcon,
  X,
} from "lucide-react"
import { useDropzone, type FileRejection } from "react-dropzone"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatBytes, getCategoryFromMimeType } from "@/components/file/config"
import type { FileCategory, UploadProgress } from "@/components/file/types"

import {
  uploadMessageAttachment,
  type AttachmentUploadResult,
} from "./upload-actions"

// Size limits for message attachments (more restrictive than general uploads)
const ATTACHMENT_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  audio: 25 * 1024 * 1024, // 25 MB
  document: 50 * 1024 * 1024, // 50 MB
  other: 25 * 1024 * 1024, // 25 MB
} as const

// Allowed MIME types for messaging
const ALLOWED_MIME_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/plain": [".txt"],
}

interface AttachmentFile {
  id: string
  file: File
  preview?: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
  result?: AttachmentUploadResult
}

interface AttachmentUploadProps {
  /** Conversation ID for scoping uploads */
  conversationId: string
  /** Maximum number of files allowed */
  maxFiles?: number
  /** Callback when files are successfully uploaded */
  onUploadComplete?: (attachments: AttachmentUploadResult[]) => void
  /** Callback when upload starts */
  onUploadStart?: () => void
  /** Whether uploads are disabled */
  disabled?: boolean
  /** Custom class name */
  className?: string
  /** Dictionary for i18n */
  dictionary?: {
    ui?: {
      attachment?: string
      attachments?: string
      download?: string
    }
    actions?: {
      upload_file?: string
      attach_file?: string
      cancel?: string
    }
    errors?: {
      attachment_too_large?: string
      invalid_file_type?: string
      attachment_upload_failed?: string
    }
    form?: {
      message_placeholder?: string
    }
  }
}

function getFileIcon(category: FileCategory) {
  switch (category) {
    case "image":
      return ImageIcon
    case "video":
      return VideoIcon
    case "audio":
      return Music
    case "document":
      return FileText
    default:
      return FileIcon
  }
}

export function AttachmentUpload({
  conversationId,
  maxFiles = 5,
  onUploadComplete,
  onUploadStart,
  disabled = false,
  className,
  dictionary,
}: AttachmentUploadProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = useCallback(
    (file: File): string | null => {
      const category = getCategoryFromMimeType(file.type)
      const sizeLimit =
        ATTACHMENT_SIZE_LIMITS[
          category as keyof typeof ATTACHMENT_SIZE_LIMITS
        ] || ATTACHMENT_SIZE_LIMITS.other

      if (file.size > sizeLimit) {
        const maxMB = Math.round(sizeLimit / (1024 * 1024))
        return (
          dictionary?.errors?.attachment_too_large?.replace(
            "{max}",
            String(maxMB)
          ) || `File exceeds ${maxMB}MB limit`
        )
      }

      if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.type)) {
        return (
          dictionary?.errors?.invalid_file_type ||
          "This file type is not allowed"
        )
      }

      return null
    },
    [dictionary]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Check max files limit
      const currentCount = files.filter((f) => f.status !== "error").length
      const availableSlots = maxFiles - currentCount

      if (availableSlots <= 0) {
        return
      }

      // Process accepted files
      const newFiles: AttachmentFile[] = acceptedFiles
        .slice(0, availableSlots)
        .map((file) => {
          const error = validateFile(file)
          const category = getCategoryFromMimeType(file.type)

          return {
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            preview:
              category === "image" ? URL.createObjectURL(file) : undefined,
            status: error ? "error" : "pending",
            progress: 0,
            error: error || undefined,
          } as AttachmentFile
        })

      // Add rejected files with errors
      rejectedFiles
        .slice(0, availableSlots - newFiles.length)
        .forEach((rejected) => {
          newFiles.push({
            id: `${rejected.file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file: rejected.file,
            status: "error",
            progress: 0,
            error: rejected.errors[0]?.message || "File rejected",
          })
        })

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files, maxFiles, validateFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES,
    maxFiles: maxFiles - files.filter((f) => f.status !== "error").length,
    disabled: disabled || isUploading,
    multiple: true,
  })

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }, [])

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    onUploadStart?.()

    const results: AttachmentUploadResult[] = []

    for (const attachmentFile of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === attachmentFile.id
            ? { ...f, status: "uploading" as const, progress: 0 }
            : f
        )
      )

      try {
        // Create FormData
        const formData = new FormData()
        formData.append("file", attachmentFile.file)
        formData.append("conversationId", conversationId)

        // Simulate progress (actual progress would come from fetch with progress)
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === attachmentFile.id && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          )
        }, 100)

        // Upload
        const result = await uploadMessageAttachment(formData)

        clearInterval(progressInterval)

        if (result.success && result.data) {
          results.push(result.data)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === attachmentFile.id
                ? {
                    ...f,
                    status: "success" as const,
                    progress: 100,
                    result: result.data,
                  }
                : f
            )
          )
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === attachmentFile.id
                ? {
                    ...f,
                    status: "error" as const,
                    progress: 0,
                    error: "error" in result ? result.error : "Upload failed",
                  }
                : f
            )
          )
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === attachmentFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  progress: 0,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        )
      }
    }

    setIsUploading(false)

    if (results.length > 0) {
      onUploadComplete?.(results)
    }
  }, [files, conversationId, onUploadStart, onUploadComplete])

  // Auto-upload when files are added
  React.useEffect(() => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length > 0 && !isUploading) {
      uploadFiles()
    }
  }, [files, isUploading, uploadFiles])

  // Cleanup preview URLs
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  const hasFiles = files.length > 0
  const pendingCount = files.filter(
    (f) => f.status === "pending" || f.status === "uploading"
  ).length

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-border hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors",
          isDragActive && "border-primary bg-primary/5",
          (disabled || isUploading) && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="text-muted-foreground mb-2 h-6 w-6" />
        <p className="text-muted-foreground text-sm">
          {isDragActive
            ? "Drop files here..."
            : dictionary?.actions?.attach_file ||
              "Drop files or click to upload"}
        </p>
        <p className="text-muted-foreground/60 mt-1 text-xs">
          Max {maxFiles} files. Images, videos, audio, documents.
        </p>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="space-y-2">
          {files.map((file) => {
            const category = getCategoryFromMimeType(file.file.type)
            const IconComponent = getFileIcon(category)

            return (
              <div
                key={file.id}
                className={cn(
                  "bg-muted/50 flex items-center gap-3 rounded-lg p-2",
                  file.status === "error" && "bg-destructive/10"
                )}
              >
                {/* Preview or icon */}
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
                    <IconComponent className="text-muted-foreground h-5 w-5" />
                  </div>
                )}

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {file.file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(file.file.size)}
                    {file.error && (
                      <span className="text-destructive ms-2">
                        {file.error}
                      </span>
                    )}
                  </p>

                  {/* Progress bar */}
                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="mt-1 h-1" />
                  )}
                </div>

                {/* Status indicator */}
                {file.status === "success" && (
                  <span className="text-success text-xs">Uploaded</span>
                )}

                {/* Remove button */}
                {file.status !== "uploading" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeFile(file.id)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Inline attachment button for message input
 */
interface AttachmentButtonProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  className?: string
}

export function AttachmentButton({
  onFilesSelected,
  disabled = false,
  className,
}: AttachmentButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        <Upload className="h-5 w-5" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={Object.keys(ALLOWED_MIME_TYPES).join(",")}
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}

export default AttachmentUpload
