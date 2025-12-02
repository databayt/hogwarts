"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Attendance Trend Chart - Shows attendance over time
// ============================================================================

interface AttendanceTrendData {
  date: string
  present: number
  absent: number
  late?: number
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendData[]
  title?: string
  description?: string
  trend?: number
  className?: string
}

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
          <div className={cn(
            "flex items-center gap-2 font-medium leading-none",
            trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          )}>
            {trend >= 0 ? "Trending up" : "Trending down"} by {Math.abs(trend)}%
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// Grade Distribution Chart - Radial chart showing grade breakdown
// ============================================================================

interface GradeDistributionData {
  grade: string
  count: number
  fill: string
}

interface GradeDistributionChartProps {
  data: GradeDistributionData[]
  title?: string
  totalStudents?: number
  className?: string
}

const gradeChartConfig = {
  count: { label: "Students" },
  A: { label: "A", color: "hsl(142, 76%, 36%)" },
  B: { label: "B", color: "hsl(199, 89%, 48%)" },
  C: { label: "C", color: "hsl(48, 96%, 53%)" },
  D: { label: "D", color: "hsl(25, 95%, 53%)" },
  F: { label: "F", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig

export function GradeDistributionChart({
  data,
  title = "Grade Distribution",
  totalStudents,
  className,
}: GradeDistributionChartProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={gradeChartConfig} className="mx-auto aspect-square max-h-[200px]">
          <RadialBarChart data={data} innerRadius={30} outerRadius={100}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <RadialBar dataKey="count" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {totalStudents && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="text-muted-foreground">Total: {totalStudents} students</div>
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// Revenue Chart - For financial dashboards
// ============================================================================

interface RevenueData {
  month: string
  revenue: number
  expenses: number
}

interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
  currency?: string
  className?: string
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function RevenueChart({
  data,
  title = "Financial Overview",
  description = "Revenue vs Expenses",
  currency = "$",
  className,
}: RevenueChartProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={revenueChartConfig} className="h-[200px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number) => `${currency}${value.toLocaleString()}`}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Performance Gauge - Radial chart for single metric
// ============================================================================

interface PerformanceGaugeProps {
  value: number
  label: string
  description?: string
  maxValue?: number
  color?: string
  className?: string
}

const gaugeConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function PerformanceGauge({
  value,
  label,
  description,
  maxValue = 100,
  color = "hsl(var(--primary))",
  className,
}: PerformanceGaugeProps) {
  const percentage = (value / maxValue) * 100
  const endAngle = (percentage / 100) * 360 - 90

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardContent className="flex-1 pb-0 pt-6">
        <ChartContainer config={gaugeConfig} className="mx-auto aspect-square max-h-[180px]">
          <RadialBarChart
            data={[{ value: percentage, fill: color }]}
            startAngle={-90}
            endAngle={endAngle}
            innerRadius={60}
            outerRadius={90}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[66, 54]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {value}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                          {label}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {description && (
        <CardFooter className="text-center text-sm text-muted-foreground">
          {description}
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// Weekly Activity Chart - Bar chart for weekly data
// ============================================================================

interface WeeklyActivityData {
  day: string
  value: number
}

interface WeeklyActivityChartProps {
  data: WeeklyActivityData[]
  title?: string
  label?: string
  color?: string
  className?: string
}

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

// ============================================================================
// Comparison Line Chart - For comparing metrics over time
// ============================================================================

interface ComparisonData {
  period: string
  current: number
  previous: number
}

interface ComparisonLineChartProps {
  data: ComparisonData[]
  title?: string
  description?: string
  currentLabel?: string
  previousLabel?: string
  className?: string
}

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
            <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
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

// Export all chart components
export {
  type AttendanceTrendData,
  type AttendanceTrendChartProps,
  type GradeDistributionData,
  type GradeDistributionChartProps,
  type RevenueData,
  type RevenueChartProps,
  type PerformanceGaugeProps,
  type WeeklyActivityData,
  type WeeklyActivityChartProps,
  type ComparisonData,
  type ComparisonLineChartProps,
}
