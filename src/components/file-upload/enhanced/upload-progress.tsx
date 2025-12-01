/**
 * Upload Progress Component
 * Shows aggregate upload progress for multiple files
 */

"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, XCircle } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface UploadProgressProps {
  progress: Record<string, {
    progress: number;
    speed: number;
    eta: number;
    status: "pending" | "uploading" | "paused" | "completed" | "failed";
    error?: string;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export function UploadProgress({ progress }: UploadProgressProps) {
  // Calculate aggregate stats
  const files = Object.entries(progress);
  const totalFiles = files.length;
  const completedFiles = files.filter(([, p]) => p.status === "completed").length;
  const failedFiles = files.filter(([, p]) => p.status === "failed").length;
  const uploadingFiles = files.filter(([, p]) => p.status === "uploading").length;

  // Calculate overall progress (average of all files)
  const overallProgress = totalFiles > 0
    ? files.reduce((sum, [, p]) => sum + p.progress, 0) / totalFiles
    : 0;

  // Calculate aggregate upload speed
  const totalSpeed = files
    .filter(([, p]) => p.status === "uploading")
    .reduce((sum, [, p]) => sum + p.speed, 0);

  // Calculate estimated time for remaining files
  const avgEta = uploadingFiles > 0
    ? files
        .filter(([, p]) => p.status === "uploading")
        .reduce((sum, [, p]) => sum + p.eta, 0) / uploadingFiles
    : 0;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Upload Progress</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            {completedFiles}/{totalFiles} files
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Uploading */}
          {uploadingFiles > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {uploadingFiles} uploading
              </span>
            </div>
          )}

          {/* Completed */}
          {completedFiles > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {completedFiles} completed
              </span>
            </div>
          )}

          {/* Failed */}
          {failedFiles > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                {failedFiles} failed
              </span>
            </div>
          )}

          {/* Speed */}
          {totalSpeed > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Speed: {formatSpeed(totalSpeed)}
              </span>
            </div>
          )}

          {/* ETA */}
          {avgEta > 0 && uploadingFiles > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                ETA: {formatETA(avgEta)}
              </span>
            </div>
          )}
        </div>

        {/* Individual File Progress (collapsed) */}
        {files.length <= 3 && (
          <div className="space-y-1 pt-2 border-t">
            {files.map(([filename, fileProgress]) => (
              <div key={filename} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1 text-muted-foreground">
                  {filename}
                </span>
                <span className="font-medium ms-2">
                  {Math.round(fileProgress.progress)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

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
