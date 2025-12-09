"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts"
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
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttendanceTrendChartProps } from "./types"

const attendanceChartConfig = {
  present: {
    label: "Present",
    color: "hsl(var(--chart-1))",
  },
  absent: {
    label: "Absent",
    color: "hsl(var(--chart-2))",
  },
  late: {
    label: "Late",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function AttendanceTrendChart({
  data,
  title = "Attendance Trend",
  description = "Daily attendance over the past week",
  trend,
  className,
}: AttendanceTrendChartProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={attendanceChartConfig} className="h-[200px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="present"
              type="monotone"
              fill="var(--color-present)"
              fillOpacity={0.4}
              stroke="var(--color-present)"
              stackId="a"
            />
            <Area
              dataKey="absent"
              type="monotone"
              fill="var(--color-absent)"
              fillOpacity={0.4}
              stroke="var(--color-absent)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {trend !== undefined && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div
            className={cn(
              "flex items-center gap-2 font-medium leading-none",
              trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            )}
          >
            {trend >= 0 ? "Trending up" : "Trending down"} by {Math.abs(trend)}%
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
