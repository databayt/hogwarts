"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { FileText, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { ConfidenceScoreDisplay } from "./confidence-score-display"
import {
  ProcessingStatusBadge,
  type ProcessingStatus,
} from "./processing-status-badge"

interface ProcessingProgressCardProps {
  fileName: string
  status: ProcessingStatus
  confidence?: number
  error?: string
  onRetry?: () => void
  dictionary: Record<string, any>
  className?: string
}

export const ProcessingProgressCard = React.memo(
  function ProcessingProgressCard({
    fileName,
    status,
    confidence,
    error,
    onRetry,
    dictionary,
    className,
  }: ProcessingProgressCardProps) {
    const retryLabel = dictionary?.documentProcessing?.retry ?? "retry"

    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-start gap-3 p-4">
          <FileText
            className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1 space-y-2">
            {/* File name and status */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-foreground truncate text-sm font-medium">
                {fileName}
              </p>
              <ProcessingStatusBadge status={status} dictionary={dictionary} />
            </div>

            {/* Confidence score when completed */}
            {status === "COMPLETED" && confidence !== undefined && (
              <ConfidenceScoreDisplay
                confidence={confidence}
                size="sm"
                dictionary={dictionary}
              />
            )}

            {/* Error message and retry when failed */}
            {status === "FAILED" && (
              <div className="flex items-center justify-between gap-2">
                {error && (
                  <p className="text-destructive min-w-0 truncate text-xs">
                    {error}
                  </p>
                )}
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="h-7 shrink-0 gap-1.5 px-2 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    {retryLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

export type { ProcessingProgressCardProps }
