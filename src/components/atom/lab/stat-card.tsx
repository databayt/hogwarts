"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { IconStat } from "./icon-stat"
import { StatGroup } from "./stat-group"
import type { BaseVariant, CardSize, TrendData } from "./types"

interface StatCardProps {
  /**
   * The numeric or string value
   */
  value: string | number
  /**
   * The descriptive label
   */
  label: string
  /**
   * Optional icon element
   */
  icon?: React.ReactNode
  /**
   * Optional trend data
   */
  trend?: TrendData
  /**
   * Visual variant
   * @default "default"
   */
  variant?: BaseVariant
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state (shows skeleton)
   */
  loading?: boolean
  /**
   * Click handler for navigation
   */
  onClick?: () => void
  /**
   * Enable hover effect
   * @default false
   */
  hoverable?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * StatCard - Single metric display card
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={<Users />}
 *   value="4,812"
 *   label="Total Students"
 *   trend={{ value: 12, direction: "up" }}
 *   variant="primary"
 *   size="lg"
 *   onClick={() => router.push('/students')}
 *   hoverable
 * />
 * ```
 */
export function StatCard({
  value,
  label,
  icon,
  trend,
  variant = "default",
  size = "md",
  loading = false,
  onClick,
  hoverable = false,
  className,
}: StatCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const isInteractive = onClick || hoverable

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
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : icon ? (
          <IconStat
            icon={icon}
            value={value}
            label={label}
            variant={
              variant === "primary" || variant === "muted" ? variant : "default"
            }
          />
        ) : (
          <StatGroup
            value={value}
            label={label}
            trend={trend}
            variant={variant}
          />
        )}
      </CardContent>
    </Card>
  )
}
