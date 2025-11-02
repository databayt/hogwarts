import * as React from "react"
import { cn } from "@/lib/utils"
import type { BaseComponentProps, ChartType } from "./types"

interface SparklineProps extends BaseComponentProps {
  /**
   * Array of numeric data points
   */
  data: number[]
  /**
   * Type of chart
   * @default "line"
   */
  type?: ChartType
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  /**
   * Height of the sparkline in pixels
   * @default 32
   */
  height?: number
}

const variantStyles = {
  default: "stroke-foreground fill-foreground/10",
  primary: "stroke-primary fill-primary/10",
  success: "stroke-chart-2 fill-chart-2/10",
  warning: "stroke-chart-3 fill-chart-3/10",
  danger: "stroke-destructive fill-destructive/10",
}

/**
 * Sparkline - Tiny inline chart for trends
 *
 * @example
 * ```tsx
 * <Sparkline data={[10, 20, 15, 30, 25]} />
 * <Sparkline data={[5, 10, 8, 12]} variant="success" type="bar" />
 * ```
 */
export function Sparkline({
  data,
  type = "line",
  variant = "primary",
  height = 32,
  className,
  ...props
}: SparklineProps) {
  const width = data.length * 8
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Generate SVG path for line chart
  const generatePath = () => {
    if (type === "bar") return null

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })

    return type === "area"
      ? `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`
      : `M ${points.join(" L ")}`
  }

  return (
    <div className={cn("inline-flex items-center", className)} {...props}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {type === "bar" ? (
          // Bar chart
          data.map((value, index) => {
            const barHeight = ((value - min) / range) * height
            const barWidth = width / data.length - 2
            return (
              <rect
                key={index}
                x={index * (width / data.length) + 1}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                className={cn(variantStyles[variant])}
              />
            )
          })
        ) : (
          // Line or area chart
          <path
            d={generatePath() || ""}
            fill={type === "area" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(variantStyles[variant])}
          />
        )}
      </svg>
    </div>
  )
}
