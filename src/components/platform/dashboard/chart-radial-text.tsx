"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

export interface RadialTextChartProps {
  value?: number
  label?: string
  trend?: number
  trendLabel?: string
  maxValue?: number
}

export function RadialTextChart({
  value = 200,
  label = "Visitors",
  trend = 5.2,
  trendLabel = "Total visitors in the last 6 months",
  maxValue = 100,
}: RadialTextChartProps) {
  const chartData = [
    { name: "value", value: value, fill: "var(--color-value)" },
  ]

  const chartConfig = {
    value: {
      label: label,
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  // Calculate end angle based on value percentage (0 = 0 degrees, maxValue = 250 degrees)
  const endAngle = Math.min((value / maxValue) * 250, 250)

  return (
    <Card className="bg-muted flex flex-col border-none shadow-none">
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={endAngle}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {value.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
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
      <CardFooter className="flex-col gap-2 text-center text-sm text-pretty">
        <div className="flex items-center gap-2 leading-none font-medium">
          {trend >= 0 ? (
            <>
              Trending up by {trend}% this month{" "}
              <TrendingUp className="size-4" />
            </>
          ) : (
            <>
              Trending down by {Math.abs(trend)}% this month{" "}
              <TrendingDown className="size-4" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">{trendLabel}</div>
      </CardFooter>
    </Card>
  )
}
