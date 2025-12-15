/**
 * File Preview Component
 * Shows file thumbnail, name, size, and upload progress
 */

"use client"

import {
  AlertCircle,
  Archive,
  Check,
  FileText,
  Film,
  Image,
  Loader2,
  Music,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// ============================================================================
// Types
// ============================================================================

interface FilePreviewProps {
  file: File
  preview?: string
  optimized?: boolean
  progress?: {
    progress: number
    speed: number
    eta: number
    status: "pending" | "uploading" | "paused" | "completed" | "failed"
    error?: string
  }
  onRemove: () => void
}

// ============================================================================
// File Type Icon Helper
// ============================================================================

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image
  if (mimeType.startsWith("video/")) return Film
  if (mimeType.startsWith("audio/")) return Music
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar")
  )
    return Archive
  return FileText
}

// ============================================================================
// Component
// ============================================================================

export function FilePreview({
  file,
  preview,
  optimized,
  progress,
  onRemove,
}: FilePreviewProps) {
  const Icon = getFileIcon(file.type)
  const isUploading = progress?.status === "uploading"
  const isCompleted = progress?.status === "completed"
  const isFailed = progress?.status === "failed"

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isCompleted && "border-green-500/50 bg-green-500/5",
        isFailed && "border-destructive/50 bg-destructive/5"
      )}
    >
      {/* Thumbnail/Icon */}
      <div className="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="text-muted-foreground h-6 w-6" />
        )}
      </div>

      {/* File Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="truncate text-sm font-medium">{file.name}</p>
          {optimized && (
            <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-600 dark:text-green-400">
              Optimized
            </span>
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>{formatBytes(file.size)}</span>
          {isUploading && progress && (
            <>
              <span>•</span>
              <span>{formatSpeed(progress.speed)}</span>
              <span>•</span>
              <span>ETA: {formatETA(progress.eta)}</span>
            </>
          )}
          {isFailed && progress?.error && (
            <>
              <span>•</span>
              <span className="text-destructive">{progress.error}</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {progress && !isCompleted && !isFailed && (
          <Progress value={progress.progress} className="mt-2 h-1.5" />
        )}
      </div>

      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isUploading && (
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        )}
        {isCompleted && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
        {isFailed && <AlertCircle className="text-destructive h-5 w-5" />}
        {!progress && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
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

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
  if (bytesPerSecond < 1024 * 1024)
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.ceil((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}
