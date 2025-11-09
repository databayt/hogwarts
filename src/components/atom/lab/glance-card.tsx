'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CardSize } from "./types"

interface GlanceCardProps {
  /**
   * Icon element
   */
  icon?: React.ReactNode
  /**
   * Label text
   */
  label: string
  /**
   * Value to display
   */
  value: string | number
  /**
   * Optional unit (e.g., "%", "students", "hrs")
   */
  unit?: string
  /**
   * Color variant
   * @default "default"
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  /**
   * Card size variant
   * @default "sm"
   */
  size?: CardSize
  /**
   * Loading state
   */
  loading?: boolean
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
 * GlanceCard - Minimal quick-glance information card
 *
 * Perfect for displaying key metrics in a compact, minimal format.
 * Ultra-lightweight design with just icon, label, and value.
 *
 * @example
 * ```tsx
 * <GlanceCard
 *   icon={<Users className="h-4 w-4" />}
 *   label="Active Users"
 *   value={234}
 *   variant="primary"
 *   onClick={() => router.push('/users')}
 * />
 * ```
 */
export function GlanceCard({
  icon,
  label,
  value,
  unit,
  variant = "default",
  size = "sm",
  loading = false,
  onClick,
  className,
}: GlanceCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const variantClasses = {
    default: "border-border",
    primary: "border-primary/20 bg-primary/5",
    success: "border-chart-2/20 bg-chart-2/5",
    warning: "border-chart-3/20 bg-chart-3/5",
    danger: "border-destructive/20 bg-destructive/5",
  }

  const iconColorClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-chart-2",
    warning: "text-chart-3",
    danger: "text-destructive",
  }

  const isInteractive = !!onClick

  return (
    <Card
      className={cn(
        "transition-colors border",
        variantClasses[variant],
        isInteractive && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Icon */}
            {icon && (
              <div className={cn("shrink-0", iconColorClasses[variant])}>
                {icon}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="muted text-xs truncate">{label}</p>
              <h4 className="font-semibold text-foreground truncate">
                {typeof value === "number" ? value.toLocaleString() : value}
                {unit && <span className="muted ml-1">{unit}</span>}
              </h4>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
