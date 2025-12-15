"use client"

import * as React from "react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { FinancialKPI } from "./types"

interface KPICardProps {
  kpi: FinancialKPI
  className?: string
  onClick?: () => void
}

export const KPICard = React.memo(function KPICard({
  kpi,
  className,
  onClick,
}: KPICardProps) {
  const getColorClass = (color?: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "green":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "red":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "yellow":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      case "orange":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400"
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

  const formatValue = (value: string | number) => {
    if (typeof value === "number") {
      // Format as currency if it's a monetary value
      if (
        kpi.id.includes("revenue") ||
        kpi.id.includes("expense") ||
        kpi.id.includes("profit") ||
        kpi.id.includes("cash") ||
        kpi.id.includes("amount")
      ) {
        return new Intl.NumberFormat("en-SD", {
          style: "currency",
          currency: "SDG",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      }
      // Format as percentage if it's a rate
      if (
        kpi.id.includes("rate") ||
        kpi.id.includes("margin") ||
        kpi.id.includes("percentage")
      ) {
        return `${value.toFixed(1)}%`
      }
      // Format as number with commas
      return new Intl.NumberFormat("en-SD").format(value)
    }
    return value
  }

  const getTrendIcon = () => {
    if (!kpi.changeType) return null

    switch (kpi.changeType) {
      case "increase":
        return <TrendingUp className="h-4 w-4" />
      case "decrease":
        return <TrendingDown className="h-4 w-4" />
      case "neutral":
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    if (!kpi.changeType) return "text-gray-500"

    // For some KPIs, decrease is good (e.g., expenses)
    const decreaseIsGood = ["expense", "overdue", "outstanding"].some((term) =>
      kpi.id.toLowerCase().includes(term)
    )

    if (kpi.changeType === "increase") {
      return decreaseIsGood ? "text-red-600" : "text-green-600"
    }
    if (kpi.changeType === "decrease") {
      return decreaseIsGood ? "text-green-600" : "text-red-600"
    }
    return "text-gray-500"
  }

  // Mini sparkline component
  const Sparkline = ({ data }: { data?: number[] }) => {
    if (!data || data.length === 0) return null

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const width = 80
    const height = 30

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return `${x},${y}`
      })
      .join(" ")

    return (
      <svg
        width={width}
        height={height}
        className="ml-2 inline-block"
        viewBox={`0 0 ${width} ${height}`}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className="text-blue-500"
        />
      </svg>
    )
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {kpi.title}
          </CardTitle>
          {kpi.icon && (
            <div className={cn("rounded-lg p-2", getColorClass(kpi.color))}>
              <span className="text-lg">{kpi.icon}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{formatValue(kpi.value)}</div>
            {kpi.trend && <Sparkline data={kpi.trend} />}
          </div>
          {kpi.change !== undefined && (
            <div
              className={cn("flex items-center gap-1 text-sm", getTrendColor())}
            >
              {getTrendIcon()}
              <span>{Math.abs(kpi.change)}%</span>
            </div>
          )}
        </div>
        {kpi.description && (
          <CardDescription className="mt-1 text-xs">
            {kpi.description}
          </CardDescription>
        )}
      </CardContent>

      {/* Background decoration */}
      <div
        className={cn(
          "absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 transform opacity-5",
          getColorClass(kpi.color)
        )}
        style={{
          background: `radial-gradient(circle, currentColor, transparent)`,
          borderRadius: "50%",
        }}
      />
    </Card>
  )
})
