"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface IconStatCardProps {
  /**
   * Large centered icon
   */
  icon: React.ReactNode
  /**
   * Stat value
   */
  value: string | number
  /**
   * Label text
   */
  label: string
  /**
   * Optional badge or tag
   */
  badge?: React.ReactNode
  /**
   * Color variant for icon background
   * @default "default"
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  /**
   * Card size variant
   * @default "md"
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
 * IconStatCard - Icon-first centered stat display
 *
 * Perfect for highlighting key metrics with visual emphasis on the icon.
 * Centered layout with large icon, value, and label.
 *
 * @example
 * ```tsx
 * <IconStatCard
 *   icon={<TrendingUp className="h-8 w-8" />}
 *   value="87.5%"
 *   label="Success Rate"
 *   badge={<Badge variant="outline">Live</Badge>}
 *   variant="success"
 *   onClick={() => router.push('/metrics')}
 * />
 * ```
 */
export function IconStatCard({
  icon,
  value,
  label,
  badge,
  variant = "default",
  size = "md",
  loading = false,
  onClick,
  className,
}: IconStatCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const iconSizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  }

  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-chart-2/10 text-chart-2",
    warning: "bg-chart-3/10 text-chart-3",
    danger: "bg-destructive/10 text-destructive",
  }

  const isInteractive = !!onClick

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "hover:bg-accent/50 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-3 text-center">
            <Skeleton
              className={cn(iconSizeClasses[size], "mx-auto rounded-full")}
            />
            <Skeleton className="mx-auto h-8 w-24" />
            <Skeleton className="mx-auto h-4 w-20" />
          </div>
        ) : (
          <div className="space-y-3 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-colors",
                  iconSizeClasses[size],
                  variantClasses[variant]
                )}
              >
                {icon}
              </div>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <h2 className="text-foreground font-bold">
                {typeof value === "number" ? value.toLocaleString() : value}
              </h2>
              <p className="muted">{label}</p>
            </div>

            {/* Badge */}
            {badge && <div className="flex justify-center pt-1">{badge}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
