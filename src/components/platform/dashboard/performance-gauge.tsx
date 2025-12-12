"use client"

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { PerformanceGaugeProps } from "./types"

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
