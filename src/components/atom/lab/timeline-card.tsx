"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

import type { CardSize } from "./types"

interface TimelineCardProps {
  /**
   * Timeline entry title
   */
  title: string
  /**
   * Timeline entry description
   */
  description?: string
  /**
   * Timestamp
   */
  timestamp: string
  /**
   * Icon element
   */
  icon?: React.ReactNode
  /**
   * Show connector line
   * @default true
   */
  showConnector?: boolean
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * TimelineCard - Timeline entry card
 *
 * Perfect for activity feeds, history logs, or step-by-step processes.
 * Can be stacked vertically to create a complete timeline.
 *
 * @example
 * ```tsx
 * <TimelineCard
 *   icon={<CheckCircle className="h-5 w-5 text-success" />}
 *   title="Assignment Submitted"
 *   description="John Doe submitted Math Homework #5"
 *   timestamp="2 hours ago"
 *   showConnector
 * />
 * ```
 */
export function TimelineCard({
  title,
  description,
  timestamp,
  icon,
  showConnector = true,
  size = "md",
  onClick,
  className,
}: TimelineCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const isInteractive = !!onClick

  return (
    <div className={cn("relative", className)}>
      <Card
        className={cn(
          "transition-colors",
          isInteractive && "hover:bg-accent/50 cursor-pointer"
        )}
        onClick={onClick}
      >
        <CardContent className={cn("flex gap-3", sizeClasses[size])}>
          {/* Icon with connector */}
          <div className="relative shrink-0">
            <div className="border-border bg-background flex h-10 w-10 items-center justify-center rounded-full border">
              {icon || <div className="bg-primary h-2 w-2 rounded-full" />}
            </div>
            {showConnector && (
              <div className="bg-border absolute top-10 left-1/2 h-full w-px -translate-x-1/2" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h5 className="text-foreground font-medium">{title}</h5>
              <time className="muted shrink-0 whitespace-nowrap">
                {timestamp}
              </time>
            </div>
            {description && <p className="muted">{description}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
