"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "./section-heading"
import { Check, Eye, TriangleAlert, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { getFinancialOverviewByRole } from "./actions"
import type { DashboardRole } from "./resource-usage-section"
import Link from "next/link"

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
// CHART CONFIG
// ============================================================================

const chartConfig = {
  views: {
    label: "Amount",
  },
  income: {
    label: "Income",
    color: "var(--chart-2)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

// ============================================================================
// DEFAULT DATA BY ROLE
// ============================================================================

const defaultChartData: ChartDataPoint[] = [
  { date: "2024-04-01", income: 22000, expenses: 15000 },
  { date: "2024-04-08", income: 25000, expenses: 18000 },
  { date: "2024-04-15", income: 21000, expenses: 14000 },
  { date: "2024-04-22", income: 28000, expenses: 20000 },
  { date: "2024-04-29", income: 24000, expenses: 17000 },
  { date: "2024-05-06", income: 30000, expenses: 22000 },
  { date: "2024-05-13", income: 27000, expenses: 19000 },
  { date: "2024-05-20", income: 32000, expenses: 24000 },
  { date: "2024-05-27", income: 29000, expenses: 21000 },
  { date: "2024-06-03", income: 35000, expenses: 25000 },
  { date: "2024-06-10", income: 31000, expenses: 23000 },
  { date: "2024-06-17", income: 38000, expenses: 27000 },
  { date: "2024-06-24", income: 33000, expenses: 24000 },
]

const defaultDataByRole: Record<DashboardRole, FinancialOverviewData> = {
  STUDENT: {
    stats: [
      { name: "Fee Balance", stat: "2,500 SAR", goalsAchieved: 3, totalGoals: 4, status: "observe", href: "#" },
      { name: "Total Paid", stat: "7,500 SAR", goalsAchieved: 4, totalGoals: 4, status: "within", href: "#" },
      { name: "Next Payment", stat: "Jan 1", goalsAchieved: 1, totalGoals: 1, status: "within", href: "#" },
    ],
    chartData: undefined,
  },
  TEACHER: {
    stats: [
      { name: "Dept Budget", stat: "15,000 SAR", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
      { name: "Used", stat: "8,500 SAR", goalsAchieved: 3, totalGoals: 5, status: "observe", href: "#" },
      { name: "Available", stat: "6,500 SAR", goalsAchieved: 2, totalGoals: 5, status: "within", href: "#" },
    ],
    chartData: undefined,
  },
  GUARDIAN: {
    stats: [
      { name: "Total Due", stat: "4,800 SAR", goalsAchieved: 2, totalGoals: 4, status: "observe", href: "#" },
      { name: "Total Paid", stat: "12,700 SAR", goalsAchieved: 4, totalGoals: 4, status: "within", href: "#" },
      { name: "Children", stat: "2 active", goalsAchieved: 2, totalGoals: 2, status: "within", href: "#" },
    ],
    chartData: undefined,
  },
  STAFF: {
    stats: [
      { name: "Budget", stat: "25,000 SAR", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
      { name: "Expenses", stat: "18,200 SAR", goalsAchieved: 3, totalGoals: 5, status: "observe", href: "#" },
      { name: "Available", stat: "6,800 SAR", goalsAchieved: 2, totalGoals: 5, status: "within", href: "#" },
    ],
    chartData: undefined,
  },
  ACCOUNTANT: {
    stats: [
      { name: "Revenue", stat: "1.2M SAR", goalsAchieved: 5, totalGoals: 5, status: "within", href: "#" },
      { name: "Collection", stat: "87%", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
      { name: "Outstanding", stat: "156K SAR", goalsAchieved: 2, totalGoals: 5, status: "critical", href: "#" },
    ],
    chartData: defaultChartData,
  },
  PRINCIPAL: {
    stats: [
      { name: "Budget", stat: "5.5M SAR", goalsAchieved: 5, totalGoals: 5, status: "within", href: "#" },
      { name: "Spent YTD", stat: "3.2M SAR", goalsAchieved: 3, totalGoals: 5, status: "observe", href: "#" },
      { name: "Collection", stat: "87%", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
    ],
    chartData: defaultChartData,
  },
  ADMIN: {
    stats: [
      { name: "Revenue", stat: "$45.2K", goalsAchieved: 5, totalGoals: 5, status: "within", href: "#" },
      { name: "Subscriptions", stat: "156", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
      { name: "Churn", stat: "2.1%", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
    ],
    chartData: defaultChartData,
  },
  DEVELOPER: {
    stats: [
      { name: "ARR", stat: "$542K", goalsAchieved: 5, totalGoals: 5, status: "within", href: "#" },
      { name: "Schools", stat: "45", goalsAchieved: 4, totalGoals: 5, status: "within", href: "#" },
      { name: "Enterprise", stat: "35%", goalsAchieved: 3, totalGoals: 5, status: "observe", href: "#" },
    ],
    chartData: defaultChartData,
  },
}

// ============================================================================
// STATS STATUS COMPONENT (stats-06 pattern)
// ============================================================================

function StatsStatusCard({ item }: { item: FinancialStat }) {
  return (
    <Card className="p-6 relative">
      <CardContent className="p-0">
        <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
        <p className="text-3xl font-semibold text-foreground">{item.stat}</p>
        <div className="group relative mt-6 flex items-center space-x-4 rounded-md bg-muted/60 p-2 hover:bg-muted">
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
                  <TriangleAlert className="size-4 shrink-0" aria-hidden={true} />
                )}
              </span>
              <div>
                <p className="text-sm text-muted-foreground">
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
              className="size-5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground"
              aria-hidden={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// INTERACTIVE BAR CHART COMPONENT
// ============================================================================

function InteractiveBarChart({ data }: { data: ChartDataPoint[] }) {
  const [activeChart, setActiveChart] = React.useState<"income" | "expenses">("income")

  const total = React.useMemo(
    () => ({
      income: data.reduce((acc, curr) => acc + curr.income, 0),
      expenses: data.reduce((acc, curr) => acc + curr.expenses, 0),
    }),
    [data]
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Financial Trend</CardTitle>
          <CardDescription>
            Showing total for the last 3 months
          </CardDescription>
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
                  {chartConfig[key].label}
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
          config={chartConfig}
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
// FINANCIAL OVERVIEW SECTION COMPONENT
// ============================================================================

/**
 * Role-specific financial overview section for dashboards.
 * Uses Stats with Status (stats-06) pattern and Interactive Bar Chart.
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
      <div className="space-y-6">
        {/* Stats with Status (stats-06 pattern) */}
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.stats.map((item) => (
            <StatsStatusCard key={item.name} item={item} />
          ))}
        </dl>

        {/* Interactive Bar Chart */}
        {showChart && <InteractiveBarChart data={data.chartData!} />}
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
  const financialData = data || defaultDataByRole[role] || defaultDataByRole.ADMIN
  const showChart = financialData.chartData && financialData.chartData.length > 0

  return (
    <section className={className}>
      <SectionHeading title="Financial Overview" />
      <div className="space-y-6">
        {/* Stats with Status (stats-06 pattern) */}
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {financialData.stats.map((item) => (
            <StatsStatusCard key={item.name} item={item} />
          ))}
        </dl>

        {/* Chart placeholder for static version */}
        {showChart && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Trend</CardTitle>
              <CardDescription>
                Enable client-side rendering for interactive charts
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
              Chart available in client component
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
