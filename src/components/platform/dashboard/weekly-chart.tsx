"use client"

import { Bar, BarChart, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { WeeklyActivityChartProps } from "./types"

export function WeeklyActivityChart({
  data,
  title = "Weekly Activity",
  label = "Activity",
  color = "hsl(var(--primary))",
  className,
}: WeeklyActivityChartProps) {
  const config = {
    value: { label, color },
  } satisfies ChartConfig

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={config} className="h-[150px] w-full">
          <BarChart data={data}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
