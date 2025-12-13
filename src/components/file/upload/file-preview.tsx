/**
 * File Preview Component
 * Shows file thumbnail, name, size, and upload progress
 */

"use client";

import { X, Check, AlertCircle, Loader2, Image, FileText, Film, Music, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface FilePreviewProps {
  file: File;
  preview?: string;
  optimized?: boolean;
  progress?: {
    progress: number;
    speed: number;
    eta: number;
    status: "pending" | "uploading" | "paused" | "completed" | "failed";
    error?: string;
  };
  onRemove: () => void;
}

// ============================================================================
// File Type Icon Helper
// ============================================================================

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return Archive;
  return FileText;
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
  const Icon = getFileIcon(file.type);
  const isUploading = progress?.status === "uploading";
  const isCompleted = progress?.status === "completed";
  const isFailed = progress?.status === "failed";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg transition-colors",
        isCompleted && "border-green-500/50 bg-green-500/5",
        isFailed && "border-destructive/50 bg-destructive/5"
      )}
    >
      {/* Thumbnail/Icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          {optimized && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
              Optimized
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
          <Progress
            value={progress.progress}
            className="mt-2 h-1.5"
          />
        )}
      </div>

      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isUploading && (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        )}
        {isCompleted && (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {isFailed && (
          <AlertCircle className="w-5 h-5 text-destructive" />
        )}
        {!progress && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
