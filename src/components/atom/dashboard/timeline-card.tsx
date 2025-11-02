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
          isInteractive && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={onClick}
      >
        <CardContent className={cn("flex gap-3", sizeClasses[size])}>
          {/* Icon with connector */}
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
              {icon || <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            {showConnector && (
              <div className="absolute left-1/2 top-10 h-full w-px -translate-x-1/2 bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h5 className="font-medium text-foreground">{title}</h5>
              <time className="muted shrink-0 whitespace-nowrap">{timestamp}</time>
            </div>
            {description && <p className="muted">{description}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
