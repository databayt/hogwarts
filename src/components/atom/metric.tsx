// @ts-nocheck
"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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
import type { getDictionary } from "@/components/internationalization/dictionaries"

const data = [
  {
    average: 400,
    today: 240,
    day: "Mon",
  },
  {
    average: 300,
    today: 139,
    day: "Tue",
  },
  {
    average: 200,
    today: 980,
    day: "Wed",
  },
  {
    average: 278,
    today: 390,
    day: "Thu",
  },
  {
    average: 189,
    today: 480,
    day: "Fri",
  },
  {
    average: 239,
    today: 380,
    day: "Sat",
  },
  {
    average: 349,
    today: 430,
    day: "Sun",
  },
]

const chartConfig = {
  today: {
    label: "Today",
    color: "var(--primary)",
  },
  average: {
    label: "Average",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface CardsMetricProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function CardsMetric({ dictionary }: CardsMetricProps) {
  return (
    <Card className="border shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">
          {dictionary?.cards?.metric?.title || "Exercise Minutes"}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          {dictionary?.cards?.metric?.description ||
            "Your exercise minutes are ahead of where you normally are."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 16,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <Line
              type="monotone"
              dataKey="today"
              strokeWidth={2}
              stroke="var(--color-today)"
              dot={{
                fill: "var(--color-today)",
              }}
              activeDot={{
                r: 5,
              }}
            />
            <Line
              type="monotone"
              strokeWidth={2}
              dataKey="average"
              stroke="var(--color-average)"
              strokeOpacity={0.5}
              dot={{
                fill: "var(--color-average)",
                opacity: 0.5,
              }}
              activeDot={{
                r: 5,
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
