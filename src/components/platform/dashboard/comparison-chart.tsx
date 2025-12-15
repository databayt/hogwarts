"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { cn } from "@/lib/utils"
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

import type { ComparisonLineChartProps } from "./types"

export function ComparisonLineChart({
  data,
  title = "Comparison",
  description,
  currentLabel = "This Term",
  previousLabel = "Last Term",
  className,
}: ComparisonLineChartProps) {
  const config = {
    current: { label: currentLabel, color: "hsl(var(--chart-1))" },
    previous: { label: previousLabel, color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={config} className="h-[200px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={{ fill: "var(--color-current)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--color-previous)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "var(--color-previous)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
