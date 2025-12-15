import * as React from "react"

import { cn } from "@/lib/utils"

import { StatLabel } from "./stat-label"
import { StatValue } from "./stat-value"
import { TrendBadge } from "./trend-badge"
import type {
  BaseComponentProps,
  BaseVariant,
  LayoutVariant,
  TrendData,
} from "./types"

interface StatGroupProps extends BaseComponentProps {
  /**
   * The numeric or string value
   */
  value: string | number
  /**
   * The descriptive label
   */
  label: string
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
   * Layout orientation
   * @default "vertical"
   */
  layout?: LayoutVariant
}

/**
 * StatGroup - Combines value, label, and optional trend indicator
 *
 * @example
 * ```tsx
 * <StatGroup
 *   value="4,812"
 *   label="Total Students"
 *   trend={{ value: 12, direction: "up" }}
 * />
 * ```
 */
export function StatGroup({
  value,
  label,
  trend,
  variant = "default",
  layout = "vertical",
  className,
  ...props
}: StatGroupProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "vertical" ? "flex-col" : "flex-row items-baseline",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <StatValue value={value} variant={variant} />
        {trend && (
          <TrendBadge value={trend.value} direction={trend.direction} />
        )}
      </div>
      <StatLabel label={label} />
    </div>
  )
}
