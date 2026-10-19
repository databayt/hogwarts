"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Label, Pie, PieChart } from "recharts"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface GlanceSlice {
  key: string
  label: string
  value: number
  /** Locale-formatted `value` for the legend. */
  display: string
}

export interface GlanceChart {
  id: string
  title: string
  description: string
  /** Formatted total for the donut's centre. */
  total: string
  totalLabel: string
  footer?: string
  slices: GlanceSlice[]
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

/**
 * The "at a glance" band as shadcn's donut-with-text pie: one card per
 * part-of-whole, the total in the hole, a legend underneath.
 */
export function GlanceCharts({
  charts,
  emptyLabel,
}: {
  charts: GlanceChart[]
  emptyLabel: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {charts.map((chart) => (
        <GlanceDonut key={chart.id} chart={chart} emptyLabel={emptyLabel} />
      ))}
    </div>
  )
}

function GlanceDonut({
  chart,
  emptyLabel,
}: {
  chart: GlanceChart
  emptyLabel: string
}) {
  const config = Object.fromEntries(
    chart.slices.map((slice, i) => [
      slice.key,
      { label: slice.label, color: COLORS[i % COLORS.length] },
    ])
  ) satisfies ChartConfig

  const data = chart.slices
    .filter((slice) => slice.value > 0)
    .map((slice) => ({
      key: slice.key,
      value: slice.value,
      fill: `var(--color-${slice.key})`,
    }))
  const isEmpty = data.length === 0

  return (
    <Card className="flex flex-col gap-4 shadow-none">
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className={typographyVariants.cardTitle}>
          {chart.title}
        </CardTitle>
        <CardDescription>{chart.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[220px]"
        >
          <PieChart>
            {isEmpty ? null : (
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent nameKey="key" hideLabel />}
              />
            )}
            <Pie
              data={
                isEmpty
                  ? [{ key: "empty", value: 1, fill: "var(--muted)" }]
                  : data
              }
              dataKey="value"
              nameKey="key"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null
                  }
                  const cy = viewBox.cy ?? 0
                  return (
                    <text
                      x={viewBox.cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={cy}
                        className="fill-foreground text-3xl font-bold tabular-nums"
                      >
                        {chart.total}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={cy + 24}
                        className="fill-muted-foreground text-xs"
                      >
                        {chart.totalLabel}
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {isEmpty ? (
          <p className={typographyVariants.hint}>{emptyLabel}</p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {chart.slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: `var(--color-${slice.key})` }}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{slice.label}</span>
                <span className="font-medium tabular-nums">
                  {slice.display}
                </span>
              </li>
            ))}
          </ul>
        )}
        {chart.footer ? (
          <p className={cn(typographyVariants.hint, "text-center")}>
            {chart.footer}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  )
}
