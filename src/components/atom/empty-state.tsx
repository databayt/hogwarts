"use client"

import * as React from "react"
import { FileQuestion } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Empty state component for when there's no data
 */
interface EmptyStateProps {
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Action element (button, link, etc.) */
  action?: React.ReactNode
  /** Icon element */
  icon?: React.ReactNode
  /** Additional class names */
  className?: string
}

export function EmptyState({
  title = "No items found",
  description = "Try adjusting your search or filters",
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="text-muted-foreground mb-4">{icon}</div>
      ) : (
        <FileQuestion className="text-muted-foreground mb-4 h-12 w-12" />
      )}
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Alias for backward compatibility with GridEmptyState
 */
export const GridEmptyState = EmptyState
