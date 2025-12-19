"use client"

import { BookOpen, GraduationCap, TriangleAlert, Users } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { QuickLookData } from "./actions"
import { ChartSection } from "./chart-section"
import { InvoiceHistorySection } from "./invoice-history-section"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"
// New unified components
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import type { WeatherData } from "./weather-actions"

// ============================================================================
// TYPES
// ============================================================================

interface AdminDashboardClientProps {
  locale: string
  subdomain: string
  quickLookData?: QuickLookData
  weatherData?: WeatherData | null
}

// ============================================================================
// SECTION: Quick Stats (3 Cards with Icons)
// ============================================================================

const iconMap = {
  Students: Users,
  Teachers: GraduationCap,
  Classes: BookOpen,
}

// ============================================================================
// SECTION: Attendance Overview
// ============================================================================

// Radial grid chart data - attendance by grade
const attendanceByGradeData = [
  { grade: "G5", attendance: 96, fill: "var(--color-grade5)" },
  { grade: "G6", attendance: 94, fill: "var(--color-grade6)" },
  { grade: "G7", attendance: 92, fill: "var(--color-grade7)" },
  { grade: "G8", attendance: 88, fill: "var(--color-grade8)" },
  { grade: "G9", attendance: 91, fill: "var(--color-grade9)" },
  { grade: "G10", attendance: 85, fill: "var(--color-grade10)" },
]

const radialGridConfig = {
  attendance: {
    label: "Attendance %",
  },
  grade5: {
    label: "Grade 5",
    color: "hsl(var(--chart-1))",
  },
  grade6: {
    label: "Grade 6",
    color: "hsl(var(--chart-2))",
  },
  grade7: {
    label: "Grade 7",
    color: "hsl(var(--chart-3))",
  },
  grade8: {
    label: "Grade 8",
    color: "hsl(var(--chart-4))",
  },
  grade9: {
    label: "Grade 9",
    color: "hsl(var(--chart-5))",
  },
  grade10: {
    label: "Grade 10",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

// Radial shape chart data - overall attendance percentage
const overallAttendanceData = [{ attendance: 91, fill: "hsl(var(--chart-2))" }]

const radialShapeConfig = {
  attendance: {
    label: "Attendance",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

function AttendanceSection() {
  return (
    <section>
      <SectionHeading title="Attendance Overview" />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Radial Grid Chart - Attendance by Grade */}
        <Card className="bg-muted flex flex-col border-none shadow-none">
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={radialGridConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadialBarChart
                data={attendanceByGradeData}
                innerRadius={30}
                outerRadius={100}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="grade" />}
                />
                <PolarGrid gridType="circle" />
                <RadialBar dataKey="attendance" />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Radial Shape Chart - Overall 91% */}
        <Card className="bg-muted flex flex-col border-none shadow-none">
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={radialShapeConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadialBarChart
                data={overallAttendanceData}
                startAngle={90}
                endAngle={90 + (91 / 100) * 360}
                innerRadius={80}
                outerRadius={140}
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  className="first:fill-muted last:fill-background"
                  polarRadius={[86, 74]}
                />
                <RadialBar dataKey="attendance" background />
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
                              91%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Attendance
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
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-primary text-4xl font-bold">91%</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Average Attendance
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Attention Needed
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Grade 10 has 85% attendance
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Students</span>
                <span className="font-medium">196</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Present Today</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  178
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION: Quick Actions (Using unified component)
// ============================================================================

function QuickActionsSection({
  locale,
  subdomain,
}: {
  locale: string
  subdomain: string
}) {
  const actions = getQuickActionsByRole("ADMIN", subdomain)

  return (
    <section>
      <SectionHeading title="Quick Actions" />
      <QuickActions actions={actions} locale={locale} />
    </section>
  )
}

// ============================================================================
// SECTION: Hero Section (Upcoming + Weather)
// ============================================================================

function HeroSection({
  locale,
  subdomain,
  weatherData,
}: {
  locale: string
  subdomain: string
  weatherData?: WeatherData | null
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <Upcoming role="ADMIN" locale={locale} subdomain={subdomain} />
      <Weather
        current={weatherData?.current}
        forecast={weatherData?.forecast}
        location={weatherData?.location}
        className="lg:w-[280px] lg:self-end"
      />
    </div>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function AdminDashboardClient({
  locale,
  subdomain,
  quickLookData,
  weatherData,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* ============ TOP HERO SECTION (Unified Order) ============ */}
      <div className="space-y-6">
        {/* Section 1: Upcoming + Weather */}
        <HeroSection
          locale={locale}
          subdomain={subdomain}
          weatherData={weatherData}
        />

        {/* Section 2: Quick Look (with real data) */}
        <QuickLookSection
          locale={locale}
          subdomain={subdomain}
          data={quickLookData}
        />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <QuickActionsSection locale={locale} subdomain={subdomain} />

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="ADMIN" />

        {/* Section 5: Invoice History */}
        <InvoiceHistorySection role="ADMIN" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="ADMIN" />
      </div>

      {/* ============ ADMIN-SPECIFIC SECTIONS ============ */}

      {/* Section 8: Attendance Overview */}
      <AttendanceSection />
    </div>
  )
}
