"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Responsive grid container for card layouts
 */
interface GridContainerProps {
  /** Grid children */
  children: React.ReactNode
  /** Number of columns (responsive) */
  columns?: 1 | 2 | 3 | 4
  /** Gap between items */
  gap?: "sm" | "default" | "lg"
  /** Additional class names */
  className?: string
}

export function GridContainer({
  children,
  columns = 3,
  gap = "default",
  className,
}: GridContainerProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  const gapSizes = {
    sm: "gap-2",
    default: "gap-4",
    lg: "gap-6",
  }

  return (
    <div className={cn("grid", gridCols[columns], gapSizes[gap], className)}>
      {children}
    </div>
  )
}
