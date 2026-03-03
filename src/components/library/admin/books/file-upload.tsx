"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"
import Image from "next/image"
import { FileText, Film, Image as ImageIcon, Upload, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { uploadFile } from "@/components/file"

// ============================================================================
// Types
// ============================================================================

interface Props {
  value: string
  onChange: (url: string) => void
  accept?: "image" | "video" | "document"
  placeholder?: string
  schoolId?: string
}

const ACCEPT_TYPES = {
  image: {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  },
  video: {
    "video/*": [".mp4", ".mov", ".avi", ".webm"],
  },
  document: {
    "application/pdf": [".pdf"],
  },
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ============================================================================
// Component
// ============================================================================

/**
 * S3/CloudFront file upload component for library book images
 */
export default function FileUpload({
  value,
  onChange,
  accept = "image",
  placeholder,
  schoolId,
}: Props) {
  const [showUploader, setShowUploader] = useState(!value)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 10MB limit")
        return
      }

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)
      }

      // Upload via S3
      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", accept === "image" ? "image" : accept)
        formData.append("folder", "library/books")
        if (schoolId) formData.append("schoolId", schoolId)

        const result = await uploadFile(formData)
        if (result.success) {
          onChange(result.url)
          setShowUploader(false)
          setPreviewUrl(null)
          toast.success("File uploaded successfully")
        } else {
          const msg = result.error || "Upload failed"
          setError(msg)
          toast.error(msg)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setError(msg)
        toast.error(msg)
      } finally {
        setIsUploading(false)
        setProgress(100)
      }
    },
    [accept, onChange, schoolId]
  )

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPT_TYPES[accept],
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      multiple: false,
      disabled: isUploading,
    })

  // Handle remove
  const handleRemove = () => {
    onChange("")
    setShowUploader(true)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // Get icon based on accept type
  const getIcon = () => {
    switch (accept) {
      case "image":
        return ImageIcon
      case "video":
        return Film
      case "document":
        return FileText
      default:
        return Upload
    }
  }

  const Icon = getIcon()

  // ============================================================================
  // Render: Uploaded File Preview
  // ============================================================================

  if (value && !showUploader) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border">
          {accept === "image" && (
            <div className="bg-muted relative aspect-[3/4] w-full">
              <Image
                src={value}
                alt="Book cover"
                fill
                className="object-cover"
              />
            </div>
          )}
          {accept === "video" && (
            <div className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 rounded-full p-2">
                <Film className="text-primary h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Video uploaded</p>
                <p className="text-muted-foreground truncate text-xs">
                  {value}
                </p>
              </div>
            </div>
          )}
          {accept === "document" && (
            <div className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 rounded-full p-2">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Document uploaded</p>
                <p className="text-muted-foreground truncate text-xs">
                  {value}
                </p>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="bg-background/80 absolute end-2 top-2 backdrop-blur-sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // Render: Upload Dropzone
  // ============================================================================

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "cursor-pointer border-2 border-dashed transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          isUploading && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {/* Preview during upload */}
          {previewUrl && accept === "image" && (
            <div className="relative mb-4 h-44 w-32 overflow-hidden rounded-lg">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Upload progress */}
          {isUploading ? (
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Uploading...
                </span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Icon className="text-muted-foreground mb-4 h-12 w-12" />

              {isDragActive ? (
                isDragReject ? (
                  <p className="text-destructive">File type not accepted</p>
                ) : (
                  <p className="text-primary">Drop file here</p>
                )
              ) : (
                <>
                  <p className="mb-2 text-lg font-medium">
                    {placeholder ||
                      `Drag & drop ${accept} here, or click to select`}
                  </p>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Max file size: 10MB
                  </p>
                </>
              )}
            </>
          )}

          {/* Error message */}
          {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
        </div>
      </Card>
    </div>
  )
}
