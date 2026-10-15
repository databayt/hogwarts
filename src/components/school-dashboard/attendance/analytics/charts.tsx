"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The three overview charts — daily trend, weekday rate, method donut.
 * Quiet by design: one series each, theme chart colours, no legends that
 * duplicate the title. In RTL the category axis runs right-to-left
 * (`reversed`) and the value axis sits on the right, so time reads the same
 * way the page does.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { formatDay, formatPercent, weekdayName } from "./format"

const METHOD_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
]

/** A titled, borderless-feeling container shared by the overview sections. */
export function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("bg-card rounded-2xl border p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground flex h-[220px] items-center justify-center text-center text-sm">
      {label}
    </div>
  )
}

// ---------------------------------------------------------------------------

interface TrendPoint {
  date: string
  rate: number
}

export function DailyTrendChart({
  data,
  lang,
  rateLabel,
  emptyLabel,
}: {
  data: TrendPoint[]
  lang: string
  rateLabel: string
  emptyLabel: string
}) {
  const rtl = lang === "ar"
  if (data.length === 0) return <ChartEmpty label={emptyLabel} />

  const config = {
    rate: { label: rateLabel, color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ top: 8, left: 4, right: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="att-rate-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-rate)"
              stopOpacity={0.25}
            />
            <stop offset="100%" stopColor="var(--color-rate)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          reversed={rtl}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(v: string) => formatDay(v, lang)}
        />
        <YAxis
          orientation={rtl ? "right" : "left"}
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const d = payload?.[0]?.payload?.date as string | undefined
                return d
                  ? formatDay(d, lang, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : ""
              }}
              formatter={(value) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{rateLabel}</span>
                  <span className="font-medium tabular-nums">
                    {formatPercent(Number(value), lang)}
                  </span>
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="rate"
          type="monotone"
          stroke="var(--color-rate)"
          strokeWidth={2}
          fill="url(#att-rate-fill)"
        />
      </AreaChart>
    </ChartContainer>
  )
}

// ---------------------------------------------------------------------------

interface WeekdayPoint {
  dayIndex: number
  rate: number
  total: number
}

export function WeekdayChart({
  data,
  lang,
  rateLabel,
  emptyLabel,
}: {
  data: WeekdayPoint[]
  lang: string
  rateLabel: string
  emptyLabel: string
}) {
  const rtl = lang === "ar"
  // Only days the school actually marked — weekends drop out on their own.
  const rows = data
    .filter((d) => d.total > 0)
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((d) => ({ ...d, label: weekdayName(d.dayIndex, lang, "short") }))
  if (rows.length === 0) return <ChartEmpty label={emptyLabel} />

  const config = {
    rate: { label: rateLabel, color: "var(--chart-2)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
      <BarChart data={rows} margin={{ top: 8, left: 4, right: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          reversed={rtl}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
        />
        <YAxis
          orientation={rtl ? "right" : "left"}
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const i = payload?.[0]?.payload?.dayIndex as number | undefined
                return i == null ? "" : weekdayName(i, lang)
              }}
              formatter={(value) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{rateLabel}</span>
                  <span className="font-medium tabular-nums">
                    {formatPercent(Number(value), lang)}
                  </span>
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="rate"
          fill="var(--color-rate)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ChartContainer>
  )
}

// ---------------------------------------------------------------------------

interface MethodSlice {
  method: string
  label: string
  count: number
  percentage: number
}

export function MethodDonut({
  data,
  lang,
  emptyLabel,
}: {
  data: MethodSlice[]
  lang: string
  emptyLabel: string
}) {
  const rows = [...data].sort((a, b) => b.count - a.count)
  if (rows.length === 0) return <ChartEmpty label={emptyLabel} />

  const config = Object.fromEntries(
    rows.map((r, i) => [
      r.method,
      { label: r.label, color: METHOD_COLORS[i % METHOD_COLORS.length] },
    ])
  ) satisfies ChartConfig

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <ChartContainer
        config={config}
        className="aspect-square h-[180px] shrink-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="method" hideLabel />}
          />
          <Pie
            data={rows}
            dataKey="count"
            nameKey="method"
            innerRadius={56}
            outerRadius={80}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {rows.map((r, i) => (
              <Cell
                key={r.method}
                fill={METHOD_COLORS[i % METHOD_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {rows.map((r, i) => (
          <li key={r.method} className="flex items-center gap-3 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatPercent(r.percentage, lang)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
