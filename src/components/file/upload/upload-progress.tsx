/**
 * Unified File Block - Upload Progress Component
 * Displays upload progress with status indicators
 */

"use client"

import * as React from "react"
import { AlertCircle, CheckCircle, File, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { formatBytes } from "../formatters"
import type { UploadProgress as UploadProgressType } from "../types"

// ============================================================================
// Types
// ============================================================================

interface UploadProgressProps {
  progress: UploadProgressType
  onCancel?: () => void
  onRetry?: () => void
  showDetails?: boolean
  className?: string
}

interface BatchUploadProgressProps {
  items: UploadProgressType[]
  onCancelAll?: () => void
  onRetry?: (filename: string) => void
  className?: string
}

// ============================================================================
// Single Upload Progress
// ============================================================================

export function UploadProgress({
  progress,
  onCancel,
  onRetry,
  showDetails = true,
  className,
}: UploadProgressProps) {
  const statusColors: Record<UploadProgressType["status"], string> = {
    pending: "text-muted-foreground",
    uploading: "text-primary",
    success: "text-green-500",
    error: "text-destructive",
  }

  const statusIcons: Record<UploadProgressType["status"], React.ReactElement> =
    {
      pending: <File className="h-4 w-4" />,
      uploading: <Loader2 className="h-4 w-4 animate-spin" />,
      success: <CheckCircle className="h-4 w-4" />,
      error: <AlertCircle className="h-4 w-4" />,
    }

  return (
    <div
      className={cn("border-border bg-card rounded-lg border p-4", className)}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={cn("mt-0.5", statusColors[progress.status])}>
          {statusIcons[progress.status]}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Filename */}
          <p className="truncate text-sm font-medium">
            {progress.filename || progress.fileName}
          </p>

          {/* Progress Bar */}
          {progress.status === "uploading" && (
            <Progress
              value={progress.percentage ?? progress.progress}
              className="mt-2 h-1.5"
            />
          )}

          {/* Details */}
          {showDetails && (
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
              {progress.status === "uploading" && (
                <>
                  <span>
                    {formatBytes(progress.loaded ?? 0)} /{" "}
                    {formatBytes(progress.total ?? 0)}
                  </span>
                  <span>•</span>
                  <span>
                    {Math.round(progress.percentage ?? progress.progress)}%
                  </span>
                </>
              )}
              {progress.status === "success" && <span>Upload complete</span>}
              {progress.status === "error" && progress.error && (
                <span className="text-destructive">{progress.error}</span>
              )}
              {progress.currentFile && progress.totalFiles && (
                <>
                  <span>•</span>
                  <span>
                    File {progress.currentFile} of {progress.totalFiles}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {progress.status === "uploading" && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {progress.status === "error" && onRetry && (
            <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Batch Upload Progress
// ============================================================================

export function BatchUploadProgress({
  items,
  onCancelAll,
  onRetry,
  className,
}: BatchUploadProgressProps) {
  const completed = items.filter((i) => i.status === "success").length
  const failed = items.filter((i) => i.status === "error").length
  const uploading = items.filter((i) => i.status === "uploading").length
  const pending = items.filter((i) => i.status === "pending").length

  const totalProgress =
    items.reduce((sum, item) => sum + (item.percentage ?? item.progress), 0) /
    items.length

  return (
    <div className={cn("border-border bg-card rounded-lg border", className)}>
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b p-4">
        <div>
          <h4 className="font-medium">Uploading {items.length} files</h4>
          <p className="text-muted-foreground text-sm">
            {completed} completed
            {failed > 0 && `, ${failed} failed`}
            {uploading > 0 && `, ${uploading} uploading`}
            {pending > 0 && `, ${pending} pending`}
          </p>
        </div>
        {onCancelAll && uploading > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancelAll}>
            Cancel All
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="border-border border-b p-4">
        <Progress value={totalProgress} className="h-2" />
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {Math.round(totalProgress)}% complete
        </p>
      </div>

      {/* Item List */}
      <div className="max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={`${item.filename}-${index}`}
            className="border-border flex items-center gap-3 border-b p-3 last:border-0"
          >
            {/* Status Icon */}
            <div
              className={cn(
                item.status === "success" && "text-green-500",
                item.status === "error" && "text-destructive",
                item.status === "uploading" && "text-primary",
                item.status === "pending" && "text-muted-foreground"
              )}
            >
              {item.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : item.status === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : item.status === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <File className="h-4 w-4" />
              )}
            </div>

            {/* Filename */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                {item.filename || item.fileName}
              </p>
              {item.status === "uploading" && (
                <Progress
                  value={item.percentage ?? item.progress}
                  className="mt-1 h-1"
                />
              )}
              {item.error && (
                <p className="text-destructive truncate text-xs">
                  {item.error}
                </p>
              )}
            </div>

            {/* Percentage / Actions */}
            <div className="text-muted-foreground text-sm">
              {item.status === "uploading" &&
                `${Math.round(item.percentage ?? item.progress)}%`}
              {item.status === "error" && onRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(item.filename || item.fileName)}
                  className="h-6 px-2 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Minimal Progress Indicator
// ============================================================================

interface MinimalProgressProps {
  percentage: number
  status: UploadProgressType["status"]
  className?: string
}

export function MinimalProgress({
  percentage,
  status,
  className,
}: MinimalProgressProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === "uploading" && (
        <>
          <Loader2 className="text-primary h-4 w-4 animate-spin" />
          <span className="text-sm">{Math.round(percentage)}%</span>
        </>
      )}
      {status === "success" && (
        <CheckCircle className="h-4 w-4 text-green-500" />
      )}
      {status === "error" && (
        <AlertCircle className="text-destructive h-4 w-4" />
      )}
    </div>
  )
}

export type {
  UploadProgressProps,
  BatchUploadProgressProps,
  MinimalProgressProps,
}
