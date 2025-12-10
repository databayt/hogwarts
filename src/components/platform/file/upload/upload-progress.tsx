/**
 * Unified File Block - Upload Progress Component
 * Displays upload progress with status indicators
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, AlertCircle, X, File } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { UploadProgress as UploadProgressType } from "../types";
import { formatBytes } from "../shared/formatters";

// ============================================================================
// Types
// ============================================================================

interface UploadProgressProps {
  progress: UploadProgressType;
  onCancel?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

interface BatchUploadProgressProps {
  items: UploadProgressType[];
  onCancelAll?: () => void;
  onRetry?: (filename: string) => void;
  className?: string;
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
  };

  const statusIcons: Record<UploadProgressType["status"], React.ReactElement> = {
    pending: <File className="h-4 w-4" />,
    uploading: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={cn("mt-0.5", statusColors[progress.status])}>
          {statusIcons[progress.status]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Filename */}
          <p className="truncate font-medium text-sm">{progress.filename || progress.fileName}</p>

          {/* Progress Bar */}
          {progress.status === "uploading" && (
            <Progress value={progress.percentage ?? progress.progress} className="mt-2 h-1.5" />
          )}

          {/* Details */}
          {showDetails && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {progress.status === "uploading" && (
                <>
                  <span>{formatBytes(progress.loaded ?? 0)} / {formatBytes(progress.total ?? 0)}</span>
                  <span>•</span>
                  <span>{Math.round(progress.percentage ?? progress.progress)}%</span>
                </>
              )}
              {progress.status === "success" && (
                <span>Upload complete</span>
              )}
              {progress.status === "error" && progress.error && (
                <span className="text-destructive">{progress.error}</span>
              )}
              {progress.currentFile && progress.totalFiles && (
                <>
                  <span>•</span>
                  <span>File {progress.currentFile} of {progress.totalFiles}</span>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
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
  const completed = items.filter((i) => i.status === "success").length;
  const failed = items.filter((i) => i.status === "error").length;
  const uploading = items.filter((i) => i.status === "uploading").length;
  const pending = items.filter((i) => i.status === "pending").length;

  const totalProgress = items.reduce((sum, item) => sum + (item.percentage ?? item.progress), 0) / items.length;

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h4 className="font-medium">Uploading {items.length} files</h4>
          <p className="text-sm text-muted-foreground">
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
      <div className="p-4 border-b border-border">
        <Progress value={totalProgress} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {Math.round(totalProgress)}% complete
        </p>
      </div>

      {/* Item List */}
      <div className="max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={`${item.filename}-${index}`}
            className="flex items-center gap-3 border-b border-border last:border-0 p-3"
          >
            {/* Status Icon */}
            <div className={cn(
              item.status === "success" && "text-green-500",
              item.status === "error" && "text-destructive",
              item.status === "uploading" && "text-primary",
              item.status === "pending" && "text-muted-foreground"
            )}>
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
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm">{item.filename || item.fileName}</p>
              {item.status === "uploading" && (
                <Progress value={item.percentage ?? item.progress} className="mt-1 h-1" />
              )}
              {item.error && (
                <p className="text-xs text-destructive truncate">{item.error}</p>
              )}
            </div>

            {/* Percentage / Actions */}
            <div className="text-sm text-muted-foreground">
              {item.status === "uploading" && `${Math.round(item.percentage ?? item.progress)}%`}
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
  );
}

// ============================================================================
// Minimal Progress Indicator
// ============================================================================

interface MinimalProgressProps {
  percentage: number;
  status: UploadProgressType["status"];
  className?: string;
}

export function MinimalProgress({ percentage, status, className }: MinimalProgressProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === "uploading" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">{Math.round(percentage)}%</span>
        </>
      )}
      {status === "success" && (
        <CheckCircle className="h-4 w-4 text-green-500" />
      )}
      {status === "error" && (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
    </div>
  );
}

export type { UploadProgressProps, BatchUploadProgressProps, MinimalProgressProps };
