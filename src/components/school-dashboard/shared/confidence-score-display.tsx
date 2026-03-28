"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { cn } from "@/lib/utils"

type ConfidenceLevel = "high" | "medium" | "low"

interface ConfidenceScoreDisplayProps {
  confidence: number
  size?: "sm" | "md"
  dictionary: Record<string, any>
  className?: string
}

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return "high"
  if (confidence >= 0.5) return "medium"
  return "low"
}

const levelStyles: Record<ConfidenceLevel, { dot: string; text: string }> = {
  high: {
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
  },
  medium: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  low: {
    dot: "bg-destructive",
    text: "text-destructive",
  },
}

export const ConfidenceScoreDisplay = React.memo(
  function ConfidenceScoreDisplay({
    confidence,
    size = "md",
    dictionary,
    className,
  }: ConfidenceScoreDisplayProps) {
    const level = getConfidenceLevel(confidence)
    const styles = levelStyles[level]
    const label = dictionary?.documentProcessing?.confidence?.[level] ?? level
    const percentage = Math.round(confidence * 100)

    const isSm = size === "sm"

    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5",
          isSm ? "text-xs" : "text-sm",
          className
        )}
      >
        <span
          className={cn(
            "shrink-0 rounded-full",
            isSm ? "h-1.5 w-1.5" : "h-2 w-2",
            styles.dot
          )}
          aria-hidden="true"
        />
        <span className={cn("font-medium", styles.text)}>{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
    )
  }
)

export type { ConfidenceScoreDisplayProps, ConfidenceLevel }
