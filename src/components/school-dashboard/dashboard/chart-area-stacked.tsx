"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export interface AreaChartStackedData {
  label: string
  primary: number
  secondary: number
  /** Optional third stacked series (e.g. a third join channel). */
  tertiary?: number
}

export interface AreaChartStackedProps {
  data?: AreaChartStackedData[]
  primaryLabel?: string
  secondaryLabel?: string
  /** Names the third series; the series is drawn only when this is set. */
  tertiaryLabel?: string
  trend?: number
  trendLabel?: string
  /** Real data with no period-over-period figure: print the label only. */
  hideTrend?: boolean
}

const defaultChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

function AreaChartStackedInner({
  data,
  primaryLabel = "Desktop",
  secondaryLabel = "Mobile",
  tertiaryLabel,
  trend = 5.2,
  trendLabel = "January - June 2024",
  hideTrend = false,
}: AreaChartStackedProps) {
  const { dictionary } = useDictionary()
  const cl = dictionary?.school?.dashboard?.chartLabels as
    | Record<string, string>
    | undefined
  // Transform custom data to use primary/secondary keys if provided
  const chartData = data
    ? data.map((d) => ({
        label: d.label,
        primary: d.primary,
        secondary: d.secondary,
        tertiary: d.tertiary ?? 0,
      }))
    : defaultChartData.map((d) => ({
        label: d.month,
        primary: d.desktop,
        secondary: d.mobile,
        tertiary: 0,
      }))

  const chartConfig = {
    primary: {
      label: primaryLabel,
      color: "hsl(var(--chart-1))",
    },
    secondary: {
      label: secondaryLabel,
      color: "hsl(var(--chart-2))",
    },
    tertiary: {
      label: tertiaryLabel ?? "",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig

  return (
    <Card className="bg-muted flex flex-col border-none shadow-none">
      <CardHeader></CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                // For short labels (already abbreviated), return as-is
                if (value.length <= 5) return value
                // For longer labels, take first word (handles Arabic day names)
                const firstWord = value.split(/\s/)[0]
                return firstWord.length <= 6 ? firstWord : firstWord.slice(0, 4)
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="secondary"
              type="natural"
              fill="var(--color-secondary)"
              fillOpacity={0.4}
              stroke="var(--color-secondary)"
              stackId="a"
            />
            {tertiaryLabel && (
              <Area
                dataKey="tertiary"
                type="natural"
                fill="var(--color-tertiary)"
                fillOpacity={0.4}
                stroke="var(--color-tertiary)"
                stackId="a"
              />
            )}
            <Area
              dataKey="primary"
              type="natural"
              fill="var(--color-primary)"
              fillOpacity={0.4}
              stroke="var(--color-primary)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-center text-sm text-pretty">
        <div
          className={
            hideTrend
              ? "hidden"
              : "flex items-center gap-2 leading-none font-medium"
          }
        >
          {trend >= 0 ? (
            <>
              {cl?.trendingUp || "Trending up by"} {trend}%{" "}
              {cl?.thisMonth || "this month"} <TrendingUp className="size-4" />
            </>
          ) : (
            <>
              {cl?.trendingDown || "Trending down by"} {Math.abs(trend)}%{" "}
              {cl?.thisMonth || "this month"}{" "}
              <TrendingDown className="size-4" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">{trendLabel}</div>
      </CardFooter>
    </Card>
  )
}

export const AreaChartStacked = React.memo(AreaChartStackedInner)
