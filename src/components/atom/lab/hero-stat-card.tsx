'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IconWrapper } from "./icon-wrapper"
import { StatValue } from "./stat-value"
import { StatLabel } from "./stat-label"
import { TrendBadge } from "./trend-badge"
import type { BaseVariant, TrendData } from "./types"

interface HeroStatCardProps {
  /**
   * Large numeric or string value
   */
  value: string | number
  /**
   * Primary label
   */
  label: string
  /**
   * Optional subtitle
   */
  subtitle?: string
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
   * @default "primary"
   */
  variant?: BaseVariant
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
 * HeroStatCard - Large prominent KPI display card
 *
 * Perfect for highlighting the most important metric on a lab.
 * 1.5x larger than StatCard with prominent value and optional subtitle.
 *
 * @example
 * ```tsx
 * <HeroStatCard
 *   icon={<Users className="h-12 w-12" />}
 *   value="4,812"
 *   label="Total Students"
 *   subtitle="Across all grade levels"
 *   trend={{ value: 12, direction: "up" }}
 *   variant="primary"
 *   onClick={() => router.push('/students')}
 * />
 * ```
 */
export function HeroStatCard({
  value,
  label,
  subtitle,
  icon,
  trend,
  variant = "primary",
  loading = false,
  onClick,
  hoverable = false,
  className,
}: HeroStatCardProps) {
  const isInteractive = onClick || hoverable

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div className="space-y-4">
            {icon && (
              <IconWrapper icon={icon} variant={variant} size="lg" />
            )}
            <div className="space-y-2">
              <StatValue value={value} size="xl" variant={variant} />
              <StatLabel label={label} variant="default" />
              {subtitle && (
                <p className="muted">{subtitle}</p>
              )}
            </div>
            {trend && (
              <TrendBadge
                value={trend.value}
                direction={trend.direction}
                showIcon
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
