"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

import type { RevenueChartProps } from "./types"

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
        <ChartContainer
          config={revenueChartConfig}
          className="h-[200px] w-full"
        >
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
              formatter={(value: number) =>
                `${currency}${value.toLocaleString()}`
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
