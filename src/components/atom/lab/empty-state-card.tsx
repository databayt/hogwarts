import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

import type { CardSize } from "./types"

interface EmptyStateCardProps {
  /**
   * Icon element (should be large, e.g., h-12 w-12)
   */
  icon: React.ReactNode
  /**
   * Main title
   */
  title: string
  /**
   * Description text
   */
  description: string
  /**
   * Optional call-to-action button
   */
  action?: React.ReactNode
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * EmptyStateCard - No data placeholder card
 *
 * Perfect for first-time users, empty lists, or scenarios
 * where data hasn't been created yet. Provides friendly
 * messaging and encourages action.
 *
 * @example
 * ```tsx
 * <EmptyStateCard
 *   icon={<Inbox className="h-12 w-12" />}
 *   title="No Students Yet"
 *   description="Add your first student to get started with the school-dashboard"
 *   action={<Button>Add Student</Button>}
 * />
 * ```
 */
export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateCardProps) {
  const sizeClasses = {
    sm: "p-6",
    md: "p-8",
    lg: "p-12",
    xl: "p-16",
  }

  return (
    <Card className={cn(className)}>
      <CardContent className={cn(sizeClasses[size])}>
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Icon */}
          <div className="bg-muted text-muted-foreground rounded-full p-4">
            {icon}
          </div>

          {/* Content */}
          <div className="max-w-sm space-y-2">
            <h4>{title}</h4>
            <p className="muted">{description}</p>
          </div>

          {/* Action */}
          {action && <div className="pt-2">{action}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
