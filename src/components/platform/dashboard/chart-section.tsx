"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "./section-heading"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Line,
  LineChart,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
  Pie,
  PieChart,
  Cell,
} from "recharts"
import { getChartDataByRole } from "./actions"
import type { DashboardRole } from "./resource-usage-section"

// ============================================================================
// TYPES
// ============================================================================

export interface ChartSectionProps {
  role: DashboardRole
  className?: string
}

export interface ChartDataPoint {
  label: string
  value: number
  previousValue?: number
}

export interface TrendChartData {
  labels: string[]
  current: number[]
  previous?: number[]
}

export interface GaugeData {
  value: number
  label: string
  trend?: number
}

export interface DistributionData {
  name: string
  value: number
  color?: string
}

export interface RoleChartData {
  sectionTitle: string
  trendChart?: {
    title: string
    data: TrendChartData
    type: "line" | "bar" | "area"
  }
  gaugeChart?: GaugeData
  distributionChart?: {
    title: string
    data: DistributionData[]
    type: "bar" | "pie"
  }
}

// ============================================================================
// SECTION TITLES BY ROLE
// ============================================================================

function getChartSectionTitle(role: DashboardRole): string {
  switch (role) {
    case "STUDENT":
      return "Academic Performance"
    case "TEACHER":
      return "Teaching Analytics"
    case "GUARDIAN":
      return "Children's Progress"
    case "ACCOUNTANT":
      return "Financial Analytics"
    case "PRINCIPAL":
      return "School Analytics"
    case "ADMIN":
      return "System Analytics"
    case "STAFF":
      return "Work Analytics"
    case "DEVELOPER":
      return "Platform Analytics"
    default:
      return "Analytics"
  }
}

// ============================================================================
// CHART CONFIGS
// ============================================================================

const lineChartConfig = {
  current: {
    label: "Current",
    color: "hsl(var(--chart-1))",
  },
  previous: {
    label: "Previous",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const barChartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const areaChartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const pieColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

// ============================================================================
// DEFAULT DATA BY ROLE
// ============================================================================

const defaultDataByRole: Record<DashboardRole, RoleChartData> = {
  // Student: Grade trends, attendance, subject performance
  STUDENT: {
    sectionTitle: "Academic Performance",
    trendChart: {
      title: "Grade Trend",
      type: "line",
      data: {
        labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
        current: [78, 82, 79, 85, 88, 86],
        previous: [72, 75, 74, 78, 80, 82],
      },
    },
    gaugeChart: {
      value: 86,
      label: "Attendance",
      trend: 3.2,
    },
    distributionChart: {
      title: "Subject Grades",
      type: "bar",
      data: [
        { name: "Math", value: 85 },
        { name: "Science", value: 78 },
        { name: "English", value: 92 },
        { name: "Arabic", value: 88 },
        { name: "History", value: 75 },
      ],
    },
  },

  // Teacher: Class performance, grading progress, lessons
  TEACHER: {
    sectionTitle: "Teaching Analytics",
    trendChart: {
      title: "Weekly Lessons",
      type: "area",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        current: [18, 22, 20, 24],
      },
    },
    gaugeChart: {
      value: 72,
      label: "Grading Progress",
      trend: -5.0,
    },
    distributionChart: {
      title: "Class Performance",
      type: "bar",
      data: [
        { name: "Grade 10A", value: 82 },
        { name: "Grade 10B", value: 78 },
        { name: "Grade 11A", value: 85 },
        { name: "Grade 11B", value: 80 },
      ],
    },
  },

  // Guardian: Children comparison, attendance, grades
  GUARDIAN: {
    sectionTitle: "Children's Progress",
    trendChart: {
      title: "Attendance Trend",
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
        current: [95, 90, 100, 85, 95, 100],
        previous: [90, 85, 95, 80, 90, 95],
      },
    },
    gaugeChart: {
      value: 88,
      label: "Avg Grade",
      trend: 4.5,
    },
    distributionChart: {
      title: "Grade Distribution",
      type: "pie",
      data: [
        { name: "A+", value: 3 },
        { name: "A", value: 5 },
        { name: "B+", value: 4 },
        { name: "B", value: 2 },
        { name: "C+", value: 1 },
      ],
    },
  },

  // Staff: Task completion, request processing, workload
  STAFF: {
    sectionTitle: "Work Analytics",
    trendChart: {
      title: "Weekly Tasks",
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        current: [8, 12, 10, 15, 9],
      },
    },
    gaugeChart: {
      value: 88,
      label: "Efficiency",
      trend: 2.1,
    },
    distributionChart: {
      title: "Task Categories",
      type: "pie",
      data: [
        { name: "Admin", value: 35 },
        { name: "Support", value: 25 },
        { name: "Maintenance", value: 20 },
        { name: "Events", value: 20 },
      ],
    },
  },

  // Accountant: Revenue, expenses, cash flow
  ACCOUNTANT: {
    sectionTitle: "Financial Analytics",
    trendChart: {
      title: "Revenue vs Expenses",
      type: "area",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        current: [120000, 135000, 128000, 142000, 155000, 148000],
        previous: [95000, 88000, 92000, 98000, 105000, 110000],
      },
    },
    gaugeChart: {
      value: 87,
      label: "Collection Rate",
      trend: 5.2,
    },
    distributionChart: {
      title: "Expense Categories",
      type: "pie",
      data: [
        { name: "Salaries", value: 45 },
        { name: "Operations", value: 25 },
        { name: "Utilities", value: 15 },
        { name: "Supplies", value: 10 },
        { name: "Other", value: 5 },
      ],
    },
  },

  // Principal: School performance, attendance, enrollment
  PRINCIPAL: {
    sectionTitle: "School Analytics",
    trendChart: {
      title: "Academic Performance",
      type: "line",
      data: {
        labels: ["Term 1", "Term 2", "Term 3", "Term 4"],
        current: [78, 82, 80, 85],
        previous: [75, 78, 77, 80],
      },
    },
    gaugeChart: {
      value: 92,
      label: "Attendance Rate",
      trend: 1.5,
    },
    distributionChart: {
      title: "Grade Level Distribution",
      type: "bar",
      data: [
        { name: "Grade 7", value: 120 },
        { name: "Grade 8", value: 115 },
        { name: "Grade 9", value: 108 },
        { name: "Grade 10", value: 95 },
        { name: "Grade 11", value: 88 },
        { name: "Grade 12", value: 82 },
      ],
    },
  },

  // Admin: User activity, system usage
  ADMIN: {
    sectionTitle: "System Analytics",
    trendChart: {
      title: "User Activity",
      type: "area",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        current: [245, 312, 298, 356, 289, 145, 98],
      },
    },
    gaugeChart: {
      value: 98,
      label: "System Health",
      trend: 0.5,
    },
    distributionChart: {
      title: "Module Usage",
      type: "bar",
      data: [
        { name: "Students", value: 35 },
        { name: "Teachers", value: 25 },
        { name: "Finance", value: 20 },
        { name: "Exams", value: 15 },
        { name: "Reports", value: 5 },
      ],
    },
  },

  // Developer: Platform growth, school distribution
  DEVELOPER: {
    sectionTitle: "Platform Analytics",
    trendChart: {
      title: "Platform Growth",
      type: "line",
      data: {
        labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        current: [35, 38, 42, 45, 48, 52],
        previous: [12000, 15000, 18000, 22000, 25000, 28000],
      },
    },
    gaugeChart: {
      value: 99.9,
      label: "Uptime",
      trend: 0.1,
    },
    distributionChart: {
      title: "Subscription Tiers",
      type: "pie",
      data: [
        { name: "Enterprise", value: 35 },
        { name: "Pro", value: 45 },
        { name: "Starter", value: 20 },
      ],
    },
  },
}

// ============================================================================
// TREND CHART COMPONENT
// ============================================================================

function TrendChart({ title, data, type }: { title: string; data: TrendChartData; type: "line" | "bar" | "area" }) {
  // Transform data for recharts
  const chartData = data.labels.map((label, i) => ({
    label,
    current: data.current[i],
    previous: data.previous?.[i],
  }))

  const config = type === "line" ? lineChartConfig : type === "bar" ? barChartConfig : areaChartConfig

  return (
    <Card className="border-none shadow-none bg-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
          {type === "line" ? (
            <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="current"
                stroke="var(--color-current)"
                strokeWidth={2}
                dot={false}
              />
              {data.previous && (
                <Line
                  type="monotone"
                  dataKey="previous"
                  stroke="var(--color-previous)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </LineChart>
          ) : type === "bar" ? (
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="current" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="current"
                fill="var(--color-value)"
                fillOpacity={0.4}
                stroke="var(--color-value)"
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// GAUGE CHART COMPONENT
// ============================================================================

function GaugeChart({ value, label, trend }: GaugeData) {
  const gaugeData = [{ value, fill: "hsl(var(--chart-1))" }]

  const gaugeConfig = {
    value: {
      label: label,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col border-none shadow-none bg-muted">
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={gaugeConfig} className="mx-auto aspect-square max-h-[200px]">
          <RadialBarChart
            data={gaugeData}
            startAngle={180}
            endAngle={180 - (value / 100) * 180}
            innerRadius={70}
            outerRadius={100}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[76, 64]}
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {value}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
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
      {trend !== undefined && (
        <CardFooter className="flex-col gap-1 text-sm pb-4">
          <div className="flex items-center gap-1 font-medium leading-none">
            {trend >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">+{trend}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-500">{trend}%</span>
              </>
            )}
            <span className="text-muted-foreground">vs last period</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// DISTRIBUTION CHART COMPONENT
// ============================================================================

function DistributionChart({ title, data, type }: { title: string; data: DistributionData[]; type: "bar" | "pie" }) {
  const config = data.reduce((acc, item, i) => {
    acc[item.name] = {
      label: item.name,
      color: pieColors[i % pieColors.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card className="border-none shadow-none bg-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
          {type === "bar" ? (
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CHART SECTION COMPONENT
// ============================================================================

/**
 * Role-specific chart section for dashboards.
 * Displays 2-3 practical charts relevant to each role.
 */
export function ChartSection({ role, className }: ChartSectionProps) {
  const [data, setData] = useState<RoleChartData>(
    defaultDataByRole[role] || defaultDataByRole.ADMIN
  )
  const [isLoading, setIsLoading] = useState(true)

  const sectionTitle = getChartSectionTitle(role)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getChartDataByRole(role)
        if (result && typeof result === "object") {
          setData(result as RoleChartData)
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
        // Keep default data on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [role])

  return (
    <section className={className}>
      <SectionHeading title={sectionTitle} />
      <div className="space-y-4">
        {/* Top row: Trend chart (2/3) + Gauge (1/3) */}
        <div className="grid gap-4 md:grid-cols-3">
          {data.trendChart && (
            <div className="md:col-span-2">
              <TrendChart
                title={data.trendChart.title}
                data={data.trendChart.data}
                type={data.trendChart.type}
              />
            </div>
          )}
          {data.gaugeChart && (
            <div className="md:col-span-1">
              <GaugeChart
                value={data.gaugeChart.value}
                label={data.gaugeChart.label}
                trend={data.gaugeChart.trend}
              />
            </div>
          )}
        </div>

        {/* Bottom row: Distribution chart (full width or partial) */}
        {data.distributionChart && (
          <DistributionChart
            title={data.distributionChart.title}
            data={data.distributionChart.data}
            type={data.distributionChart.type}
          />
        )}
      </div>
    </section>
  )
}

// ============================================================================
// STATIC CHART SECTION (For server components)
// ============================================================================

export interface StaticChartSectionProps {
  role: DashboardRole
  data?: RoleChartData
  className?: string
}

/**
 * Static version of ChartSection for server-side rendering.
 */
export function StaticChartSection({ role, data, className }: StaticChartSectionProps) {
  const chartData = data || defaultDataByRole[role] || defaultDataByRole.ADMIN
  const sectionTitle = getChartSectionTitle(role)

  return (
    <section className={className}>
      <SectionHeading title={sectionTitle} />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {chartData.trendChart && (
            <div className="md:col-span-2">
              <TrendChart
                title={chartData.trendChart.title}
                data={chartData.trendChart.data}
                type={chartData.trendChart.type}
              />
            </div>
          )}
          {chartData.gaugeChart && (
            <div className="md:col-span-1">
              <GaugeChart
                value={chartData.gaugeChart.value}
                label={chartData.gaugeChart.label}
                trend={chartData.gaugeChart.trend}
              />
            </div>
          )}
        </div>
        {chartData.distributionChart && (
          <DistributionChart
            title={chartData.distributionChart.title}
            data={chartData.distributionChart.data}
            type={chartData.distributionChart.type}
          />
        )}
      </div>
    </section>
  )
}
