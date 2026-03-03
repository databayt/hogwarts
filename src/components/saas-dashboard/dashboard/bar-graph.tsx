"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// TODO(production): Wire to real daily metrics (replace Math.random() generated data)
import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useLocale } from "@/components/internationalization/use-locale"

export const description = "An interactive bar chart"

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BarGraphProps {
  data?: Array<{
    date: string
    desktop: number
    mobile: number
  }>
  title?: string
  description?: string
  dictionary?: any
}

function getChartConfig(dictionary?: any): ChartConfig {
  const c = dictionary?.operator?.dashboard?.charts
  return {
    views: {
      label: c?.pageViews || "Page Views",
    },
    desktop: {
      label: c?.desktop || "Desktop",
      color: "var(--primary)",
    },
    mobile: {
      label: c?.mobile || "Mobile",
      color: "var(--primary)",
    },
  }
}

// Generate sample data for development/demo purposes
function generateSampleData() {
  const data = []
  const today = new Date()

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split("T")[0],
      desktop: Math.floor(Math.random() * 400) + 100,
      mobile: Math.floor(Math.random() * 350) + 100,
    })
  }

  return data
}

export function BarGraph({
  data,
  title,
  description: descriptionProp,
  dictionary,
}: BarGraphProps) {
  const { locale } = useLocale()
  const c = dictionary?.operator?.dashboard?.charts
  const resolvedTitle = title ?? (c?.barChartTitle || "Bar Chart - Interactive")
  const resolvedDescription =
    descriptionProp ?? (c?.barChartDescription || "Total for the last 3 months")
  const chartConfig = React.useMemo(
    () => getChartConfig(dictionary),
    [dictionary]
  )
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop")

  // Use provided data or generate sample data
  const chartData = React.useMemo(() => {
    return data || generateSampleData()
  }, [data])

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    [chartData]
  )

  return (
    <Card className="bg-muted border-none shadow-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 !py-0">
          <CardTitle>{resolvedTitle}</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              {resolvedDescription}
            </span>
            <span className="@[540px]/card:hidden">
              {c?.last3Months || "Last 3 months"}
            </span>
          </CardDescription>
        </div>
        <div className="flex">
          {["desktop", "mobile"].map((key) => {
            const chart = key as keyof typeof chartConfig
            const chartTotal = total[key as keyof typeof total]

            if (!chartTotal) return null

            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start transition-colors duration-200 even:border-s sm:border-s sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {chartTotal.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillBar" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--primary)", opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill="url(#fillBar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
