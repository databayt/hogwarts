import * as React from "react"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

import type { BaseComponentProps, TrendDirection } from "./types"

interface TrendBadgeProps extends BaseComponentProps {
  /**
   * The percentage or numeric value
   */
  value: number
  /**
   * Direction of the trend
   */
  direction: TrendDirection
  /**
   * Show icon arrow
   * @default true
   */
  showIcon?: boolean
}

const directionStyles: Record<TrendDirection, string> = {
  up: "text-chart-2 bg-chart-2/10",
  down: "text-destructive bg-destructive/10",
  neutral: "text-muted-foreground bg-muted",
}

const directionIcons: Record<TrendDirection, React.ReactNode> = {
  up: <ArrowUp className="h-3 w-3" />,
  down: <ArrowDown className="h-3 w-3" />,
  neutral: <Minus className="h-3 w-3" />,
}

/**
 * TrendBadge - Shows trend indicators with arrows
 *
 * @example
 * ```tsx
 * <TrendBadge value={12} direction="up" />
 * <TrendBadge value={5} direction="down" />
 * ```
 */
export function TrendBadge({
  value,
  direction,
  showIcon = true,
  className,
  ...props
}: TrendBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        directionStyles[direction],
        className
      )}
      {...props}
    >
      {showIcon && directionIcons[direction]}
      <span>
        {value > 0 ? "+" : ""}
        {value}%
      </span>
    </div>
  )
}
