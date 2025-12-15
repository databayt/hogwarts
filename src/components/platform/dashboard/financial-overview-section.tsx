"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronRight,
  Eye,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
} from "recharts"

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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { getFinancialOverviewByRole } from "./actions"
import type { DashboardRole } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialStat {
  name: string
  stat: string
  goalsAchieved: number
  totalGoals: number
  status: "within" | "observe" | "critical"
  href: string
}

export interface ChartDataPoint {
  date: string
  income: number
  expenses: number
}

export interface FinancialOverviewData {
  stats: FinancialStat[]
  chartData?: ChartDataPoint[]
}

export interface FinancialOverviewSectionProps {
  role: DashboardRole
  className?: string
}

// ============================================================================
// CHART CONFIGS
// ============================================================================

const barChartConfig = {
  views: {
    label: "Amount",
  },
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const radialChartData = [
  { browser: "safari", visitors: 87, fill: "var(--color-safari)" },
]

const radialChartConfig = {
  visitors: {
    label: "Collection",
  },
  safari: {
    label: "Rate",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const areaChartData = [
  { month: "January", income: 186000, expenses: 80000 },
  { month: "February", income: 305000, expenses: 200000 },
  { month: "March", income: 237000, expenses: 120000 },
  { month: "April", income: 273000, expenses: 190000 },
  { month: "May", income: 209000, expenses: 130000 },
  { month: "June", income: 314000, expenses: 140000 },
]

const areaChartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

// ============================================================================
// DEFAULT DATA BY ROLE
// ============================================================================

const defaultChartData: ChartDataPoint[] = [
  { date: "2024-04-01", income: 22200, expenses: 15000 },
  { date: "2024-04-02", income: 9700, expenses: 18000 },
  { date: "2024-04-03", income: 16700, expenses: 12000 },
  { date: "2024-04-04", income: 24200, expenses: 26000 },
  { date: "2024-04-05", income: 37300, expenses: 29000 },
  { date: "2024-04-06", income: 30100, expenses: 34000 },
  { date: "2024-04-07", income: 24500, expenses: 18000 },
  { date: "2024-04-08", income: 40900, expenses: 32000 },
  { date: "2024-04-09", income: 5900, expenses: 11000 },
  { date: "2024-04-10", income: 26100, expenses: 19000 },
  { date: "2024-04-11", income: 32700, expenses: 35000 },
  { date: "2024-04-12", income: 29200, expenses: 21000 },
  { date: "2024-04-13", income: 34200, expenses: 38000 },
  { date: "2024-04-14", income: 13700, expenses: 22000 },
  { date: "2024-04-15", income: 12000, expenses: 17000 },
  { date: "2024-04-16", income: 13800, expenses: 19000 },
  { date: "2024-04-17", income: 44600, expenses: 36000 },
  { date: "2024-04-18", income: 36400, expenses: 41000 },
  { date: "2024-04-19", income: 24300, expenses: 18000 },
  { date: "2024-04-20", income: 8900, expenses: 15000 },
  { date: "2024-04-21", income: 13700, expenses: 20000 },
  { date: "2024-04-22", income: 22400, expenses: 17000 },
  { date: "2024-04-23", income: 13800, expenses: 23000 },
  { date: "2024-04-24", income: 38700, expenses: 29000 },
  { date: "2024-04-25", income: 21500, expenses: 25000 },
  { date: "2024-04-26", income: 7500, expenses: 13000 },
  { date: "2024-04-27", income: 38300, expenses: 42000 },
  { date: "2024-04-28", income: 12200, expenses: 18000 },
  { date: "2024-04-29", income: 31500, expenses: 24000 },
  { date: "2024-04-30", income: 45400, expenses: 38000 },
  { date: "2024-05-01", income: 16500, expenses: 22000 },
  { date: "2024-05-02", income: 29300, expenses: 31000 },
  { date: "2024-05-03", income: 24700, expenses: 19000 },
  { date: "2024-05-04", income: 38500, expenses: 42000 },
  { date: "2024-05-05", income: 48100, expenses: 39000 },
  { date: "2024-05-06", income: 49800, expenses: 52000 },
  { date: "2024-05-07", income: 38800, expenses: 30000 },
  { date: "2024-05-08", income: 14900, expenses: 21000 },
  { date: "2024-05-09", income: 22700, expenses: 18000 },
  { date: "2024-05-10", income: 29300, expenses: 33000 },
  { date: "2024-05-11", income: 33500, expenses: 27000 },
  { date: "2024-05-12", income: 19700, expenses: 24000 },
  { date: "2024-05-13", income: 19700, expenses: 16000 },
  { date: "2024-05-14", income: 44800, expenses: 49000 },
  { date: "2024-05-15", income: 47300, expenses: 38000 },
  { date: "2024-05-16", income: 33800, expenses: 40000 },
  { date: "2024-05-17", income: 49900, expenses: 42000 },
  { date: "2024-05-18", income: 31500, expenses: 35000 },
  { date: "2024-05-19", income: 23500, expenses: 18000 },
  { date: "2024-05-20", income: 17700, expenses: 23000 },
  { date: "2024-05-21", income: 8200, expenses: 14000 },
  { date: "2024-05-22", income: 8100, expenses: 12000 },
  { date: "2024-05-23", income: 25200, expenses: 29000 },
  { date: "2024-05-24", income: 29400, expenses: 22000 },
  { date: "2024-05-25", income: 20100, expenses: 25000 },
  { date: "2024-05-26", income: 21300, expenses: 17000 },
  { date: "2024-05-27", income: 42000, expenses: 46000 },
  { date: "2024-05-28", income: 23300, expenses: 19000 },
  { date: "2024-05-29", income: 7800, expenses: 13000 },
  { date: "2024-05-30", income: 34000, expenses: 28000 },
  { date: "2024-05-31", income: 17800, expenses: 23000 },
  { date: "2024-06-01", income: 17800, expenses: 20000 },
  { date: "2024-06-02", income: 47000, expenses: 41000 },
  { date: "2024-06-03", income: 10300, expenses: 16000 },
  { date: "2024-06-04", income: 43900, expenses: 38000 },
  { date: "2024-06-05", income: 8800, expenses: 14000 },
  { date: "2024-06-06", income: 29400, expenses: 25000 },
  { date: "2024-06-07", income: 32300, expenses: 37000 },
  { date: "2024-06-08", income: 38500, expenses: 32000 },
  { date: "2024-06-09", income: 43800, expenses: 48000 },
  { date: "2024-06-10", income: 15500, expenses: 20000 },
  { date: "2024-06-11", income: 9200, expenses: 15000 },
  { date: "2024-06-12", income: 49200, expenses: 42000 },
  { date: "2024-06-13", income: 8100, expenses: 13000 },
  { date: "2024-06-14", income: 42600, expenses: 38000 },
  { date: "2024-06-15", income: 30700, expenses: 35000 },
  { date: "2024-06-16", income: 37100, expenses: 31000 },
  { date: "2024-06-17", income: 47500, expenses: 52000 },
  { date: "2024-06-18", income: 10700, expenses: 17000 },
  { date: "2024-06-19", income: 34100, expenses: 29000 },
  { date: "2024-06-20", income: 40800, expenses: 45000 },
  { date: "2024-06-21", income: 16900, expenses: 21000 },
  { date: "2024-06-22", income: 31700, expenses: 27000 },
  { date: "2024-06-23", income: 48000, expenses: 53000 },
  { date: "2024-06-24", income: 13200, expenses: 18000 },
  { date: "2024-06-25", income: 14100, expenses: 19000 },
  { date: "2024-06-26", income: 43400, expenses: 38000 },
  { date: "2024-06-27", income: 44800, expenses: 49000 },
  { date: "2024-06-28", income: 14900, expenses: 20000 },
  { date: "2024-06-29", income: 10300, expenses: 16000 },
  { date: "2024-06-30", income: 44600, expenses: 40000 },
]

const defaultDataByRole: Record<DashboardRole, FinancialOverviewData> = {
  STUDENT: {
    stats: [
      {
        name: "Fee Balance",
        stat: "2,500 SAR",
        goalsAchieved: 3,
        totalGoals: 4,
        status: "observe",
        href: "#",
      },
      {
        name: "Total Paid",
        stat: "7,500 SAR",
        goalsAchieved: 4,
        totalGoals: 4,
        status: "within",
        href: "#",
      },
      {
        name: "Next Payment",
        stat: "Jan 1",
        goalsAchieved: 1,
        totalGoals: 1,
        status: "within",
        href: "#",
      },
    ],
    chartData: undefined,
  },
  TEACHER: {
    stats: [
      {
        name: "Dept Budget",
        stat: "15,000 SAR",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Used",
        stat: "8,500 SAR",
        goalsAchieved: 3,
        totalGoals: 5,
        status: "observe",
        href: "#",
      },
      {
        name: "Available",
        stat: "6,500 SAR",
        goalsAchieved: 2,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
    ],
    chartData: undefined,
  },
  GUARDIAN: {
    stats: [
      {
        name: "Total Due",
        stat: "4,800 SAR",
        goalsAchieved: 2,
        totalGoals: 4,
        status: "observe",
        href: "#",
      },
      {
        name: "Total Paid",
        stat: "12,700 SAR",
        goalsAchieved: 4,
        totalGoals: 4,
        status: "within",
        href: "#",
      },
      {
        name: "Children",
        stat: "2 active",
        goalsAchieved: 2,
        totalGoals: 2,
        status: "within",
        href: "#",
      },
    ],
    chartData: undefined,
  },
  STAFF: {
    stats: [
      {
        name: "Budget",
        stat: "25,000 SAR",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Expenses",
        stat: "18,200 SAR",
        goalsAchieved: 3,
        totalGoals: 5,
        status: "observe",
        href: "#",
      },
      {
        name: "Available",
        stat: "6,800 SAR",
        goalsAchieved: 2,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
    ],
    chartData: undefined,
  },
  ACCOUNTANT: {
    stats: [
      {
        name: "Revenue",
        stat: "1.2M SAR",
        goalsAchieved: 5,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Collection",
        stat: "87%",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Outstanding",
        stat: "156K SAR",
        goalsAchieved: 2,
        totalGoals: 5,
        status: "critical",
        href: "#",
      },
    ],
    chartData: defaultChartData,
  },
  PRINCIPAL: {
    stats: [
      {
        name: "Budget",
        stat: "5.5M SAR",
        goalsAchieved: 5,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Spent YTD",
        stat: "3.2M SAR",
        goalsAchieved: 3,
        totalGoals: 5,
        status: "observe",
        href: "#",
      },
      {
        name: "Collection",
        stat: "87%",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
    ],
    chartData: defaultChartData,
  },
  ADMIN: {
    stats: [
      {
        name: "Revenue",
        stat: "$45.2K",
        goalsAchieved: 5,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Subscriptions",
        stat: "156",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Churn",
        stat: "2.1%",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
    ],
    chartData: defaultChartData,
  },
  DEVELOPER: {
    stats: [
      {
        name: "ARR",
        stat: "$542K",
        goalsAchieved: 5,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Schools",
        stat: "45",
        goalsAchieved: 4,
        totalGoals: 5,
        status: "within",
        href: "#",
      },
      {
        name: "Enterprise",
        stat: "35%",
        goalsAchieved: 3,
        totalGoals: 5,
        status: "observe",
        href: "#",
      },
    ],
    chartData: defaultChartData,
  },
}

// ============================================================================
// STATS STATUS COMPONENT (stats-06 pattern)
// ============================================================================

function StatsStatusCard({ item }: { item: FinancialStat }) {
  return (
    <Card className="relative p-6">
      <CardContent className="p-0">
        <p className="text-muted-foreground text-sm font-medium">{item.name}</p>
        <p className="text-foreground text-3xl font-semibold">{item.stat}</p>
        <div className="group bg-muted/60 hover:bg-muted relative mt-6 flex items-center space-x-4 rounded-md p-2">
          <div className="flex w-full items-center justify-between truncate">
            <div className="flex items-center space-x-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded",
                  item.status === "within"
                    ? "bg-emerald-500 text-white"
                    : item.status === "observe"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-500 text-white"
                )}
              >
                {item.status === "within" ? (
                  <Check className="size-4 shrink-0" aria-hidden={true} />
                ) : item.status === "observe" ? (
                  <Eye className="size-4 shrink-0" aria-hidden={true} />
                ) : (
                  <TriangleAlert
                    className="size-4 shrink-0"
                    aria-hidden={true}
                  />
                )}
              </span>
              <div>
                <p className="text-muted-foreground text-sm">
                  <Link href={item.href} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden={true} />
                    {item.goalsAchieved}/{item.totalGoals} goals
                  </Link>
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    item.status === "within"
                      ? "text-emerald-700 dark:text-emerald-500"
                      : item.status === "observe"
                        ? "text-yellow-700 dark:text-yellow-500"
                        : "text-red-700 dark:text-red-500"
                  )}
                >
                  {item.status}
                </p>
              </div>
            </div>
            <ChevronRight
              className="text-muted-foreground/60 group-hover:text-muted-foreground size-5 shrink-0"
              aria-hidden={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// INTERACTIVE BAR CHART (from finance page)
// ============================================================================

function InteractiveBarChart({ data }: { data: ChartDataPoint[] }) {
  const [activeChart, setActiveChart] = React.useState<"income" | "expenses">(
    "income"
  )

  const total = React.useMemo(
    () => ({
      income: data.reduce((acc, curr) => acc + curr.income, 0),
      expenses: data.reduce((acc, curr) => acc + curr.expenses, 0),
    }),
    [data]
  )

  return (
    <Card className="bg-muted border-none shadow-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Financial Trend</CardTitle>
          <CardDescription>Showing total for the last 3 months</CardDescription>
        </div>
        <div className="flex">
          {(["income", "expenses"] as const).map((key) => {
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-muted-foreground text-xs">
                  {barChartConfig[key].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={barChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// RADIAL TEXT CHART (from finance page)
// ============================================================================

function RadialTextChart() {
  return (
    <Card className="bg-muted flex flex-col border-none shadow-none">
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={radialChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={radialChartData}
            startAngle={0}
            endAngle={250}
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
            <RadialBar dataKey="visitors" background cornerRadius={10} />
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
                          {radialChartData[0].visitors}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Collection
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
          Trending up by 5.2% this month <TrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Fee collection rate
        </div>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// AREA CHART STACKED (from finance page)
// ============================================================================

function AreaChartStacked() {
  return (
    <Card className="bg-muted flex flex-col border-none shadow-none">
      <CardHeader></CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={areaChartConfig}>
          <AreaChart
            accessibilityLayer
            data={areaChartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="var(--color-expenses)"
              fillOpacity={0.4}
              stroke="var(--color-expenses)"
              stackId="a"
            />
            <Area
              dataKey="income"
              type="natural"
              fill="var(--color-income)"
              fillOpacity={0.4}
              stroke="var(--color-income)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-center text-sm text-pretty">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          January - June 2024
        </div>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// FINANCIAL OVERVIEW SECTION COMPONENT
// ============================================================================

/**
 * Role-specific financial overview section for dashboards.
 * Uses Stats with Status (stats-06) pattern and Finance page charts.
 */
export function FinancialOverviewSection({
  role,
  className,
}: FinancialOverviewSectionProps) {
  const [data, setData] = useState<FinancialOverviewData>(
    defaultDataByRole[role] || defaultDataByRole.ADMIN
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getFinancialOverviewByRole(role)
        if (
          result &&
          typeof result === "object" &&
          "stats" in result &&
          Array.isArray((result as FinancialOverviewData).stats) &&
          (result as FinancialOverviewData).stats.length > 0
        ) {
          setData(result as FinancialOverviewData)
        }
      } catch (error) {
        console.error("Error fetching financial overview:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [role])

  const showChart = data.chartData && data.chartData.length > 0

  return (
    <section className={className}>
      <SectionHeading title="Financial Overview" />
      <div className="space-y-4">
        {/* Charts (same as finance page) */}
        {showChart && (
          <>
            <InteractiveBarChart data={data.chartData!} />
            <div className="grid gap-4 md:grid-cols-2">
              <RadialTextChart />
              <AreaChartStacked />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ============================================================================
// STATIC FINANCIAL OVERVIEW (For server components)
// ============================================================================

export interface StaticFinancialOverviewSectionProps {
  role: DashboardRole
  data?: FinancialOverviewData
  className?: string
}

/**
 * Static version of FinancialOverviewSection for server-side rendering.
 */
export function StaticFinancialOverviewSection({
  role,
  data,
  className,
}: StaticFinancialOverviewSectionProps) {
  const financialData =
    data || defaultDataByRole[role] || defaultDataByRole.ADMIN
  const showChart =
    financialData.chartData && financialData.chartData.length > 0

  return (
    <section className={className}>
      <SectionHeading title="Financial Overview" />
      <div className="space-y-4">
        {/* Chart placeholder for static version */}
        {showChart && (
          <Card className="bg-muted border-none shadow-none">
            <CardHeader>
              <CardTitle>Financial Trend</CardTitle>
              <CardDescription>
                Enable client-side rendering for interactive charts
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground flex h-[250px] items-center justify-center">
              Chart available in client component
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
